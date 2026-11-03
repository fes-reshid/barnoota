import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import programs_core as programs  # noqa: E402


class UninstallWatchTests(unittest.TestCase):
    def test_cannot_tell_means_still_installed(self):
        program = programs.Program("X", "P", "1", 0, "", "", "u", r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\X")
        if os.name != "nt":
            self.assertTrue(programs.is_still_installed(program))   # no registry here: never claim it is gone
        self.assertTrue(programs.is_still_installed(programs.Program("Y", "P", "1", 0, "", "", "u", "")))  # no key to look for


if __name__ == "__main__":
    unittest.main()
