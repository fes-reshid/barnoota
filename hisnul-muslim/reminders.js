// Reminds the reader when it's time for the morning (Fajr) and evening
// (Maghrib) adhkar chapter, based on the device's own location — plus an
// independent, location-free bedtime reminder for a wall-clock time the
// reader picks themselves, pointing at the "Zikriiwwan hirribaa" chapter.
//
// This is a static site with no server, so there is no way to wake the app
// while it's fully closed and push a notification at the exact instant —
// that needs a server + the Push API. Instead: whenever the app is open (or
// gets reopened/brought to the foreground), it schedules a timer for the
// next upcoming reminder (Fajr/Maghrib/bedtime, whichever comes first) and
// also "catches up" on any that already passed today but weren't shown yet.
// In practice this fires on time whenever the phone/app is active, and
// otherwise the moment the app is next opened that day.
(function (global) {
  "use strict";

  var COORDS_KEY = "hisn:reminders:coords";
  var ENABLED_KEY = "hisn:reminders:enabled";
  var FIRED_KEY = "hisn:reminders:fired";
  var REMINDER_CHAPTER = 27; // "Zikriiwwan ganamaafi galgalaa"

  var BEDTIME_ENABLED_KEY = "hisn:reminders:bedtime:enabled";
  var BEDTIME_TIME_KEY = "hisn:reminders:bedtime:time";
  var BEDTIME_DEFAULT_TIME = "22:00";
  var BEDTIME_CHAPTER = 28; // "Zikriiwwan hirribaa"

  var CHAPTER_BY_WHICH = { fajr: REMINDER_CHAPTER, maghrib: REMINDER_CHAPTER, bedtime: BEDTIME_CHAPTER };

  var MESSAGES = {
    fajr: {
      title: "Yeroon zikrii ganamaa ga'e",
      body: "Zikriifi du'aa'ii ganamaa dubbisuuf yeroon mijaawaadha."
    },
    maghrib: {
      title: "Yeroon zikrii galgalaa ga'e",
      body: "Zikriifi du'aa'ii galgalaa dubbisuuf yeroon mijaawaadha."
    },
    bedtime: {
      title: "Yeroon zikrii hirribaa ga'e",
      body: "Hirribatti seenuun dura zikriifi du'aa'ii hirribaa dubbisi."
    }
  };

  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function dateKey(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function localMidnightUTC(d) { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }

  function loadCoords() {
    try { var r = localStorage.getItem(COORDS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function saveCoords(c) { try { localStorage.setItem(COORDS_KEY, JSON.stringify(c)); } catch (e) {} }

  function isEnabled() { try { return localStorage.getItem(ENABLED_KEY) === "1"; } catch (e) { return false; } }
  function setEnabled(v) { try { localStorage.setItem(ENABLED_KEY, v ? "1" : "0"); } catch (e) {} }

  function isBedtimeEnabled() { try { return localStorage.getItem(BEDTIME_ENABLED_KEY) === "1"; } catch (e) { return false; } }
  function setBedtimeEnabled(v) { try { localStorage.setItem(BEDTIME_ENABLED_KEY, v ? "1" : "0"); } catch (e) {} }
  function loadBedtimeTime() {
    try { return localStorage.getItem(BEDTIME_TIME_KEY) || BEDTIME_DEFAULT_TIME; } catch (e) { return BEDTIME_DEFAULT_TIME; }
  }
  function saveBedtimeTime(v) { try { localStorage.setItem(BEDTIME_TIME_KEY, v); } catch (e) {} }

  function loadFired() { try { return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}"); } catch (e) { return {}; } }
  function hasFired(key, which) { var f = loadFired(); return !!(f[key] && f[key][which]); }
  function markFired(key, which) {
    var f = loadFired();
    if (!f[key]) f[key] = {};
    f[key][which] = true;
    var keys = Object.keys(f).sort();
    while (keys.length > 3) { delete f[keys.shift()]; }
    try { localStorage.setItem(FIRED_KEY, JSON.stringify(f)); } catch (e) {}
  }

  // { key, fajr: Date, maghrib: Date } for today (offset 0) or another day,
  // or null if there's no stored location yet.
  function timesForOffset(offset) {
    var c = loadCoords();
    if (!c || typeof global.PrayerTimes === "undefined") return null;
    var now = new Date();
    var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    var t = PrayerTimes.computeTimes(localMidnightUTC(day), c.lat, c.lon);
    if (!t) return null;
    return { key: dateKey(day), fajr: t.fajr, maghrib: t.maghrib };
  }

  // Bedtime isn't tied to the sun — it's a plain wall-clock time the reader
  // picks themselves, so unlike timesForOffset() this needs no location.
  function bedtimeTimesForOffset(offset) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(loadBedtimeTime());
    if (!m) return null;
    var hh = parseInt(m[1], 10), mm = parseInt(m[2], 10);
    if (hh > 23 || mm > 59) return null;
    var now = new Date();
    var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hh, mm, 0, 0);
    return { key: dateKey(day), bedtime: day };
  }

  function fire(which) {
    var msg = MESSAGES[which];
    if (!msg || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      reg.showNotification(msg.title, {
        body: msg.body,
        icon: "icons/icon-192.png",
        badge: "icons/icon-192.png",
        tag: "hisn-reminder-" + which,
        data: { url: "#/category/" + CHAPTER_BY_WHICH[which] }
      }).catch(function () {});
    }).catch(function () {});
  }

  var pendingTimer = null;

  function checkCatchUp() {
    var now = Date.now();
    if (isEnabled()) {
      var today = timesForOffset(0);
      if (today) {
        ["fajr", "maghrib"].forEach(function (which) {
          if (today[which].getTime() <= now && !hasFired(today.key, which)) {
            markFired(today.key, which);
            fire(which);
          }
        });
      }
    }
    if (isBedtimeEnabled()) {
      var bt = bedtimeTimesForOffset(0);
      if (bt && bt.bedtime.getTime() <= now && !hasFired(bt.key, "bedtime")) {
        markFired(bt.key, "bedtime");
        fire("bedtime");
      }
    }
  }

  function scheduleNext() {
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }

    var now = Date.now();
    var candidates = [];
    if (isEnabled()) {
      [0, 1].forEach(function (offset) {
        var t = timesForOffset(offset);
        if (!t) return;
        ["fajr", "maghrib"].forEach(function (which) {
          if (t[which].getTime() > now && !hasFired(t.key, which)) {
            candidates.push({ which: which, key: t.key, at: t[which] });
          }
        });
      });
    }
    if (isBedtimeEnabled()) {
      [0, 1].forEach(function (offset) {
        var t = bedtimeTimesForOffset(offset);
        if (t && t.bedtime.getTime() > now && !hasFired(t.key, "bedtime")) {
          candidates.push({ which: "bedtime", key: t.key, at: t.bedtime });
        }
      });
    }
    if (!candidates.length) return;
    candidates.sort(function (a, b) { return a.at - b.at; });
    var next = candidates[0];

    pendingTimer = setTimeout(function () {
      markFired(next.key, next.which);
      fire(next.which);
      scheduleNext();
    }, Math.max(0, next.at.getTime() - now));
  }

  async function enable() {
    if (!("geolocation" in navigator)) return { ok: false, reason: "geo-unsupported" };
    if (!("Notification" in global)) return { ok: false, reason: "notif-unsupported" };

    var perm = Notification.permission;
    if (perm === "default") {
      try { perm = await Notification.requestPermission(); } catch (e) { perm = "denied"; }
    }
    if (perm !== "granted") return { ok: false, reason: "notif-denied" };

    var pos;
    try {
      pos = await new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, maximumAge: 3600000 });
      });
    } catch (e) {
      return { ok: false, reason: "geo-denied" };
    }

    saveCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() });
    setEnabled(true);
    checkCatchUp();
    scheduleNext();
    return { ok: true };
  }

  function disable() {
    setEnabled(false);
    scheduleNext(); // re-clears/re-picks the timer; a bedtime reminder may still be pending
  }

  // Bedtime only needs notification permission, not location.
  async function enableBedtime() {
    if (!("Notification" in global)) return { ok: false, reason: "notif-unsupported" };
    var perm = Notification.permission;
    if (perm === "default") {
      try { perm = await Notification.requestPermission(); } catch (e) { perm = "denied"; }
    }
    if (perm !== "granted") return { ok: false, reason: "notif-denied" };

    setBedtimeEnabled(true);
    checkCatchUp();
    scheduleNext();
    return { ok: true };
  }

  function disableBedtime() {
    setBedtimeEnabled(false);
    scheduleNext();
  }

  function setBedtimeTime(v) {
    saveBedtimeTime(v);
    if (isBedtimeEnabled()) { checkCatchUp(); scheduleNext(); }
  }

  function init() {
    checkCatchUp();
    scheduleNext();
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        checkCatchUp();
        scheduleNext();
      }
    });
  }

  global.RemindersAPI = {
    isEnabled: isEnabled,
    hasCoords: function () { return !!loadCoords(); },
    enable: enable,
    disable: disable,
    todaysTimes: function () { return timesForOffset(0); },
    isBedtimeEnabled: isBedtimeEnabled,
    bedtimeTime: loadBedtimeTime,
    enableBedtime: enableBedtime,
    disableBedtime: disableBedtime,
    setBedtimeTime: setBedtimeTime,
    init: init
  };

  init();
})(typeof window !== "undefined" ? window : this);
