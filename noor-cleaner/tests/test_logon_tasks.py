import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import reminder  # noqa: E402


class LogonTaskTests(unittest.TestCase):
    def test_creating_and_removing_a_task(self):
        calls = []
        self.assertTrue(reminder.logon_task("NoorGuard tray", "--tray", True, runner=lambda a: calls.append(a) or 0, elevated=True))
        args = calls[0]
        self.assertEqual(args[:2], ["/create", "/tn"])
        self.assertEqual(args[2], "NoorGuard tray")
        self.assertTrue(args[4].endswith("--tray"))
        for expected in ("/sc", "onlogon", "/rl", "highest", "/f"):
            self.assertIn(expected, args)
        self.assertFalse(reminder.logon_task("x", "--tray", True, runner=lambda a: 1, elevated=True))  # refused
        calls.clear()
        reminder.logon_task("y", "--tray", True, runner=lambda a: calls.append(a) or 0, elevated=False)
        self.assertIn("limited", calls[0])  # a standard user's task never asks for more rights
        self.assertNotIn("highest", calls[0])
        calls.clear()
        self.assertTrue(reminder.logon_task("x", "--tray", False, runner=lambda a: calls.append(a) or 0))
        self.assertEqual(calls[0], ["/delete", "/tn", "x", "/f"])

    def test_ensure_tasks_only_creates_what_the_settings_ask_for(self):
        made = []
        real = reminder._switch
        reminder._switch = lambda task, value, arg, enabled: made.append((task, arg, enabled))
        try:
            missing = lambda args: 1  # noqa: E731  (every query says "no such task")
            reminder.ensure_tasks({"tray_autostart": True}, "guard", runner=missing)
            reminder.ensure_tasks({"reminder_days": 30}, "cleaner", runner=missing)
            reminder.ensure_tasks({"tray_autostart": True, "reminder_days": 30}, "cleaner", runner=lambda a: 0)
            reminder.ensure_tasks({}, "guard", runner=missing)
        finally:
            reminder._switch = real
        self.assertEqual(made, [("NoorGuard tray", "--tray", True), ("NoorCleaner reminder", "--remind", True)])


if __name__ == "__main__":
    unittest.main()
