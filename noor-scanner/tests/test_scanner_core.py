import io
import os
import struct
import sys
import tempfile
import unittest
import zipfile
import zlib
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import scanner_core as core  # noqa: E402


def png_bytes():
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 0, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(b"\x00\x00")) + chunk(b"IEND", b""))


def zip_bytes():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("word/document.xml", "<w:document>" + "hello " * 500 + "</w:document>")
    return buf.getvalue()


def pe_bytes(section_raw_size=0x200):
    dos = bytearray(0x80)
    dos[:2] = b"MZ"
    struct.pack_into("<I", dos, 0x3C, 0x80)
    coff = b"PE\x00\x00" + struct.pack("<HHIIIHH", 0x14C, 1, 0, 0, 0, 0xE0, 0x102)
    optional = bytes(0xE0)
    section = b".text\x00\x00\x00" + struct.pack("<IIII", 0x100, 0x1000, section_raw_size, 0x200) + bytes(16)
    head = bytes(dos) + coff + optional + section
    return head + bytes(0x200 - len(head)) + b"\x90" * 0x200


EICAR = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$" + b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"


def require_eicar(test, path):
    """Skips the test if this machine's antivirus removed or locked the EICAR file we wrote."""
    try:
        with open(path, "rb") as f:
            if f.read() == EICAR:
                return
    except OSError:
        pass
    test.skipTest("the antivirus on this machine removed the EICAR test file")


class CheckTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, name, data):
        path = os.path.join(self.dir, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        return path

    def corruption(self, name, data, deep=False):
        path = self.write(name, data)
        return core.check_corruption(path, len(data), deep)

    def test_healthy_files_pass(self):
        self.assertIsNone(self.corruption("a.png", png_bytes(), deep=True))
        self.assertIsNone(self.corruption("a.docx", zip_bytes(), deep=True))
        self.assertIsNone(self.corruption("a.pdf", b"%PDF-1.7\n1 0 obj\nendobj\n%%EOF\n"))
        self.assertIsNone(self.corruption("a.jpg", b"\xff\xd8\xff\xe0" + b"x" * 100 + b"\xff\xd9"))
        self.assertIsNone(self.corruption("a.gif", b"GIF89a" + b"x" * 20 + b";"))
        self.assertIsNone(self.corruption("a.exe", pe_bytes()))
        self.assertIsNone(self.corruption("a.mp4", struct.pack(">I", 16) + b"ftypisom" + bytes(4)
                                          + struct.pack(">I", 12) + b"mdat" + bytes(4)))
        self.assertIsNone(self.corruption("notes.txt", b""))  # empty text files are normal
        self.assertIsNone(self.corruption("old.xls", b"<html><table></table></html>"))

    def test_broken_files_are_reported(self):
        self.assertIn("empty", self.corruption("empty.docx", b""))
        self.assertIn("cut off", self.corruption("half.pdf", b"%PDF-1.7\n1 0 obj\n"))
        self.assertIn("cut off", self.corruption("half.png", png_bytes()[:-12]))
        self.assertIn("cut off", self.corruption("half.jpg", b"\xff\xd8\xff\xe0" + b"x" * 100))
        self.assertIn("broken", self.corruption("half.docx", zip_bytes()[:-30]))
        self.assertIn("blank", self.corruption("wiped.pdf", bytes(5000)))
        self.assertIn("header", self.corruption("fake.png", b"hello world"))
        self.assertIn("cut off", self.corruption("half.exe", pe_bytes(section_raw_size=0x4000)))
        self.assertIn("cut off", self.corruption("half.mp4", struct.pack(">I", 16) + b"ftypisom" + bytes(4)
                                                 + struct.pack(">I", 9999) + b"mdat" + bytes(4)))

    def test_deep_scan_finds_damaged_data(self):
        data = bytearray(png_bytes())
        data[40] ^= 0xFF  # flip a byte inside the IDAT block
        self.assertIsNone(self.corruption("flip.png", bytes(data)))
        self.assertIn("checksum", self.corruption("flip2.png", bytes(data), deep=True))

        data = bytearray(zip_bytes())
        data[60] ^= 0xFF  # damage the compressed document
        self.assertIsNotNone(self.corruption("flip.docx", bytes(data), deep=True))

    def test_disk_read_errors_are_reported(self):
        path = self.write("x.bin", b"abc")
        with mock.patch("builtins.open", side_effect=OSError(5, "Input/output error")):
            self.assertIn("disk", core.check_corruption(path, 3, deep=True))
        with mock.patch("builtins.open", side_effect=PermissionError(13, "denied")):
            self.assertIsNone(core.check_corruption(path, 3, deep=True))

    def test_threats(self):
        eicar = self.write("eicar.com", EICAR)
        require_eicar(self, eicar)
        self.assertEqual(core.check_threat(eicar, len(EICAR), {})[0], core.THREAT)

        program = self.write("tool.exe", pe_bytes())
        digest = core.sha256_of(program)
        kind, reason = core.check_threat(program, os.path.getsize(program), {digest: "Trojan.Test"})
        self.assertEqual((kind, reason), (core.THREAT, "Known malware: Trojan.Test"))
        self.assertIsNone(core.check_threat(program, os.path.getsize(program), {"0" * 64: "x"}))

        fake = self.write("invoice.pdf.exe", pe_bytes())
        self.assertEqual(core.check_threat(fake, 10, {})[0], core.SUSPICIOUS)
        rlo = self.write("photo\u202egpj.exe", b"x")
        self.assertEqual(core.check_threat(rlo, 1, {})[0], core.SUSPICIOUS)
        self.assertIsNone(core.check_threat(self.write("report.pdf", b"%PDF"), 4, {}))
        self.assertIsNone(core.check_threat(self.write("setup.1.2.exe", b"MZ"), 2, {}))

    def test_signature_file_parsing(self):
        path = self.write("sigs.txt", ("# comment\n" + "AB" * 32 + "  Worm.X\nnot-a-hash  y\n\n"
                                       + "cd" * 32 + "\n").encode())
        self.assertEqual(core.load_signatures([path, "/missing/file"]),
                         {"ab" * 32: "Worm.X", "cd" * 32: "Known malware"})
        eicar = self.write("e.com", EICAR)
        require_eicar(self, eicar)
        bundled = core.load_signatures([os.path.join(os.path.dirname(__file__), "..", "signatures.txt")])
        self.assertEqual(bundled[core.sha256_of(eicar)], "EICAR-Test-File")

    def test_defender_output_parsing(self):
        text = """Scan starting...
Scan finished.
Scanning C:\\Users\\me found 2 threats.

<===========================LIST OF DETECTED THREATS==========================>
----------------------------- Threat information ------------------------------
Threat                  : Virus:DOS/EICAR_Test_File
Resources               : 2 total
    file                : C:\\Users\\me\\Downloads\\eicar.com
    containerfile       : C:\\Users\\me\\Downloads\\bad.zip->eicar.com
-------------------------------------------------------------------------------
"""
        self.assertEqual(core.parse_defender_output(text), [
            ("Virus:DOS/EICAR_Test_File", "C:\\Users\\me\\Downloads\\eicar.com"),
            ("Virus:DOS/EICAR_Test_File", "C:\\Users\\me\\Downloads\\bad.zip"),
        ])
        self.assertEqual(core.parse_defender_output("Scan finished.\nfound no threats."), [])


class ScannerTests(unittest.TestCase):
    def test_full_scan_and_quarantine(self):
        with tempfile.TemporaryDirectory() as root, tempfile.TemporaryDirectory() as appdir:
            def write(rel, data):
                path = os.path.join(root, rel)
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "wb") as f:
                    f.write(data)
                return path

            write("photos/ok.png", png_bytes())
            broken = write("docs/broken.pdf", b"%PDF-1.4 no end")
            eicar = write("downloads/eicar.txt", EICAR)
            write("docs/letter.txt", b"hello")
            require_eicar(self, eicar)
            try:
                os.symlink(root, os.path.join(root, "loop"))  # must not be followed
            except OSError:
                pass  # Windows without symlink rights

            files, findings = [], []
            scanner = core.Scanner([root], on_file=files.append, on_finding=findings.append)
            scanner.run()
            self.assertEqual(len(files), 4)
            by_path = {f.path: f for f in findings}
            self.assertEqual(set(by_path), {broken, eicar})
            self.assertEqual(by_path[broken].kind, core.CORRUPTED)
            self.assertEqual(by_path[eicar].kind, core.THREAT)

            qdir = os.path.join(appdir, "Quarantine")
            with mock.patch.multiple(core, QUARANTINE_DIR=qdir,
                                     QUARANTINE_INDEX=os.path.join(qdir, "index.json")):
                stored = core.quarantine(eicar, "test")
                self.assertFalse(os.path.exists(eicar))
                self.assertTrue(stored.endswith(".quarantined"))
                self.assertEqual([i["original"] for i in core.list_quarantine()], [eicar])

                # a scan of the quarantine's parent never reports quarantined files
                rescan = []
                core.Scanner([appdir], on_finding=rescan.append).run()
                self.assertEqual(rescan, [])

                self.assertEqual(core.restore_from_quarantine(stored), eicar)
                self.assertTrue(os.path.exists(eicar))
                self.assertEqual(core.list_quarantine(), [])

                stored = core.quarantine(eicar)
                core.delete_from_quarantine(stored)
                self.assertFalse(os.path.exists(stored))

            core.delete_permanently(broken)
            self.assertFalse(os.path.exists(broken))

    def test_stop(self):
        with tempfile.TemporaryDirectory() as root:
            for i in range(50):
                open(os.path.join(root, f"{i}.txt"), "w").close()
            seen = []
            scanner = core.Scanner([root])
            scanner.on_file = lambda e: (seen.append(e), scanner.stop())
            scanner.run()
            self.assertEqual(len(seen), 1)


if __name__ == "__main__":
    unittest.main()
