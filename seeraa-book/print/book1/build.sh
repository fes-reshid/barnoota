#!/usr/bin/env bash
# Rebuild the Book One print interior.
#   ./build.sh            → book.html  ->  Seeraa_Quest_Book_1_Interior_KDP.pdf
# Needs: node + playwright (chromium), python3 + pypdf/pillow/numpy.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
node "$here/render.js"
python3 -I "$here/finalize.py" "$here/Seeraa_Quest_Book_1_Interior_KDP.pdf"
echo "done -> $here/Seeraa_Quest_Book_1_Interior_KDP.pdf"
