"""The "Network & ports" page: open ports, who is connected, attack warnings, and blocking."""

import threading
from tkinter import ttk

import network_core as net
import scanner_core as core
from i18n import _
from ui_base import clear_tree, is_admin, make_tree, open_location


class NetworkMixin:
    def _network_view(self):
        px = self.theme.px
        self.handlers.update({"net_done": self._show_network, "blocks_done": self._show_blocks})
        view = self._view("network", _("Network & ports"),
                          _("See which doors your PC has open to the network, who is connected, and block what you "
                            "do not want. Nothing is blocked unless you choose it."))
        top = self._card(view, fill="x", **self._gap())
        row = self._row(top)
        self._button(row, _("Scan my network"), self.scan_network, style="Primary.TButton", gap=12)
        self.net_status = ttk.Label(row, text=_("Looks at open ports, connections and failed sign-ins."),
                                    style="CardSub.TLabel")
        self.net_status.pack(side=self.L)
        self.attack_box = ttk.Frame(view)
        self.attack_box.pack(fill="x")
        self.net_suspects = []
        for line in (_("This is a helper, not a full firewall. Keep Windows Firewall and Windows Security turned on."),
                     _("Blocking uses Windows Firewall, so it needs administrator rights. You can undo every block "
                       "under 'Blocked'.")):
            self._text(view, line, style="Sub.TLabel", side="bottom", pady=(px(2), 0))
        self._segments(view, [("ports", _("Open ports"), self._ports_page),
                              ("conns", _("Connections"), self._conns_page),
                              ("blocks", _("Blocked"), self._blocks_page)])

    # ------------------------------------------------------------------ pages

    def _ports_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        frame, self.ports_tree = make_tree(card, [("port", _("Port"), 70), ("protocol", _("Type"), 60),
                                                  ("program", _("Program"), 190), ("reach", _("Who can reach it"), 150),
                                                  ("risk", _("Risk"), 80), ("note", _("What it means"), 420)])
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Block this port"), self.block_selected_port, style="Primary.TButton")
        self._button(bar, _("Stop this program"), self.stop_selected_program, style="Danger.TButton")
        self._button(bar, _("Open location"), self.open_port_program)
        bar.pack_configure(side="bottom")
        frame.pack(fill="both", expand=True)
        return card

    def _conns_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        frame, self.conns_tree = make_tree(card, [("remote", _("Connected to"), 200), ("port", _("Port"), 70),
                                                  ("program", _("Program"), 200), ("state", _("State"), 130)])
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Block this address"), self.block_selected_address, style="Primary.TButton")
        bar.pack_configure(side="bottom")
        frame.pack(fill="both", expand=True)
        return card

    def _blocks_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        self._text(card, _("Blocks made by NoorCleaner. Remove one to open that port or address again."),
                   pady=(0, px(8)))
        frame, self.blocks_tree = make_tree(card, [("name", _("Block"), 600)])
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Remove selected block"), self.unblock_selected, style="Primary.TButton")
        self._button(bar, _("Refresh"), self.load_blocks)
        bar.pack_configure(side="bottom")
        frame.pack(fill="both", expand=True)
        return card

    # ------------------------------------------------------------------ scanning

    def scan_network(self):
        if self._busy():
            return
        if not core.IS_WINDOWS:
            self.info(_("Network checks are only available on Windows."))
            return
        self.net_status.config(text=_("Looking..."))
        admin = is_admin()

        def work():
            try:
                ports, conns = net.read_network()
            except Exception as exc:
                self.events.put(("worker_error", str(exc)))
                self.events.put(("net_done", [], [], None, str(exc)))
                return
            logons, note = None, None
            if admin:
                try:
                    logons = net.failed_logons()
                except Exception as exc:
                    note = str(exc)
            self.events.put(("net_done", ports, conns, logons, note))

        self._start_worker(work)

    def _show_network(self, ports, conns, logons, note):
        clear_tree(self.ports_tree)
        clear_tree(self.conns_tree)
        labels = {net.HIGH: _("High"), net.MEDIUM: _("Medium"), net.LOW: _("Low"), net.INFO: _("Fine")}
        for p in ports:
            level, text = p.risk()
            program = p.program or "?"
            if p.service:
                program += f"  ({p.service})"
            iid = self.ports_tree.insert("", "end", values=(
                p.port, p.protocol, program, _("The network") if p.reachable else _("This PC only"),
                labels[level], text))
            self.ports_tree.items[iid] = p
        for c in conns:
            if c.remote_address in ("0.0.0.0", "::", "*"):
                continue
            iid = self.conns_tree.insert("", "end", values=(c.remote_address, c.remote_port, c.program or "?",
                                                            c.state.replace("_", " ").title()))
            self.conns_tree.items[iid] = c
        self.net_suspects = net.find_suspects(conns, logons)
        self._show_suspects(note)
        exposed = sum(1 for p in ports if p.reachable and p.risk()[0] == net.HIGH)
        self.net_status.config(text=_("Open ports: {ports}  ·  connections: {conns}  ·  risky ports open to the "
                                      "network: {risky}").format(ports=len(ports), conns=len(conns), risky=exposed))
        self.load_blocks()

    def _show_suspects(self, note):
        px = self.theme.px
        for child in self.attack_box.winfo_children():
            child.destroy()
        if self.net_suspects:
            card = self._card(self.attack_box, _("Possible attack"), style="Note.TFrame", fill="x", **self._gap())
            self._text(card, _("These addresses are behaving like an attacker. Block them to cut them off."),
                       style="Note.TLabel", pady=(0, px(6)))
            for s in self.net_suspects[:8]:
                row = ttk.Frame(card, style="Note.TFrame")
                row.pack(fill="x", pady=(px(3), 0))
                self._button(row, _("Block"), lambda a=s.address: self.block_address_now(a), style="Danger.TButton",
                             gap=12)
                ttk.Label(row, text=f"{s.address}  -  {s.reason} ({s.count})", style="Note.TLabel").pack(side=self.L)
        elif note:
            self._text(self._card(self.attack_box, style="Note.TFrame", fill="x", **self._gap()), note,
                       style="Note.TLabel")
        elif not is_admin():
            self._text(self._card(self.attack_box, style="Note.TFrame", fill="x", **self._gap()),
                       _("NoorCleaner is not running as administrator, so it could not check failed sign-ins. Use "
                         "'Run as admin' (bottom left) for a full attack check."), style="Note.TLabel")
        else:
            self._text(self._card(self.attack_box, style="Note.TFrame", fill="x", **self._gap()),
                       _("No signs of an attack right now."), style="Note.TLabel")

    # ------------------------------------------------------------------ blocking

    def _blocked(self, what):
        """Runs a blocking step after the administrator check; reports the result."""
        if not self.admin_gate(_("Blocking needs administrator rights.")):
            return False
        try:
            what()
        except (ValueError, RuntimeError) as exc:
            self.error(str(exc))
            return False
        self.load_blocks()
        return True

    def block_selected_port(self):
        chosen = self._selected_items(self.ports_tree)
        if not chosen:
            self.info(_("Select a port first."))
            return
        port = chosen[0]
        if not self.ask(_("Block incoming connections to port {port} ({kind})? Programs that need it will stop "
                          "receiving connections. You can undo this under 'Blocked'.").format(
                              port=port.port, kind=port.protocol), danger=True):
            return
        if self._blocked(lambda: net.block_port(port.port, port.protocol)):
            self.info(_("Port {port} is blocked.").format(port=port.port))

    def stop_selected_program(self):
        chosen = self._selected_items(self.ports_tree)
        if not chosen:
            self.info(_("Select a port first."))
            return
        port = chosen[0]
        if not net.can_stop(port.program) or port.pid <= 4:
            self.info(_("{program} is part of Windows and is not stopped from here. Block the port instead.").format(
                program=port.program or "System"))
            return
        if not self.ask(_("Stop {program}? Unsaved work in it is lost. It may start again next time you sign in.").format(
                program=port.program), danger=True):
            return
        if self._blocked(lambda: net.stop_program(port.pid, port.program)):
            self.info(_("{program} was stopped.").format(program=port.program))
            self.scan_network()

    def open_port_program(self):
        chosen = self._selected_items(self.ports_tree)
        if not chosen or not chosen[0].path:
            self.info(_("Select a port whose program is known."))
            return
        open_location(chosen[0].path)

    def block_selected_address(self):
        chosen = self._selected_items(self.conns_tree)
        if not chosen:
            self.info(_("Select a connection first."))
            return
        self.block_address_now(chosen[0].remote_address)

    def block_address_now(self, address):
        if not self.ask(_("Block all traffic to and from {address}? You can undo this under 'Blocked'.").format(
                address=address), danger=True):
            return
        if self._blocked(lambda: net.block_address(address)):
            self.info(_("{address} is blocked.").format(address=address))

    def load_blocks(self):
        if not core.IS_WINDOWS:
            return

        def work():
            try:
                self.events.put(("blocks_done", net.list_blocks()))
            except Exception:
                self.events.put(("blocks_done", []))

        threading.Thread(target=work, daemon=True).start()

    def _show_blocks(self, names):
        clear_tree(self.blocks_tree)
        for name in names:
            iid = self.blocks_tree.insert("", "end", values=(name.replace(net.RULE_PREFIX, "").strip(),))
            self.blocks_tree.items[iid] = name

    def unblock_selected(self):
        chosen = self._selected_items(self.blocks_tree)
        if not chosen:
            self.info(_("Select a block to remove."))
            return
        if self._blocked(lambda: [net.unblock(name) for name in chosen]):
            self.info(_("Removed."))
