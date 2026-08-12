import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, BellOff, MapPin, Loader2, Check, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  AdhkarKind,
  NotifPrefs,
  computeSchedule,
  getLocation,
  loadPrefs,
  refreshTimingsIfNeeded,
  requestPermission,
  savePrefs,
  scheduleAll,
} from "@/lib/notifications";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Beeksisa — Hisnul Muslim" },
      { name: "description", content: "Yaadachiisa zikrii ganama, galgalaa fi hirribaa." },
    ],
  }),
});

const ROWS: { kind: AdhkarKind; label: string; hint: string }[] = [
  { kind: "morning", label: "Zikrii Ganama", hint: "Fajr booda" },
  { kind: "evening", label: "Zikrii Galgala", hint: "Asr booda" },
  { kind: "sleep",   label: "Zikrii Hirribaa", hint: "Halkan" },
];

function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(() =>
    typeof window === "undefined" ? { enabled: false, lat: null, lon: null, overrides: {} } : loadPrefs(),
  );
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await refreshTimingsIfNeeded(prefs);
      if (cancelled) return;
      if (refreshed !== prefs) setPrefs(refreshed);
      scheduleAll(refreshed);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.enabled, prefs.lat, prefs.lon, prefs.overrides.morning, prefs.overrides.evening, prefs.overrides.sleep]);

  const update = (patch: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...patch };
    savePrefs(next);
    setPrefs(next);
  };

  const enable = async () => {
    setErr(null);
    setBusy("perm");
    try {
      const p = await requestPermission();
      setPerm(p);
      if (p !== "granted") {
        setErr("Hayyamni beeksisaa hin kennamne.");
        return;
      }
      update({ enabled: true });
    } finally {
      setBusy(null);
    }
  };

  const useLocation = async () => {
    setErr(null);
    setBusy("loc");
    try {
      const { lat, lon } = await getLocation();
      update({ lat, lon, lastFetchedDate: undefined, cachedTimings: undefined });
    } catch (e: any) {
      setErr(e?.message || "Bakka argachuun hin milkoofne.");
    } finally {
      setBusy(null);
    }
  };

  const schedule = computeSchedule(prefs);

  return (
    <AppShell>
      <header className="animate-fade-in">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Beeksisa</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">
          Yaadachiisa <span className="gold-text">Zikrii</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ganama, galgalaa fi hirribaan zikrii akka hin daganne sii yaadachiifna.
        </p>
      </header>

      {/* Permission + master switch */}
      <section className="glass mt-6 rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              {prefs.enabled && perm === "granted" ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-display text-base font-semibold text-foreground">
                {prefs.enabled && perm === "granted" ? "Beeksisni banameera" : "Beeksisni cufameera"}
              </p>
              <p className="text-xs text-muted-foreground">
                {perm === "granted" ? "Hayyamni kenname." : perm === "denied" ? "Hayyamni didamee jira." : "Hayyamni hin kenname."}
              </p>
            </div>
          </div>
          {prefs.enabled && perm === "granted" ? (
            <button
              onClick={() => update({ enabled: false })}
              className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:border-gold hover:text-gold"
            >
              Cufi
            </button>
          ) : (
            <button
              onClick={enable}
              disabled={busy === "perm"}
              className="rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              {busy === "perm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Bani"}
            </button>
          )}
        </div>
      </section>

      {/* Location */}
      <section className="glass mt-4 rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-gold">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-foreground">Bakka kee</p>
              <p className="text-xs text-muted-foreground">
                {prefs.lat != null && prefs.lon != null
                  ? `${prefs.lat.toFixed(2)}, ${prefs.lon.toFixed(2)}`
                  : "Yeroo salaataa irraa hidhata."}
              </p>
            </div>
          </div>
          <button
            onClick={useLocation}
            disabled={busy === "loc"}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:border-gold hover:text-gold"
          >
            {busy === "loc" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : prefs.lat != null ? "Haaromsi" : "Fayyadami"}
          </button>
        </div>
        {prefs.cachedTimings && (
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {(["Fajr", "Asr", "Maghrib", "Isha"] as const).map((k) => (
              <div key={k} className="rounded-2xl bg-background/60 p-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                <p className="font-display text-sm font-semibold text-foreground">{prefs.cachedTimings![k]}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Per-adhkar schedule */}
      <section className="mt-4 space-y-3">
        {ROWS.map(({ kind, label, hint }) => (
          <div key={kind} className="glass rounded-3xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <input
                type="time"
                value={prefs.overrides[kind] ?? schedule[kind] ?? ""}
                onChange={(e) => update({ overrides: { ...prefs.overrides, [kind]: e.target.value } })}
                className="rounded-xl border border-border bg-background px-3 py-2 font-display text-sm tabular-nums text-foreground focus:border-gold focus:outline-none"
              />
            </div>
            {prefs.overrides[kind] && (
              <button
                onClick={() => {
                  const next = { ...prefs.overrides };
                  delete next[kind];
                  update({ overrides: next });
                }}
                className="mt-2 text-[11px] text-muted-foreground hover:text-gold"
              >
                Yeroo salaataatti deebisi
              </button>
            )}
          </div>
        ))}
      </section>

      {err && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {prefs.enabled && perm === "granted" && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-gold/30 bg-gold-soft/20 p-3 text-xs text-foreground">
          <Check className="h-4 w-4 shrink-0 text-gold" />
          <span>
            Beeksisni karaa browser kee ergama. Iddoo isaanii dhugaa argachuuf, appii kana
            <strong> screen mana keessanitti </strong> dabalaa (Add to Home Screen).
          </span>
        </div>
      )}
    </AppShell>
  );
}
