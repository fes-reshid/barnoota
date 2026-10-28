import io
import os
import sys
import unittest
import wave

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
try:
    import scan_fx
except ImportError:  # Python without Tk (some Linux installs): nothing to test here
    scan_fx = None


@unittest.skipIf(scan_fx is None, "tkinter is not installed")
class ScanFxTests(unittest.TestCase):
    def test_tones_are_valid_wav(self):
        data = scan_fx._wav(scan_fx._mix((0, scan_fx._chirp(500, 1000, 50)), (30, scan_fx._click())))
        with wave.open(io.BytesIO(data)) as w:
            self.assertEqual(w.getnchannels(), 1)
            self.assertAlmostEqual(w.getnframes(), scan_fx.RATE * 50 // 1000, delta=2)
        self.assertEqual(len(scan_fx._tick_sounds()), 6)

    def test_sound_never_fails_without_a_sound_card(self):
        sound = scan_fx.ScanSound(True)
        for call in (sound.tick, sound.started, sound.finished, sound.threat, sound.stop):
            call()
        sound.set_enabled(False)
        self.assertFalse(sound.enabled)

    def test_sounds_are_played_from_files_not_memory(self):
        """Windows refuses SND_MEMORY together with SND_ASYNC, which once left the app silent."""
        played = []

        class FakeWinsound:
            SND_FILENAME, SND_ASYNC, SND_NODEFAULT, SND_MEMORY, SND_PURGE = 0x20000, 1, 2, 4, 0x40

            @staticmethod
            def PlaySound(sound, flags):
                played.append((sound, flags))

        real = scan_fx.winsound
        scan_fx.winsound = FakeWinsound
        try:
            sound = scan_fx.ScanSound(True)
            self.assertTrue(sound.enabled)
            sound.started()
            sound.threat()
            sound.finished()
            sound._quiet_until = 0
            sound.tick()
        finally:
            scan_fx.winsound = real
        self.assertEqual(len(played), 4)
        for path, flags in played:
            self.assertTrue(os.path.isfile(path), path)
            self.assertTrue(flags & FakeWinsound.SND_FILENAME)
            self.assertFalse(flags & FakeWinsound.SND_MEMORY)


if __name__ == "__main__":
    unittest.main()
