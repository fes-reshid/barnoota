import codecs
import os
import struct
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import programs_core as programs  # noqa: E402
import speed_core as speed  # noqa: E402
import usage_core as usage  # noqa: E402

DAY = 86400


def userassist_data(count, last_unix):
    data = bytearray(72)
    struct.pack_into("<I", data, 4, count)
    struct.pack_into("<Q", data, 60, int(last_unix * 10_000_000) + usage._FILETIME_EPOCH)
    return bytes(data)


def program(name, location="", publisher="Acme", installed="2022-01-01", size=1000):
    return programs.Program(name, publisher, "1.0", size, installed, location, "uninstall.exe", "key")


class UsageTests(unittest.TestCase):
    def test_userassist_values(self):
        env = {"ProgramFiles": r"C:\Program Files", "LOCALAPPDATA": r"C:\Users\Me\AppData\Local"}
        name = codecs.encode(r"{6D809377-6AF0-444B-8957-A3773F02200E}\Acme\acme.exe", "rot13")
        path, count, last = usage.parse_userassist_value(name, userassist_data(7, 1_700_000_000), env)
        self.assertEqual(path, r"C:\Program Files\Acme\acme.exe")
        self.assertEqual(count, 7)
        self.assertAlmostEqual(last, 1_700_000_000, delta=1)
        self.assertIsNone(usage.parse_userassist_value(codecs.encode("UEME_CTLSESSION", "rot13"), userassist_data(1, 1), env))
        self.assertIsNone(usage.parse_userassist_value(name, b"short", env))

    def test_prefetch_names_and_times(self):
        with tempfile.TemporaryDirectory() as folder:
            for name, age in (("ACME.EXE-1A2B3C4D.pf", 5 * DAY), ("ACME.EXE-99999999.pf", 40 * DAY), ("OTHER.EXE-0.pf", DAY)):
                path = os.path.join(folder, name)
                open(path, "w").close()
                os.utime(path, (time.time() - age,) * 2)
            open(os.path.join(folder, "readme.txt"), "w").close()
            found = usage.read_prefetch(folder)
            self.assertEqual(set(found), {"ACME.EXE", "OTHER.EXE"})
            self.assertAlmostEqual(found["ACME.EXE"], time.time() - 5 * DAY, delta=60)
        self.assertEqual(usage.read_prefetch(os.path.join(folder, "missing")), {})

    def test_unused_report(self):
        now = time.time()
        with tempfile.TemporaryDirectory() as root:
            def make(name, exe="app.exe"):
                folder = os.path.join(root, name)
                os.makedirs(folder)
                open(os.path.join(folder, exe), "w").close()
                open(os.path.join(folder, "unins000.exe"), "w").close()
                return folder
            old, recent, never, brand_new, nothing = make("Old"), make("Recent"), make("Never"), make("New"), make("Silent")
            ua = {os.path.normcase(os.path.join(old, "app.exe")): (3, now - 400 * DAY),
                  os.path.normcase(os.path.join(recent, "app.exe")): (9, now - 10 * DAY)}
            pf = {}
            items = [program("Old App", old, size=500), program("Recent App", recent), program("Never App", never, size=900),
                     program("New App", brand_new, installed=time.strftime("%Y-%m-%d", time.localtime(now - 5 * DAY))),
                     program("Runtime", old, publisher="Microsoft Corporation").__class__("Visual C++ Redistributable", "", "1", 5, "", old, "u", "k"),
                     program("No Folder", "")]
            report = usage.unused_report(items, ua, pf, months=6, now=now)
            self.assertEqual([u.program.name for u in report], ["Never App", "Old App"])  # biggest first
            self.assertTrue(report[1].last_used)
            self.assertEqual(report[0].last_used, 0)
            self.assertIn("2022-01-01", report[0].note)
            # without any run history at all, "no record" proves nothing, so only real evidence is listed
            names = [u.program.name for u in usage.unused_report(items, {}, {os.path.basename(old): 1}, months=6, now=now)]
            self.assertEqual(names, [])
            # a Prefetch entry for one of its exes counts as use
            pf = {"APP.EXE": now - DAY}
            self.assertEqual(usage.unused_report([program("Old App", old)], ua, pf, 6, now), [])

    def test_components_are_never_listed(self):
        self.assertTrue(usage.is_component(program("Microsoft Visual C++ 2019 Redistributable (x64)")))
        self.assertTrue(usage.is_component(program("Intel Graphics Driver", publisher="Intel Corporation")))
        self.assertFalse(usage.is_component(program("VLC media player", publisher="VideoLAN")))


class SpeedTests(unittest.TestCase):
    def titles(self, data):
        return [c.title for c in speed.diagnose(data, now=time.mktime(time.strptime("2026-11-01", "%Y-%m-%d")))]

    def test_healthy_pc(self):
        data = {"total_kb": 16 * 1024 ** 2, "free_kb": 9 * 1024 ** 2, "load": 12, "disk": 3, "c_total": 500e9, "c_free": 300e9,
                "startup": ["a", "b"], "boot": "2026-10-30T08:00:00", "plan": "Balanced", "c_kind": "ssd", "mem": [], "cpu": []}
        causes = speed.diagnose(data)
        self.assertEqual(len(causes), 1)
        self.assertEqual(causes[0].level, speed.INFO)

    def test_causes_in_order(self):
        data = {"total_kb": 4 * 1024 ** 2, "free_kb": 0.3 * 1024 ** 2, "load": 95, "disk": 100, "c_total": 100e9, "c_free": 5e9,
                "startup": [str(i) for i in range(20)], "boot": "2026-09-01T08:00:00", "plan": "Power saver (GUID)",
                "pending": True, "c_kind": "hdd", "mem": [{"name": "chrome", "count": 20, "mem": 3 * 1024 ** 3}],
                "cpu": [{"name": "chrome#1", "cpu": 40}, {"name": "chrome", "cpu": 30}, {"name": "svchost", "cpu": 5}]}
        causes = speed.diagnose(data, now=time.mktime(time.strptime("2026-11-01", "%Y-%m-%d")))
        keys = [(c.level, c.key) for c in causes]
        self.assertEqual(keys[0][0], speed.HIGH)
        self.assertIn(speed.HIGH, [k[0] for k in keys])
        for key in ("taskmgr", "junk", "startup", "restart", "power"):
            self.assertIn(key, [k[1] for k in keys])
        order = {speed.HIGH: 0, speed.MEDIUM: 1, speed.LOW: 2, speed.INFO: 3}
        self.assertEqual([order[c.level] for c in causes], sorted(order[c.level] for c in causes))
        self.assertIn("chrome (70%)", next(c.detail for c in causes if "processor" in c.title))

    def test_cpu_names_are_merged(self):
        rows = [{"name": "chrome#1", "cpu": 10}, {"name": "chrome#2", "cpu": 5}, {"name": "idle", "cpu": 0}, {"name": "a", "cpu": 3}]
        self.assertEqual(speed.top_by_cpu(rows), [("chrome", 15), ("a", 3)])
        self.assertEqual(speed.top_by_cpu(None), [])


if __name__ == "__main__":
    unittest.main()
