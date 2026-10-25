import json
import os
import sys
import tempfile
import time
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import cleaner_core as storage  # noqa: E402
import health_core as health  # noqa: E402
import photos_core as photos  # noqa: E402
import programs_core as programs  # noqa: E402
import reminder  # noqa: E402
import scanner_core as core  # noqa: E402
import settings  # noqa: E402


class ProgramTests(unittest.TestCase):
    def test_split_command(self):
        self.assertEqual(programs.split_command('"C:\\Program Files\\App\\unins000.exe" /SILENT'),
                         ("C:\\Program Files\\App\\unins000.exe", "/SILENT"))
        self.assertEqual(programs.split_command("C:\\Program Files\\App\\uninstall.exe /x"),
                         ("C:\\Program Files\\App\\uninstall.exe", "/x"))
        self.assertEqual(programs.split_command("MsiExec.exe /X{1234}"), ("MsiExec.exe", "/X{1234}"))
        self.assertEqual(programs.split_command("C:\\a.exe.backup\\b.exe -q"), ("C:\\a.exe.backup\\b.exe", "-q"))
        self.assertEqual(programs.split_command(""), ("", ""))

    def test_program_from_values(self):
        p = programs.program_from_values({"DisplayName": "Zoom", "UninstallString": "u.exe", "EstimatedSize": 2048,
                                          "InstallDate": "20260131", "Publisher": "Zoom", "DisplayVersion": "6.1"})
        self.assertEqual((p.name, p.size, p.installed, p.version), ("Zoom", 2 * 1024 * 1024, "2026-01-31", "6.1"))
        for hidden in ({"DisplayName": "x"}, {"UninstallString": "u"},
                       {"DisplayName": "KB1", "UninstallString": "u", "ParentKeyName": "Office"},
                       {"DisplayName": "c", "UninstallString": "u", "SystemComponent": 1},
                       {"DisplayName": "h", "UninstallString": "u", "ReleaseType": "Hotfix"}):
            self.assertIsNone(programs.program_from_values(hidden))
        self.assertEqual(programs.parse_install_date("2026-01-01"), "")

    def test_startup_flags(self):
        self.assertTrue(programs.is_enabled_flag(programs.approved_value(True)))
        disabled = programs.approved_value(False, now=1_760_000_000)
        self.assertFalse(programs.is_enabled_flag(disabled))
        self.assertEqual(len(disabled), 12)
        self.assertTrue(programs.is_enabled_flag(b""))  # no switch yet = enabled
        self.assertTrue(programs.is_enabled_flag(bytes([6, 0, 0, 0])))
        self.assertFalse(programs.is_enabled_flag(bytes([7, 0, 0, 0])))


class HealthTests(unittest.TestCase):
    def test_parse_and_verdict(self):
        text = json.dumps([
            {"name": "Samsung SSD 980", "media": "SSD", "bus": "NVMe", "size": 500107862016, "health": "Healthy",
             "status": "OK", "temperature": 41, "wear": 3, "hours": 1200, "read_errors": 0, "write_errors": 0},
            {"name": "Old HDD", "media": "HDD", "health": "Warning", "status": "OK", "temperature": 0,
             "wear": None, "read_errors": 12},
            {"name": "Worn SSD", "media": "SSD", "health": "Unhealthy", "status": "Predictive Failure",
             "wear": 100, "temperature": 66},
        ])
        good, old, worn = health.parse_disks(text)
        self.assertEqual(good.verdict(), (health.GOOD, []))
        self.assertIsNone(old.temperature)  # 0 means "not reported"
        level, reasons = old.verdict()
        self.assertEqual(level, health.WARNING)
        self.assertEqual(len(reasons), 2)
        level, reasons = worn.verdict()
        self.assertEqual(level, health.BAD)
        self.assertEqual(len(reasons), 4)
        self.assertEqual(health.parse_disks('{"name": "One"}')[0].name, "One")
        self.assertEqual(health.parse_disks(""), [])


