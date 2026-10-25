import os
import struct
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import recovery_core as recovery  # noqa: E402


def to_filetime(unix_time):
    return int(unix_time * 1e7) + 116444736000000000


def info_v2(path, size, deleted):
    name = (path + "\0").encode("utf-16-le")
    return struct.pack("<qqqi", 2, size, to_filetime(deleted), len(name) // 2) + name


def info_v1(path, size, deleted):
    name = path.encode("utf-16-le").ljust(520, b"\0")
    return struct.pack("<qqq", 1, size, to_filetime(deleted)) + name


class RecycleBinTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = self.tmp.name
        self.bin = os.path.join(self.root, "$Recycle.Bin", "S-1-5-21-1")
        os.makedirs(self.bin)

    def tearDown(self):
        self.tmp.cleanup()

    def recycle(self, suffix, original, data=b"hello", info=info_v2, deleted=None):
        with open(os.path.join(self.bin, "$I" + suffix), "wb") as f:
            f.write(info(original, len(data), deleted or time.time()))
        with open(os.path.join(self.bin, "$R" + suffix), "wb") as f:
            f.write(data)

    def test_parse_both_versions(self):
        when = 1_760_000_000.0
        for builder in (info_v1, info_v2):
            path, size, deleted = recovery.parse_recycle_info(builder(r"C:\Users\me\Report.docx", 1234, when))
            self.assertEqual((path, size), (r"C:\Users\me\Report.docx", 1234))
            self.assertAlmostEqual(deleted, when, places=3)
        self.assertIsNone(recovery.parse_recycle_info(b"junk"))
        self.assertIsNone(recovery.parse_recycle_info(struct.pack("<qqqi", 9, 0, 0, 0)))

    def test_list_and_restore(self):
        docs = os.path.join(self.root, "Documents")
        self.recycle("ABC123.docx", os.path.join(docs, "Report.docx"), b"report", deleted=1000)
        self.recycle("DEF456.jpg", os.path.join(docs, "Photos", "cat.jpg"), b"cat", info=info_v1, deleted=2000)
        with open(os.path.join(self.bin, "$IORPHAN.txt"), "wb") as f:  # contents already gone
            f.write(info_v2(os.path.join(docs, "gone.txt"), 1, 3000))

        items = recovery.list_recycle_bin([self.bin])
        self.assertEqual([os.path.basename(i.original) for i in items], ["cat.jpg", "Report.docx"])  # newest first

        restored = recovery.restore_recycled(items[0])
        self.assertEqual(restored, os.path.join(docs, "Photos", "cat.jpg"))  # folder recreated
        with open(restored, "rb") as f:
            self.assertEqual(f.read(), b"cat")
        self.assertFalse(os.path.exists(items[0].info_path) or os.path.exists(items[0].data_path))

        os.makedirs(docs, exist_ok=True)
        with open(os.path.join(docs, "Report.docx"), "wb") as f:
            f.write(b"newer")
        restored = recovery.restore_recycled(items[1])
        self.assertEqual(os.path.basename(restored), "Report (restored).docx")  # never overwrites
        self.assertEqual(recovery.list_recycle_bin([self.bin]), [])

    def test_restore_folder_to_other_place(self):
        os.makedirs(os.path.join(self.bin, "$RFOLD01", "inner"))
        with open(os.path.join(self.bin, "$RFOLD01", "inner", "a.txt"), "w") as f:
            f.write("a")
        with open(os.path.join(self.bin, "$IFOLD01"), "wb") as f:
            f.write(info_v2(r"C:\Old\Project", 1, time.time()))
        item = recovery.list_recycle_bin([self.bin])[0]
        self.assertTrue(item.is_folder)
        target = os.path.join(self.root, "Recovered")
        restored = recovery.restore_recycled(item, target)
        self.assertTrue(os.path.exists(os.path.join(restored, "inner", "a.txt")))
        self.assertEqual(restored, os.path.join(target, "Project"))


class RestorePointTests(unittest.TestCase):
    def test_find_and_restore_missing(self):
        with tempfile.TemporaryDirectory() as snap, tempfile.TemporaryDirectory() as live:
            def write(root, rel, data=b"x"):
                path = os.path.normpath(os.path.join(root, rel))
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "wb") as f:
                    f.write(data)
            for rel in ("Docs/kept.txt", "Docs/deleted.txt", "Gone/whole/folder.pdf", "AppData/cache.bin"):
                write(snap, rel, b"old " + rel.encode())
            write(live, "Docs/kept.txt")
            write(live, "Docs/new.txt")

            seen = []
            missing = recovery.find_missing_files(snap, live, on_progress=lambda s, m: seen.append(s))
            rels = sorted(os.path.relpath(m.live_path, live).replace(os.sep, "/") for m in missing)
            self.assertEqual(rels, ["Docs/deleted.txt", "Gone/whole/folder.pdf"])  # AppData skipped
            self.assertTrue(seen)

            for item in missing:
                restored = recovery.restore_missing(item)
                self.assertEqual(restored, item.live_path)
                self.assertTrue(os.path.exists(item.snapshot_path))  # restore points are only read
            with open(os.path.join(live, "Gone", "whole", "folder.pdf"), "rb") as f:
                self.assertEqual(f.read(), b"old Gone/whole/folder.pdf")
            self.assertEqual(recovery.find_missing_files(snap, live), [])

    def test_shadow_json_and_paths(self):
        one = '{"device":"\\\\\\\\?\\\\GLOBALROOT\\\\Device\\\\HarddiskVolumeShadowCopy3","drive":"C:","created":"2026-10-20 03:00"}'
        copies = recovery.parse_shadow_json(one)
        self.assertEqual(copies[0].drive, "C:")
        self.assertEqual(copies[0].label, "C:  -  2026-10-20 03:00")
        many = ('[{"device":"A","drive":"C:","created":"2026-10-01 09:00"},'
                '{"device":"B","drive":null,"created":"2026-10-21 09:00"},{"device":null}]')
        self.assertEqual([c.device for c in recovery.parse_shadow_json(many)], ["B", "A"])
        self.assertEqual(recovery.parse_shadow_json("  "), [])
        shadow = recovery.ShadowCopy(r"\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy3", "C:", "")
        if os.name == "nt":
            self.assertEqual(recovery.snapshot_path(shadow, r"C:\Users\me"),
                             r"\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy3\Users\me")


class WinfrTests(unittest.TestCase):
    def test_command(self):
        dest = os.path.join(os.path.abspath(os.sep), "Recovered") if os.name != "nt" else r"E:\Recovered"
        cmd = recovery.winfr_command("C:", dest, "*.docx, holiday")
        self.assertEqual(cmd, f'winfr C: "{dest}" /regular /n *.docx /n *holiday*')
        self.assertIn("/extensive", recovery.winfr_command("C:\\", dest, "*.pdf", thorough=True))
        with self.assertRaises(ValueError):
            recovery.winfr_command("C:", dest, "  ")
        if os.name == "nt":
            with self.assertRaises(ValueError):  # never recover onto the same drive
                recovery.winfr_command("C:", r"C:\Recovered", "*.pdf")

    def test_unique_target(self):
        with tempfile.TemporaryDirectory() as root:
            path = os.path.join(root, "a.txt")
            self.assertEqual(recovery.unique_target(path), path)
            for name in ("a.txt", "a (restored).txt"):
                open(os.path.join(root, name), "w").close()
            self.assertEqual(os.path.basename(recovery.unique_target(path)), "a (restored 2).txt")


if __name__ == "__main__":
    unittest.main()
