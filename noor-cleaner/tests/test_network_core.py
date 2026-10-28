import os
import sys
import unittest
from collections import Counter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import network_core as net  # noqa: E402

NETSTAT = """
Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1020
  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING       1100
  TCP    127.0.0.1:5432         0.0.0.0:0              LISTENING       4400
  TCP    [::]:445               [::]:0                 LISTENING       4
  TCP    192.168.1.5:50000      93.184.216.34:443      ESTABLISHED     7000
  TCP    192.168.1.5:3389       203.0.113.9:51000      SYN_RECEIVED    0
  UDP    0.0.0.0:5353           *:*                                    2200
  UDP    [::1]:1900             *:*                                    2300
"""


class NetworkTests(unittest.TestCase):
    def test_parse_netstat(self):
        ports, conns = net.parse_netstat(NETSTAT)
        self.assertEqual([(p.protocol, p.port, p.pid) for p in ports],
                         [("TCP", 135, 1020), ("TCP", 3389, 1100), ("TCP", 5432, 4400), ("TCP", 445, 4),
                          ("UDP", 5353, 2200), ("UDP", 1900, 2300)])
        self.assertEqual([(c.remote_address, c.remote_port, c.state) for c in conns],
                         [("93.184.216.34", 443, "ESTABLISHED"), ("203.0.113.9", 51000, "SYN_RECEIVED")])

    def test_reach_and_risk(self):
        ports, _conns = net.parse_netstat(NETSTAT)
        by_port = {p.port: p for p in ports}
        self.assertTrue(by_port[3389].reachable)
        self.assertEqual(by_port[3389].risk()[0], net.HIGH)
        self.assertFalse(by_port[5432].reachable)
        self.assertEqual(by_port[5432].risk()[0], net.INFO)
        self.assertEqual(by_port[1900].reachable, False)

    def test_parse_tasklist(self):
        text = '"svchost.exe","1020","Services","0","12,000 K"\n"mstsc.exe","7000","Console","1","9 K"\n'
        self.assertEqual(net.parse_tasklist(text), {1020: "svchost.exe", 7000: "mstsc.exe"})

    def test_suspects(self):
        _ports, conns = net.parse_netstat(NETSTAT)
        scan = [net.Connection("TCP", "x", "203.0.113.9", 1000 + i, "SYN_RECEIVED", 0) for i in range(6)]
        found = net.find_suspects(conns + scan, Counter({"198.51.100.7": 40, "198.51.100.8": 3}))
        self.assertEqual([x.address for x in found], ["198.51.100.7", "203.0.113.9"])
        self.assertEqual(found[0].count, 40)
        flood = [net.Connection("TCP", "x", "198.51.100.50", 1000 + i, "ESTABLISHED", 1) for i in range(30)]
        self.assertEqual(net.find_suspects(flood)[0].address, "198.51.100.50")
        self.assertEqual(net.find_suspects(conns), [])

    def test_blocking_refuses_bad_input(self):
        for bad in ("not an ip", "127.0.0.1", "0.0.0.0", "::1"):
            with self.assertRaises(ValueError):
                net.block_address(bad)
        with self.assertRaises(ValueError):
            net.block_port(70000)
        with self.assertRaises(ValueError):
            net.block_port(80, "ICMP")
        with self.assertRaises(ValueError):
            net.unblock("Some other firewall rule")

    def test_essential_programs_are_not_stopped(self):
        for program in ("lsass.exe", "SVCHOST.EXE", "System", r"C:\\Windows\\explorer.exe"):
            self.assertFalse(net.can_stop(program), program)
        self.assertTrue(net.can_stop("mstsc.exe"))
        with self.assertRaises(ValueError):
            net.stop_program(4, "System")


if __name__ == "__main__":
    unittest.main()