@unittest.skipUnless(photos.available(), "Pillow is not installed")
class PhotoTests(unittest.TestCase):
    def test_similar_photos(self):
        from PIL import Image, ImageDraw
        with tempfile.TemporaryDirectory() as root:
            def save(name, image, **options):
                path = os.path.join(root, name)
                image.save(path, **options)
                return core.FileEntry(path, os.path.getsize(path), 0)

            scene = Image.new("RGB", (800, 600))
            draw = ImageDraw.Draw(scene)
            for i in range(0, 800, 40):
                draw.rectangle([i, 0, i + 20, 600], fill=(i % 255, 120, 255 - i % 255))
            draw.ellipse([200, 150, 600, 450], fill=(250, 220, 40))
            other = Image.new("RGB", (800, 600))
            ImageDraw.Draw(other).rectangle([0, 300, 800, 600], fill=(10, 200, 10))
            entries = [save("original.png", scene), save("small copy.jpg", scene.resize((400, 300)), quality=70),
                       save("whatsapp.jpg", scene, quality=35), save("different.png", other)]
            groups = photos.find_similar_photos(entries, min_size=0)
            self.assertEqual(len(groups), 1)
            names = [os.path.basename(p.entry.path) for p in groups[0]]
            self.assertEqual(sorted(names), ["original.png", "small copy.jpg", "whatsapp.jpg"])
            self.assertEqual(groups[0][-1].width, 400)  # smallest last; best quality is kept first
            self.assertIn(groups[0][0].pixels, (480000,))
        self.assertEqual(photos.hamming(0b1011, 0b0001), 2)


class DownloadsAndReminderTests(unittest.TestCase):
    def test_old_downloads(self):
        with tempfile.TemporaryDirectory() as root:
            def write(name, age_days):
                path = os.path.join(root, name)
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "wb") as f:
                    f.write(b"x" * (len(name) * 10))
                t = time.time() - age_days * 86400
                os.utime(path, (t, t))
            write("setup-zoom.exe", 200)
            write("photos.zip", 100)
            write("new-installer.msi", 5)
            write("letter.docx", 400)  # documents are not leftovers
            write("sub/old.iso", 365)
            found = storage.old_downloads(root, min_age_days=90)
            self.assertEqual(sorted(os.path.basename(e.path) for e in found), ["old.iso", "photos.zip", "setup-zoom.exe"])
            self.assertEqual(found[0].size, max(e.size for e in found))

    def test_reminder_schedule(self):
        with tempfile.TemporaryDirectory() as root, \
                mock.patch.multiple(settings, SETTINGS_FILE=os.path.join(root, "settings.json"),
                                    INSTALLER_CHOICES_FILE=os.path.join(root, "installer.txt")):
            self.assertFalse(reminder.is_due(settings.load()))
            reminder.set_reminder(30)
            data = settings.load()
            self.assertEqual(data["reminder_days"], 30)
            self.assertFalse(reminder.is_due(data))  # not straight away
            self.assertTrue(reminder.is_due(data, now=time.time() + 31 * 86400))
            reminder.set_reminder(0)
            self.assertFalse(reminder.is_due(settings.load(), now=time.time() + 400 * 86400))

    def test_installer_language_is_adopted(self):
        with tempfile.TemporaryDirectory() as root, \
                mock.patch.multiple(settings, SETTINGS_FILE=os.path.join(root, "settings.json"),
                                    INSTALLER_CHOICES_FILE=os.path.join(root, "installer.txt")):
            self.assertIsNone(settings.load()["language"])
            with open(os.path.join(root, "installer.txt"), "w") as f:
                f.write("language=om\r\nreminder_days=30\r\n")
            data = settings.load()
            self.assertEqual((data["language"], data["reminder_days"]), ("om", 30))
            self.assertFalse(reminder.is_due(data))  # the first reminder waits a month
            self.assertFalse(os.path.exists(os.path.join(root, "installer.txt")))
            self.assertEqual(settings.load()["language"], "om")  # saved for good


if __name__ == "__main__":
    unittest.main()
