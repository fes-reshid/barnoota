"""The "Network & ports" page: open ports, who is connected, attack warnings, and blocking."""

import threading
import time
import tkinter as tk
from tkinter import ttk

import network_core as net
import scanner_core as core
import settings
from i18n import _
from ui_base import clear_tree, is_admin, make_tree, open_location


class NetworkMixin:
    def _network_view(self):
        px = self.theme.px
        self.handlers.update({"net_done": self._show_network, "blocks_done": self._show_blocks,
                              "net_devices": self._show_devices, "net_alert": self._net_alert,
                              "net_countries": self._got_countries, "net_router": self._show_router_identity})
        self.country_cache = {}         # address -> "Germany (DE)" or "" when unknown
        self._monitor_seen = set()      # attackers and risky ports already announced, so each is announced once
        self._monitor_ports = None      # reachable risky ports at the last check
        self._monitor_busy = False
        self._monitor_round = 0
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
        self.monitor_var = tk.BooleanVar(value=bool(self.config.get("live_monitor", False)))
        ttk.Checkbutton(top, text=_("Live protection: watch for attacks while NoorCleaner is open and warn me"),
                        variable=self.monitor_var, style="Card.TCheckbutton", command=self.toggle_monitor).pack(
            anchor=self.W, pady=(px(8), 0))
        self.country_var = tk.BooleanVar(value=bool(self.config.get("country_lookup", False)))
        ttk.Checkbutton(top, text=_("Show the country of attackers (online: sends only the attacker's address to "
                                    "ipwho.is)"),
                        variable=self.country_var, style="Card.TCheckbutton", command=self.toggle_country).pack(
            anchor=self.W, pady=(px(4), 0))
        for line in (_("This is a helper, not a full firewall. Keep Windows Firewall and Windows Security turned on."),
                     _("Blocking uses Windows Firewall, so it needs administrator rights. You can undo every block "
                       "under 'Blocked'.")):
            self._text(view, line, style="Sub.TLabel", side="bottom", pady=(px(2), 0))
        self._segments(view, [("ports", _("Open ports"), self._ports_page),
                              ("conns", _("Connections"), self._conns_page),
                              ("blocks", _("Blocked"), self._blocks_page),
                              ("devices", _("Devices"), self._devices_page),
                              ("history", _("History"), self._history_page)])

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
        self._lookup_countries([x.address for x in self.net_suspects])
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
                where = self.country_cache.get(s.address)
                where = f"  [{where}]" if where else ""
                ttk.Label(row, text=f"{s.address}{where}  -  {s.reason} ({s.count})", style="Note.TLabel").pack(
                    side=self.L)
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

    # ------------------------------------------------------------------ country of attackers (optional)

    def toggle_country(self):
        self.config["country_lookup"] = self.country_var.get()
        settings.save(self.config)
        if self.country_var.get():
            self.info(_("When an attacker is found, NoorCleaner will ask ipwho.is which country its address belongs "
                        "to. Only that address is sent: never your files, your name or your own address."))
            self._lookup_countries([x.address for x in self.net_suspects])

    def _lookup_countries(self, addresses):
        todo = [a for a in dict.fromkeys(addresses) if a not in self.country_cache]
        if not todo or not self.country_var.get():
            return

        def work():
            found = {a: (net.country_for(a) or "") for a in todo}
            self.events.put(("net_countries", found))

        threading.Thread(target=work, daemon=True).start()

    def _got_countries(self, found):
        self.country_cache.update(found)
        for address, country in found.items():
            if country:
                net.set_log_country(address, country)
        self._show_suspects(None)
        self.load_history()

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
            net.log_event(address, _("Blocked by you"), 0, "blocked")
            self.load_history()
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

    # ------------------------------------------------------------------ devices on your network

    def _devices_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        row = self._row(card, pady=(0, px(8)))
        self._button(row, _("Find devices"), self.load_devices, style="Primary.TButton", gap=12)
        self.devices_status = ttk.Label(row, text=_("Phones, TVs and computers on your Wi-Fi. A device you do not "
                                                    "recognise may be a stranger."), style="CardSub.TLabel")
        self.devices_status.pack(side=self.L)
        frame, self.devices_tree = make_tree(card, [("address", _("Address"), 140), ("mac", _("Hardware ID (MAC)"), 190),
                                                    ("what", _("What"), 220), ("known", _("Status"), 140)])
        self.router_box = ttk.Frame(card, style="Plain.TFrame")
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("This is mine: remember it"), self.mark_known, style="Primary.TButton")
        self._button(bar, _("Forget"), self.forget_known)
        self._button(bar, _("Block this device"), self.block_selected_device, style="Danger.TButton")
        bar.pack_configure(side="bottom")
        self.router_box.pack(fill="x", side="bottom", pady=(px(8), 0))
        self.router_ip = None
        frame.pack(fill="both", expand=True)
        return card

    def load_devices(self):
        if self._busy():
            return
        self.devices_status.config(text=_("Looking around your network (about 20 seconds)..."))

        def work():
            try:
                devices, router = net.read_devices()
                self.events.put(("net_devices", devices, net.router_check(router), None))
            except Exception as exc:
                self.events.put(("net_devices", [], [], str(exc)))

        self._start_worker(work)

    def _known_devices(self):
        return set(self.config.get("known_devices") or [])

    def _show_devices(self, devices, router_findings, error):
        clear_tree(self.devices_tree)
        for child in self.router_box.winfo_children():
            child.destroy()
        if error:
            self.devices_status.config(text=_("Could not look."))
            self.warn(error)
            return
        known = self._known_devices()
        new = 0
        for d in devices:
            if d.is_this_pc:
                what, state = _("This PC"), _("You")
            else:
                what = _("Your router") if d.is_router else _("Another device")
                if d.is_router or d.mac in known:
                    state = _("Known")
                else:
                    state = _("New: do you know it?")
                    new += 1
            iid = self.devices_tree.insert("", "end", values=(d.address, d.mac or "-", what, state))
            self.devices_tree.items[iid] = d
        self.devices_status.config(text=_("Devices found: {count}  ·  not yet marked as yours: {new}").format(
            count=len(devices), new=new))
        labels = {net.HIGH: _("High"), net.MEDIUM: _("Medium"), net.LOW: _("Low"), net.INFO: _("Fine")}
        for level, text in router_findings:
            self._text(self.router_box, f"{labels[level]}:  {text}", style="CardSub.TLabel", wrap=820)
        router = next((d.address for d in devices if d.is_router), None)
        self.router_ip = router
        if router:
            self._router_checklist(router)

    def _router_checklist(self, router):
        """The one thing NoorCleaner cannot check for you: the router's own password. It never tries to log in."""
        px = self.theme.px
        self.router_identity = ttk.Label(self.router_box, text="", style="Hint.TLabel")
        self.router_identity.pack(anchor=self.W, pady=(px(6), 0))
        threading.Thread(target=lambda: self.events.put(("net_router", net.router_identity(router))),
                         daemon=True).start()
        row = self._row(self.router_box, pady=(px(6), 0))
        self._button(row, _("Open my router's page"), lambda: self._open_router(router), gap=12)
        done = self.config.get("router_password_changed")
        self.router_done = tk.BooleanVar(value=bool(done))
        ttk.Checkbutton(row, text=_("I changed my router's password and turned off remote management"),
                        variable=self.router_done, style="Card.TCheckbutton", command=self.toggle_router_done).pack(
            side=self.L)
        self._bullets(self.router_box, (
            _("Log in to the router page (the password is often on a sticker under the router)."),
            _("Change the admin password to a long, new one. Change the Wi-Fi password too."),
            _("Turn off remote management / remote administration, WPS and UPnP if you do not need them."),
            _("Install the router's firmware update if one is offered.")), style="CardSub.TLabel", wrap=820)

    def _show_router_identity(self, text):
        label = getattr(self, "router_identity", None)
        if label is not None and label.winfo_exists():
            label.config(text=_("Your router's login page calls itself: {name}").format(name=text) if text
                         else _("Could not read the router's login page."))

    def _open_router(self, router):
        import webbrowser
        webbrowser.open(f"http://{router}/")

    def toggle_router_done(self):
        self.config["router_password_changed"] = time.strftime("%Y-%m-%d") if self.router_done.get() else ""
        settings.save(self.config)

    def mark_known(self):
        chosen = [d for d in self._selected_items(self.devices_tree) if d.mac]
        if not chosen:
            self.info(_("Select a device first."))
            return
        known = self._known_devices() | {d.mac for d in chosen}
        self.config["known_devices"] = sorted(known)
        settings.save(self.config)
        self.load_devices()

    def forget_known(self):
        chosen = self._selected_items(self.devices_tree)
        known = self._known_devices() - {d.mac for d in chosen}
        self.config["known_devices"] = sorted(known)
        settings.save(self.config)
        self.load_devices()

    def block_selected_device(self):
        chosen = [d for d in self._selected_items(self.devices_tree) if not d.is_this_pc and not d.is_router]
        if not chosen:
            self.info(_("Select a device that is not your router or this PC."))
            return
        self.block_address_now(chosen[0].address)

    # ------------------------------------------------------------------ history

    def _history_page(self, parent):
        px = self.theme.px
        card = self._card(parent)
        row = self._row(card, pady=(0, px(8)))
        self._button(row, _("Refresh"), self.load_history, style="Primary.TButton", gap=12)
        self.history_status = ttk.Label(row, text=_("Attacks NoorCleaner noticed and blocks you made, newest first."),
                                        style="CardSub.TLabel")
        self.history_status.pack(side=self.L)
        frame, self.history_tree = make_tree(card, [("time", _("When"), 140), ("address", _("Address"), 170),
                                                    ("country", _("Country"), 140),
                                                    ("what", _("What happened"), 380), ("action", _("Action"), 100)])
        bar = self._row(card, pady=(px(10), 0))
        self._button(bar, _("Clear history"), self.clear_history)
        bar.pack_configure(side="bottom")
        frame.pack(fill="both", expand=True)
        self.load_history()
        return card

    def load_history(self):
        clear_tree(self.history_tree)
        entries = net.load_log()
        actions = {"detected": _("Noticed"), "blocked": _("Blocked")}
        for e in reversed(entries):
            when = time.strftime("%Y-%m-%d %H:%M", time.localtime(e.get("time", 0)))
            self.history_tree.insert("", "end", values=(when, e.get("address", ""), e.get("country") or "-",
                                                        e.get("reason", ""),
                                                        actions.get(e.get("action"), e.get("action", ""))))
        self.history_status.config(text=_("Events: {count}").format(count=len(entries)) if entries
                                   else _("Nothing yet. Attacks NoorCleaner notices will be listed here."))

    def clear_history(self):
        if self.ask(_("Clear the attack history?")):
            net.clear_log()
            self.load_history()

    # ------------------------------------------------------------------ live protection

    def toggle_monitor(self):
        self.config["live_monitor"] = self.monitor_var.get()
        settings.save(self.config)
        if self.monitor_var.get():
            self._monitor_ports = None
            self.info(_("Live protection is on. NoorCleaner checks every 30 seconds while it is open (you can "
                        "minimise it) and warns you if someone attacks. Nothing is blocked without you."))
            self._monitor_tick()

    def _monitor_tick(self):
        """Every 30 seconds: look at connections and open ports; warn about new attackers or new risky doors."""
        if not self.monitor_var.get():
            return
        if core.IS_WINDOWS and not self._monitor_busy:
            self._monitor_busy = True
            self._monitor_round += 1
            check_logons = is_admin() and self._monitor_round % 10 == 1  # the sign-in log is slower: every 5 minutes

            def work():
                try:
                    ports, conns = net.parse_netstat(net._run(["netstat", "-ano"]).stdout)
                    logons = None
                    if check_logons:
                        try:
                            logons = net.failed_logons()
                        except Exception:
                            logons = None
                    self.events.put(("net_alert", net.find_suspects(conns, logons), ports))
                except Exception:
                    self.events.put(("net_alert", [], None))

            threading.Thread(target=work, daemon=True).start()
        self.root.after(30000, self._monitor_tick)

    def _net_alert(self, suspects, ports):
        self._monitor_busy = False
        lines = []
        for s in suspects:
            key = (s.address, s.reason)
            net.log_event(s.address, s.reason, s.count, country=self.country_cache.get(s.address, ""))
            if key not in self._monitor_seen:
                self._monitor_seen.add(key)
                lines.append(f"{s.address}: {s.reason} ({s.count})")
        if ports is not None:
            risky = {(p.protocol, p.port) for p in ports if p.reachable and p.risk()[0] == net.HIGH}
            if self._monitor_ports is not None:
                for protocol, port in sorted(risky - self._monitor_ports):
                    lines.append(_("A risky door just opened: port {port} ({kind}).").format(port=port, kind=protocol))
            self._monitor_ports = risky
        if lines and self.root.state() == "withdrawn":  # running in the tray: a notification, no window
            self.sound.threat()
            self.tray.notify(_("NoorCleaner noticed something:") + "\n" + "\n".join(lines[:3]),
                             _("Possible attack"))
            self.load_history()
        elif lines:
            self.sound.threat()
            self.side_status.config(text=_("Warning: possible attack - see Network & ports"))
            self.show_view("network")
            self.load_history()
            self.scan_network()
            self.warn(_("NoorCleaner noticed something:") + "\n\n" + "\n".join(lines) + "\n\n"
                      + _("Open 'Network & ports' to block it."))
