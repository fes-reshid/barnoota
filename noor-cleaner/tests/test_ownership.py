import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import ownership  # noqa: E402
import programs_core as programs  # noqa: E402

ENV = {"SystemRoot": r"C:\Windows", "ProgramFiles": r"C:\Program Files", "ProgramFiles(x86)": r"C:\Program Files (x86)",
       "ProgramData": r"C:\ProgramData", "LOCALAPPDATA": r"C:\Users\Me\AppData\Local", "APPDATA": r"C:\Users\Me\AppData\Roaming"}


def program(name, publisher, location):
    return programs.Program(name, publisher, "1.0", 0, "2024-01-01", location, "u", "k")


INSTALLED = [program("Google Chrome", "Google LLC", r"C:\Program Files\Google\Chrome\Application"),
             program("VLC media player", "VideoLAN", r"C:\Program Files\VideoLAN\VLC"),
             program("Discord", "Discord Inc.", r"C:\Users\Me\AppData\Local\Discord"),
             program("Sample", "Nobody", r"C:\Program Files")]  # a too-broad location must never claim everything


class OwnershipTests(unittest.TestCase):
    def setUp(self):
        self.index = ownership.OwnerIndex(INSTALLED, ENV)

    def owner(self, path):
        o = self.index.owner_of(path)
        return o.kind, o.name

    def test_inside_the_install_folder(self):
        self.assertEqual(self.owner(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
                         (ownership.PROGRAM, "Google Chrome"))
        self.assertEqual(self.owner(r"C:\Users\Me\AppData\Local\Discord\app-1.0\x.dll"), (ownership.PROGRAM, "Discord"))

    def test_data_folders_named_after_the_program_or_its_publisher(self):
        self.assertEqual(self.owner(r"C:\Users\Me\AppData\Local\Google\Chrome\User Data\Default\Cache\f_1"),
                         (ownership.PROGRAM, "Google Chrome"))
        self.assertEqual(self.owner(r"C:\Users\Me\AppData\Roaming\vlc\vlcrc"), (ownership.PROGRAM, "VLC media player"))

    def test_windows_other_and_personal(self):
        self.assertEqual(self.owner(r"C:\Windows\Temp\x.tmp")[0], ownership.WINDOWS)
        self.assertEqual(self.owner(r"C:\Users\Me\AppData\Local\Temp\a.tmp")[0], ownership.OTHER)
        self.assertEqual(self.owner(r"C:\Users\Me\Documents\cv.docx")[0], ownership.PERSONAL)
        self.assertEqual(self.owner(r"D:\Videos\trip.mp4")[0], ownership.PERSONAL)

    def test_data_of_a_program_that_is_not_installed(self):
        self.assertEqual(self.owner(r"C:\Users\Me\AppData\Local\Zorblax\cache\a.bin"), (ownership.DATA, "Zorblax"))

    def test_summary_lists_programs_first(self):
        items = [(r"C:\Users\Me\Documents\cv.docx", 10), (r"C:\Program Files\Google\Chrome\Application\a.dll", 20),
                 (r"C:\Program Files\Google\Chrome\Application\b.dll", 30), (r"C:\Windows\Temp\x.tmp", 5)]
        rows, groups = ownership.summarise(self.index, items)
        self.assertEqual(list(groups), ["Google Chrome", "Windows", "Your own files"])
        self.assertEqual(groups["Google Chrome"], [ownership.PROGRAM, 2, 50])
        self.assertEqual(rows[0][3], ownership.PROGRAM)


if __name__ == "__main__":
    unittest.main()
