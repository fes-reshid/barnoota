// Approximate Fajr / Maghrib calculator, entirely offline (no network calls).
//
// Used only to time the "time for morning/evening adhkar" reminder — not
// intended as a fiqh-precise adhan time. Accuracy is roughly +/-2 minutes,
// using the standard low-precision solar position formulas (equation of
// time + declination from Julian day) that most prayer-time apps build on.
(function (global) {
  "use strict";

  function dtr(d) { return (d * Math.PI) / 180; }
  function rtd(r) { return (r * 180) / Math.PI; }
  function sin_(d) { return Math.sin(dtr(d)); }
  function cos_(d) { return Math.cos(dtr(d)); }
  function tan_(d) { return Math.tan(dtr(d)); }
  function asin_(x) { return rtd(Math.asin(Math.max(-1, Math.min(1, x)))); }
  function acos_(x) { return rtd(Math.acos(Math.max(-1, Math.min(1, x)))); }
  function atan2_(y, x) { return rtd(Math.atan2(y, x)); }
  function acot_(x) { return atan2_(1, x); }
  function fixAngle(a) { a = a % 360; return a < 0 ? a + 360 : a; }
  function fixHour(h) { h = h % 24; return h < 0 ? h + 24 : h; }

  // Julian day number at 0h UTC for a Gregorian calendar date.
  function julianDay(year, month, day) {
    if (month <= 2) { year -= 1; month += 12; }
    var A = Math.floor(year / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  }

  // Sun's declination (degrees) and the equation of time (hours) for a given
  // Julian day.
  function sunPosition(jd) {
    var D = jd - 2451545.0;
    var g = fixAngle(357.529 + 0.98560028 * D);
    var q = fixAngle(280.459 + 0.98564736 * D);
    var L = fixAngle(q + 1.915 * sin_(g) + 0.020 * sin_(2 * g));
    var e = 23.439 - 0.00000036 * D;
    var RA = fixHour(atan2_(cos_(e) * sin_(L), cos_(L)) / 15);
    var eqt = q / 15 - RA;
    var decl = asin_(sin_(e) * sin_(L));
    return { declination: decl, equation: eqt };
  }

  // Half the length (in hours) of the period during which the sun is at
  // least `angle` degrees below the horizon, for the given latitude and
  // solar declination. Null if the sun never reaches that angle (polar
  // regions around the solstices).
  function hourAngle(angle, lat, decl) {
    var cosH = (-sin_(angle) - sin_(lat) * sin_(decl)) / (cos_(lat) * cos_(decl));
    if (cosH > 1 || cosH < -1) return null;
    return acos_(cosH) / 15;
  }

  // Returns { fajr, sunrise, dhuhr, asr, maghrib, isha: Date } for the given
  // calendar date (read in UTC) and location, or null near the poles when
  // the sun doesn't reach the needed angle that day. Defaults follow the
  // Muslim World League convention (Fajr 18°, Isha 17°) and the majority
  // (Shafi'i/Maliki/Hanbali) Asr shadow factor of 1 - pass `opts` to
  // override any of fajrAngle/ishaAngle/asrFactor. Maghrib is geometric
  // sunset (~0.833° for refraction).
  function computeTimes(date, lat, lon, opts) {
    opts = opts || {};
    var fajrAngle = opts.fajrAngle == null ? 18 : opts.fajrAngle;
    var ishaAngle = opts.ishaAngle == null ? 17 : opts.ishaAngle;
    var asrFactor = opts.asrFactor == null ? 1 : opts.asrFactor;
    var jd = julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    var sun = sunPosition(jd);
    var solarNoonUTC = fixHour(12 - lon / 15 - sun.equation);

    var hFajr = hourAngle(fajrAngle, lat, sun.declination);
    var hSunset = hourAngle(0.833, lat, sun.declination);
    var hIsha = hourAngle(ishaAngle, lat, sun.declination);
    // Same "hours from solar noon where the sun reaches this angle" formula
    // as Fajr/Isha, just with a negative (above-horizon) angle instead of a
    // below-horizon one - see the PrayTimes.org reference algorithm this is
    // adapted from.
    var asrAngle = -acot_(asrFactor + Math.abs(tan_(lat - sun.declination)));
    var hAsr = hourAngle(asrAngle, lat, sun.declination);
    if (hFajr == null || hSunset == null || hIsha == null || hAsr == null) return null;

    function toDate(hoursUTC) {
      var d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      d.setUTCMinutes(Math.round(hoursUTC * 60));
      return d;
    }

    return {
      fajr: toDate(solarNoonUTC - hFajr),
      sunrise: toDate(solarNoonUTC - hSunset),
      dhuhr: toDate(solarNoonUTC + 1 / 60),
      asr: toDate(solarNoonUTC + hAsr),
      maghrib: toDate(solarNoonUTC + hSunset),
      isha: toDate(solarNoonUTC + hIsha)
    };
  }

  global.PrayerTimes = { computeTimes: computeTimes };
})(typeof self !== "undefined" ? self : this);
