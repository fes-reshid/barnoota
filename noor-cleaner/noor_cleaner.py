"""NoorCleaner: shows what is taking up space, clears junk, finds duplicates and similar photos,
manages programs, checks disk health, finds corrupted files and recovers deleted files.

Run with:  python noor_cleaner.py            (python noor_cleaner.py --remind runs the junk reminder)
"""

import app
import editions

if __name__ == "__main__":
    app.main(editions.CLEANER)
