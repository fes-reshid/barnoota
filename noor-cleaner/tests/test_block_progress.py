import unittest
from block_progress import blocks_filled, percent_parts


class BlockTests(unittest.TestCase):
    def test_blocks(self):
        self.assertEqual(blocks_filled(0, 100, 20), 0)
        self.assertEqual(blocks_filled(50, 100, 20), 10)
        self.assertEqual(blocks_filled(100, 100, 20), 20)
        self.assertEqual(blocks_filled(150, 100, 20), 20)
        self.assertEqual(blocks_filled(5, 0, 20), 0)

    def test_percent_adds_to_100(self):
        for v in (0, 1, 33.3, 99.9, 100, 140):
            d, l = percent_parts(v, 100)
            self.assertEqual(d + l, 100)
