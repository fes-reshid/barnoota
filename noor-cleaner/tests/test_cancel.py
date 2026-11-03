import os
import sys
import threading
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import ui_base  # noqa: E402


class CancelTests(unittest.TestCase):
    def test_a_cancelled_job_can_no_longer_report(self):
        events = ui_base.JobQueue()
        thread = threading.Thread(target=lambda: events.put(("late", 1)))
        thread.cancelled = True
        thread.start()
        thread.join()
        self.assertTrue(events.empty())
        live = threading.Thread(target=lambda: events.put(("fine", 2)))
        live.cancelled = False
        live.start()
        live.join()
        self.assertEqual(events.get_nowait(), ("fine", 2))
        events.put(("main thread", 3))  # the window itself is never cancelled
        self.assertEqual(events.get_nowait(), ("main thread", 3))

    def test_current_cancel_belongs_to_the_running_job(self):
        self.assertIsNone(ui_base.BaseApp.current_cancel())
        seen = []
        thread = threading.Thread(target=lambda: seen.append(ui_base.BaseApp.current_cancel()))
        thread.cancel_event = threading.Event()
        thread.start()
        thread.join()
        self.assertIs(seen[0], thread.cancel_event)


if __name__ == "__main__":
    unittest.main()
