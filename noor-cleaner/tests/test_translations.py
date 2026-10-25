import os
import re
import sys
import unittest

HERE = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "tools"))
import extract_strings  # noqa: E402
import i18n  # noqa: E402


def placeholders(text):
    return sorted(re.findall(r"\{(\w+)\}", text))


class TranslationTests(unittest.TestCase):
    def test_every_text_is_translated_with_matching_placeholders(self):
        strings = extract_strings.translatable_strings()  # also fails on a _() that is not a plain string
        self.assertGreater(len(strings), 300)
        for code in ("ar", "om"):
            table = extract_strings.load(code)
            missing = [s for s in strings if not table.get(s, "").strip()]
            self.assertEqual(missing, [], f"{code}.json is missing translations")
            for english, translated in table.items():
                self.assertEqual(placeholders(english), placeholders(translated),
                                 f"{code}: placeholders differ for {english!r}")
                translated.format(**{name: "x" for name in placeholders(english)})  # must not raise

    def test_switching_language(self):
        try:
            i18n.set_language("ar")
            self.assertTrue(i18n.is_rtl())
            self.assertEqual(i18n._("Settings"), "الإعدادات")
            i18n.set_language("om")
            self.assertFalse(i18n.is_rtl())
            self.assertEqual(i18n._("Settings"), "Qindaa'ina")
            self.assertEqual(i18n._("text nobody translated"), "text nobody translated")
            i18n.set_language("xx")  # unknown codes fall back to English
            self.assertEqual(i18n.language(), "en")
        finally:
            i18n.set_language("en")


if __name__ == "__main__":
    unittest.main()
