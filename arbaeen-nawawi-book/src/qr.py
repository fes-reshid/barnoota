"""QR codes that link the printed book to the online edition (needs: pip install segno)."""
import io
import segno

SITE = "diinislaam.com/40hadith"


def url(route=""):
    return f"https://{SITE}/" + route


def shown(route=""):
    """The address as printed under the code (what a reader would type)."""
    return SITE + (f"/{route}" if route else "")


def svg(route="", dark="#111111"):
    """Inline SVG of the QR code; size it with CSS (it has a viewBox and no fixed size)."""
    buf = io.BytesIO()
    segno.make(url(route), error="m").save(buf, kind="svg", border=2, dark=dark, light="#ffffff",
                                          xmldecl=False, svgns=True, omitsize=True, svgclass="qrsvg", lineclass=None)
    return buf.getvalue().decode()


def block(route="", label="Scan to study online", cls="qr"):
    """QR code with the printed address under it."""
    return (f'<a class="{cls}" href="{url(route)}">{svg(route)}'
            f'<span>{label}<b>diinislaam.com</b><b>/40hadith{"/" + route if route else ""}</b></span></a>')
