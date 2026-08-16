// Local notification scheduling for adhkar.
// Uses Notification API + setTimeout. Persists prefs to localStorage.
// Note: true background push requires a service worker + push server.

export type AdhkarKind = "morning" | "evening" | "sleep";

export type NotifPrefs = {
  enabled: boolean;
  lat: number | null;
  lon: number | null;
  // HH:MM overrides, empty = derive from prayer times
  overrides: Partial<Record<AdhkarKind, string>>;
  lastFetchedDate?: string; // YYYY-MM-DD
  cachedTimings?: { Fajr: string; Asr: string; Maghrib: string; Isha: string };
};

const KEY = "hisn:notif:v1";

export const defaultPrefs: NotifPrefs = {
  enabled: false,
  lat: null,
  lon: null,
  overrides: {},
};

export function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(p: NotifPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

export function getLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation unsupported"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject(e),
      { timeout: 10_000, maximumAge: 60 * 60 * 1000 },
    );
  });
}

type Timings = NotifPrefs["cachedTimings"];

export async function fetchTimings(lat: number, lon: number, date = new Date()): Promise<Timings> {
  const d = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${d}?latitude=${lat}&longitude=${lon}&method=2`;
  const res = await fetch(url);
  const json = await res.json();
  const t = json?.data?.timings;
  if (!t) throw new Error("No timings");
  return { Fajr: t.Fajr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
}

// Compute today's HH:MM for each adhkar
export function computeSchedule(prefs: NotifPrefs): Record<AdhkarKind, string | null> {
  const t = prefs.cachedTimings;
  const fromPrayer = (hhmm: string, addMin = 0) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m + addMin, 0, 0);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  return {
    morning: prefs.overrides.morning ?? (t ? fromPrayer(t.Fajr, 20) : null),
    evening: prefs.overrides.evening ?? (t ? fromPrayer(t.Asr, 15) : null),
    sleep: prefs.overrides.sleep ?? (t ? fromPrayer(t.Isha, 60) : "22:30"),
  };
}

const LABELS: Record<AdhkarKind, { title: string; body: string; chapter: number }> = {
  morning: { title: "Zikrii Ganama", body: "Yeroon zikrii ganamaa ga'eera.", chapter: 27 },
  evening: { title: "Zikrii Galgala", body: "Yeroon zikrii galgalaa ga'eera.", chapter: 28 },
  sleep:   { title: "Zikrii Hirribaa", body: "Osoo hin rafin dura zikrii dubbisi.", chapter: 29 },
};

let timers: number[] = [];

function clearTimers() {
  timers.forEach((id) => clearTimeout(id));
  timers = [];
}

function fire(kind: AdhkarKind) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const meta = LABELS[kind];
  try {
    const n = new Notification(meta.title, {
      body: meta.body,
      tag: `hisn-${kind}`,
      icon: "/favicon.ico",
    });
    n.onclick = () => {
      window.focus();
      window.location.href = `/category/${meta.chapter}`;
    };
  } catch {}
}

export function scheduleAll(prefs: NotifPrefs) {
  clearTimers();
  if (!prefs.enabled) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const schedule = computeSchedule(prefs);
  const now = new Date();

  (Object.keys(schedule) as AdhkarKind[]).forEach((kind) => {
    const hhmm = schedule[kind];
    if (!hhmm) return;
    const [h, m] = hhmm.split(":").map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    // Browsers cap at ~24.8 days; we're well within bounds.
    const id = window.setTimeout(() => {
      fire(kind);
      // Reschedule for the next day
      const next = window.setTimeout(() => {
        fire(kind);
      }, 24 * 60 * 60 * 1000);
      timers.push(next);
    }, delay);
    timers.push(id);
  });
}

export async function refreshTimingsIfNeeded(prefs: NotifPrefs): Promise<NotifPrefs> {
  if (prefs.lat == null || prefs.lon == null) return prefs;
  const today = new Date().toISOString().slice(0, 10);
  if (prefs.lastFetchedDate === today && prefs.cachedTimings) return prefs;
  try {
    const t = await fetchTimings(prefs.lat, prefs.lon);
    const updated: NotifPrefs = { ...prefs, cachedTimings: t, lastFetchedDate: today };
    savePrefs(updated);
    return updated;
  } catch {
    return prefs;
  }
}
