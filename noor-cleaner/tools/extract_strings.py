"""Lists every translatable text in NoorCleaner (every _("...") call).

Run from noor-cleaner/:  python tools/extract_strings.py
It prints the texts that locales/ar.json and locales/om.json do not translate
yet, and with --update adds them to both files (empty, ready to fill in).
"""

import ast
import json
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGUAGES = ("ar", "om")


def source_files():
    return sorted(os.path.join(HERE, name) for name in os.listdir(HERE) if name.endswith(".py"))


def translatable_strings():
    """{text: [where it is used]}; raises ValueError for a _() call that is not a plain string."""
    found = {}
    for path in source_files():
        with open(path, encoding="utf-8") as f:
            tree = ast.parse(f.read(), path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "_":
                if len(node.args) != 1 or not isinstance(node.args[0], ast.Constant) \
                        or not isinstance(node.args[0].value, str):
                    raise ValueError(f"{os.path.basename(path)}:{node.lineno}: _() needs one plain string")
                found.setdefault(node.args[0].value, []).append(f"{os.path.basename(path)}:{node.lineno}")
    return found


def load(code):
    try:
        with open(os.path.join(HERE, "locales", f"{code}.json"), encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def main():
    strings = translatable_strings()
    print(f"{len(strings)} translatable texts")
    for code in LANGUAGES:
        table = load(code)
        missing = [s for s in strings if not table.get(s)]
        unused = [s for s in table if s not in strings]
        print(f"{code}: {len(missing)} missing, {len(unused)} no longer used")
        if "--update" in sys.argv:
            merged = {s: table.get(s, "") for s in strings}
            with open(os.path.join(HERE, "locales", f"{code}.json"), "w", encoding="utf-8") as f:
                json.dump(merged, f, ensure_ascii=False, indent=1)
                f.write("\n")
        elif missing:
            for s in missing:
                print("  ", json.dumps(s, ensure_ascii=False))


if __name__ == "__main__":
    main()
