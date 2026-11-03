import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import ui_runmode as rm  # noqa: E402


class StartActionTests(unittest.TestCase):
    def test_decisions(self):
        a = rm.start_action
        self.assertEqual(a("ask", False), "ask")
        self.assertEqual(a(None, False), "ask")
        self.assertEqual(a("admin", False), "elevate")
        self.assertEqual(a("standard", False), "run")
        self.assertEqual(a("ask", True), "run")      # already administrator: never ask
        self.assertEqual(a("admin", True), "run")
        self.assertEqual(a("ask", False, background=True), "run")   # quiet start at sign-in: never interrupt
        self.assertEqual(a("admin", False, background=True), "run")


if __name__ == "__main__":
    unittest.main()
