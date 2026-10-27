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
        data = scan_fx._tone([880, 1175], 50)
        with wave.open(io.BytesIO(data)) as w:
            self.assertEqual(w.getnchannels(), 1)
            self.assertAlmostEqual(w.getnframes(), 2 * scan_fx.RATE * 50 // 1000, delta=2)

    def test_sound_never_fails_without_a_sound_card(self):
        sound = scan_fx.ScanSound(True)
        for call in (sound.tick, sound.finished, sound.threat, sound.stop):
            call()
        sound.set_enabled(False)
        self.assertFalse(sound.enabled)


if __name__ == "__main__":
    unittest.main()
