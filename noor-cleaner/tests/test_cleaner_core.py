import os
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import cleaner_core as storage  # noqa: E402
import scanner_core as core  # noqa: E402


class CleanerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, rel, data, age_hours=0):
        path = os.path.normpath(os.path.join(self.root, rel))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        if age_hours:
            old = time.time() - age_hours * 3600
            os.utime(path, (old, old))
        return path

    def scan(self, root=None):
        files = []
        core.Scanner([root or self.root], check_corrupted=False, check_threats=False,
                     on_file=files.append).run()
        return files

    def test_storage_report(self):
        self.write("Videos/film.mp4", b"v" * 5000)
        self.write("Videos/Trips/clip.mov", b"v" * 3000)
        self.write("Docs/a.pdf", b"d" * 100)
        self.write("Docs/b.txt", b"d" * 50)
        self.write("loose.bin", b"x" * 10)
        report = storage.StorageReport.build(self.scan())

        self.assertEqual(report.total_bytes, 8160)
        self.assertEqual(report.total_files, 5)
        self.assertEqual(report.totals[self.root], [8160, 5])
        videos = os.path.join(self.root, "Videos")
        self.assertEqual(report.totals[videos], [8000, 2])
        self.assertEqual(report.direct[videos], [5000, 1])
        self.assertEqual(report.children[self.root][0], videos)  # biggest subfolder first
        self.assertEqual(report.direct[self.root], [10, 1])
        self.assertEqual(report.by_type["Videos"], [8000, 2])
        self.assertEqual(report.by_type["Documents"], [150, 2])
        self.assertEqual(report.by_type["Game & app data"], [10, 1])
        self.assertEqual([os.path.basename(e.path) for e in report.biggest[:2]], ["film.mp4", "clip.mov"])
        self.assertEqual(storage.StorageReport.build([]).total_files, 0)

    def test_drive_usage(self):
        total, used, free = storage.drive_usage(self.root)
        self.assertGreater(total, 0)
        self.assertIsNone(storage.drive_usage(os.path.join(self.root, "missing")))

    def test_junk_measure_and_clean(self):
        old = self.write("Temp/old.tmp", b"x" * 400, age_hours=48)
        new = self.write("Temp/new.tmp", b"x" * 100)
        nested = self.write("Temp/setup/part.cab", b"x" * 200, age_hours=48)
        keep = self.write("Explorer/settings.ini", b"keep")
        thumb = self.write("Explorer/thumbcache_256.db", b"t" * 70)

        temp = storage.JunkCategory("temp", "Temp", "", [os.path.join(self.root, "Temp")], min_age_hours=24)
        self.assertEqual(storage.measure_junk(temp), (600, 2))
        self.assertEqual(storage.clean_junk(temp), (600, 2, 0))
        self.assertFalse(os.path.exists(old) or os.path.exists(nested))
        self.assertFalse(os.path.exists(os.path.dirname(nested)))  # emptied subfolder removed
        self.assertTrue(os.path.exists(new))  # too new: may still be in use
        self.assertTrue(os.path.isdir(os.path.join(self.root, "Temp")))  # the folder itself stays

        thumbs = storage.JunkCategory("thumbs", "Thumbs", "", [os.path.join(self.root, "Explorer")],
                                      ("thumbcache_*.db",))
        self.assertEqual(storage.clean_junk(thumbs), (70, 1, 0))
        self.assertFalse(os.path.exists(thumb))
        self.assertTrue(os.path.exists(keep))

    def test_junk_globs_and_safety(self):
        for profile in ("Default", "Profile 1"):
            self.write(f"Chrome/User Data/{profile}/Cache/f_000001", b"c" * 10)
        self.write("Chrome/User Data/Default/Bookmarks", b"keep")
        browser = storage.JunkCategory("browser", "Browser", "",
                                       [os.path.join(self.root, "Chrome", "User Data", "*", "Cache")])
        self.assertEqual(len(browser.existing_folders()), 2)
        self.assertEqual(storage.measure_junk(browser), (20, 2))

        # never clear a drive root or a top-level folder, whatever the list says
        risky = storage.JunkCategory("x", "x", "", [os.sep, os.path.join(os.sep, "tmp")])
        self.assertEqual(risky.existing_folders(), [])
        self.assertTrue(all(c.name and c.description for c in storage.junk_categories()))

    def test_duplicates(self):
        big = os.urandom(300 * 1024)
        a = self.write("Photos/trip.mp4", big, age_hours=10)
        b = self.write("Backup/trip copy.mp4", big)
        c = self.write("Desktop/trip.mp4", big)
        # same size and same first/last 64 KB, different middle: not a duplicate
        self.write("Other/almost.mp4", big[:150000] + b"!" + big[150001:])
        self.write("Small/1.txt", b"same")
        self.write("Small/2.txt", b"same")
        other = os.urandom(200 * 1024)
        d = self.write("x/one.iso", other)
        e = self.write("y/two.iso", other)
        try:
            os.link(d, os.path.join(self.root, "z-hardlink.iso"))  # same file, frees nothing
        except OSError:
            pass

        groups = storage.find_duplicates(self.scan(), min_size=100 * 1024)
        self.assertEqual(len(groups), 2)
        self.assertEqual({x.path for x in groups[0]}, {a, b, c})  # most space wasted first
        second = {os.path.basename(x.path) for x in groups[1]}
        self.assertEqual(len(second), 2)  # the hard link is not counted as an extra copy
        self.assertIn("two.iso", second)
        self.assertEqual(groups[0][0].path, a)  # oldest copy first: the one kept by "Select extra copies"

    def test_file_type(self):
        self.assertEqual(storage.file_type("C:/x/Movie.MKV"), "Videos")
        self.assertEqual(storage.file_type("/x/setup.exe"), "Programs & installers")
        self.assertEqual(storage.file_type("/x/noext"), "Other")


if __name__ == "__main__":
    unittest.main()
