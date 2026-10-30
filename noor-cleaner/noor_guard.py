"""NoorGuard: looks for viruses, watches the network for attacks, checks Windows' security settings and
protects your privacy.

Run with:  python noor_guard.py              (python noor_guard.py --tray starts it hidden in the tray)
"""

import app
import editions

if __name__ == "__main__":
    app.main(editions.GUARD)
