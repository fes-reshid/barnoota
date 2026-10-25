"""Similar photos: pictures that look the same even when they are not identical
files (resized, re-saved, WhatsApp copies, burst shots).

Each photo gets a 64-bit "difference hash" from a tiny greyscale version of it;
photos whose hashes differ in only a few bits look alike. Needs Pillow.
"""

import os
from collections import defaultdict
from dataclasses import dataclass

try:
    from PIL import Image
except ImportError:  # the feature is simply unavailable without Pillow
    Image = None

PHOTO_TYPES = {".jpg", ".jpeg", ".jfif", ".png", ".bmp", ".gif", ".webp", ".tif", ".tiff"}


def available():
    return Image is not None


@dataclass
class Photo:
    entry: object      # scanner_core.FileEntry
    width: int
    height: int
    hash: int

    @property
    def pixels(self):
        return self.width * self.height


def difference_hash(path):
    """(hash, width, height): each bit says whether a pixel is brighter than its right-hand neighbour."""
    with Image.open(path) as im:
        width, height = im.size
        im.draft("L", (64, 64))  # lets JPEGs decode at a fraction of full size: much faster
        small = im.convert("L").resize((9, 8), Image.BILINEAR)
        pixels = small.tobytes()  # one byte per pixel in greyscale
    value = 0
    for row in range(8):
        for col in range(8):
            value = value << 1 | (pixels[row * 9 + col] > pixels[row * 9 + col + 1])
    return value, width, height


def hamming(a, b):
    return bin(a ^ b).count("1")


def find_similar_photos(entries, max_distance=6, min_size=20 * 1024, cancel=None, on_progress=None):
    """Groups of similar photos (best quality first), most reclaimable space first.

    Splitting the 64-bit hash into 8 bands of 8 bits means two hashes within
    6 bits of each other always share at least one whole band, so only photos
    sharing a band are compared instead of every pair.
    """
    candidates = [e for e in entries if e.size >= min_size and os.path.splitext(e.path)[1].lower() in PHOTO_TYPES]
    photos = []
    for done, e in enumerate(candidates, 1):
        if cancel is not None and cancel.is_set():
            return []
        if on_progress and done % 25 == 0:
            on_progress(done, len(candidates))
        try:
            value, width, height = difference_hash(e.path)
        except Exception:  # unreadable or unsupported image
            continue
        photos.append(Photo(e, width, height, value))

    parent = list(range(len(photos)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for band in range(8):
        buckets = defaultdict(list)
        for i, p in enumerate(photos):
            buckets[(p.hash >> (band * 8)) & 0xFF].append(i)
        for members in buckets.values():
            for x in range(len(members)):
                for y in range(x + 1, len(members)):
                    a, b = members[x], members[y]
                    if find(a) != find(b) and hamming(photos[a].hash, photos[b].hash) <= max_distance:
                        parent[find(a)] = find(b)

    groups = defaultdict(list)
    for i, p in enumerate(photos):
        groups[find(i)].append(p)
    result = []
    for group in groups.values():
        if len(group) > 1:
            group.sort(key=lambda p: (p.pixels, p.entry.size), reverse=True)
            result.append(group)
    result.sort(key=lambda g: sum(p.entry.size for p in g[1:]), reverse=True)
    return result
