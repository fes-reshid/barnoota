"""A notification-area (tray) icon, so live protection can keep watching with the window closed.

Uses the optional `pystray` package. When it is not available everything still works: closing the
window simply closes NoorCleaner. Menu clicks are passed to the app through its event queue, because
the icon runs on its own thread.
"""

try:
    import pystray
    from PIL import Image
except ImportError:  # not installed (or no display): no tray
    pystray = None
    Image = None


class Tray:
    def __init__(self, events, icon_path, open_label, quit_label, title="NoorCleaner"):
        self.events = events
        self.icon_path = icon_path
        self.labels = (open_label, quit_label)
        self.title = title
        self.icon = None

    @property
    def available(self):
        return pystray is not None

    @property
    def visible(self):
        return self.icon is not None

    def start(self):
        if not self.available or self.icon is not None:
            return self.visible
        try:
            image = Image.open(self.icon_path).convert("RGBA")
            menu = pystray.Menu(
                pystray.MenuItem(self.labels[0], lambda *_a: self.events.put(("tray", "open")), default=True),
                pystray.MenuItem(self.labels[1], lambda *_a: self.events.put(("tray", "quit"))))
            self.icon = pystray.Icon("NoorCleaner", image, self.title, menu)
            self.icon.run_detached()
        except Exception:  # a broken tray must never break the app
            self.icon = None
        return self.visible

    def notify(self, message, title=None):
        if self.icon is not None:
            try:
                self.icon.notify(message, title or self.title)
            except Exception:
                pass

    def stop(self):
        if self.icon is not None:
            try:
                self.icon.stop()
            except Exception:
                pass
            self.icon = None
