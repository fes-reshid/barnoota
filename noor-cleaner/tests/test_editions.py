import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import editions  # noqa: E402
import i18n  # noqa: E402
import settings  # noqa: E402


class EditionTests(unittest.TestCase):
    def test_each_program_has_its_own_pages(self):
        cleaner, guard = set(editions.CLEANER.pages), set(editions.GUARD.pages)
        self.assertIn("junk", cleaner)
        self.assertNotIn("network", cleaner)
        self.assertNotIn("threats", cleaner)
        self.assertIn("network", guard)
        self.assertIn("privacy", guard)
        self.assertNotIn("junk", guard)
        self.assertNotIn("space", guard)
        self.assertEqual(cleaner & guard, {"scan", "quarantine", "settings"})  # only what both truly need

    def test_every_page_is_known_to_the_window(self):
        known = {"scan", "space", "junk", "dups", "programs", "threats", "corrupt", "health", "network", "security",
                 "privacy", "files", "recover", "quarantine", "settings"}
        for edition in editions.EDITIONS.values():
            self.assertLessEqual(set(edition.pages), known)

    def test_the_other_program_shows_its_own_name(self):
        try:
            i18n.set_brand("NoorGuard", "نور جارد")
            self.assertEqual(i18n._("NoorCleaner is not running as administrator."),
                             "NoorGuard is not running as administrator.")
            i18n.set_language("ar")
            self.assertNotIn("نور كلينر", i18n._("Save and restart NoorCleaner"))
            self.assertIn("نور جارد", i18n._("Save and restart NoorCleaner"))
        finally:
            i18n.set_brand("NoorCleaner", "نور كلينر")
            i18n.set_language("en")
        self.assertEqual(i18n._("NoorCleaner is not running as administrator."),
                         "NoorCleaner is not running as administrator.")


class SharedSettingsTests(unittest.TestCase):
    def test_one_program_does_not_overwrite_the_others_changes(self):
        with tempfile.TemporaryDirectory() as folder:
            real = settings.SETTINGS_FILE, settings.INSTALLER_CHOICES_FILE
            settings.SETTINGS_FILE = os.path.join(folder, "settings.json")
            settings.INSTALLER_CHOICES_FILE = os.path.join(folder, "installer.txt")
            try:
                cleaner = settings.load()      # both programs start with the same file
                guard = settings.load()
                cleaner["reminder_days"] = 30  # NoorCleaner changes its own setting
                settings.save(cleaner)
                guard["live_monitor"] = True   # NoorGuard saves later with an older copy of the rest
                settings.save(guard)
                saved = json.load(open(settings.SETTINGS_FILE))
                self.assertEqual(saved["reminder_days"], 30)
                self.assertTrue(saved["live_monitor"])
                guard["language"] = "ar"       # and again, from the same copy
                settings.save(guard)
                self.assertEqual(json.load(open(settings.SETTINGS_FILE))["live_monitor"], True)
                self.assertEqual(json.load(open(settings.SETTINGS_FILE))["reminder_days"], 30)
            finally:
                settings.SETTINGS_FILE, settings.INSTALLER_CHOICES_FILE = real


if __name__ == "__main__":
    unittest.main()
