// --- Audio track mapping ---
//
// Track numbers on archive.org are assigned by walking every du'a in order and
// handing out n1.mp3, n2.mp3, ... sequentially. That only stays correct while
// the recording's structure matches the text's du'a splitting exactly. Wherever
// the reciter merged two du'as into one file, or split one du'a across several,
// the count diverges and EVERY du'a after that point plays the wrong audio.
//
// TRACK_OVERRIDES pins specific du'as to specific tracks. Numbering resumes
// sequentially from wherever an override ends, so one correction re-aligns
// everything downstream. Use /audio-check.html to find them by ear.

// Most tracks are self-hosted on a GitHub Release for faster loading than
// streaming every file from archive.org directly. A handful of tracks
// weren't included in that release (upload gaps) — those still stream from
// archive.org, same as before. If the release is ever completed, just
// empty out MISSING_FROM_RELEASE.
var GITHUB_AUDIO_BASE = "https://github.com/fes-reshid/barnoota/releases/download/audio-v1/";
var MISSING_FROM_RELEASE = [71, 95, 105, 106, 110, 134, 139, 179, 193, 213, 214, 217, 219, 229, 247, 248, 249];
var MISSING_FROM_RELEASE_SET = {};
MISSING_FROM_RELEASE.forEach(function (n) { MISSING_FROM_RELEASE_SET[n] = true; });

function audioUrl(num) {
  if (MISSING_FROM_RELEASE_SET[num]) {
    return "https://archive.org/download/peacefulmankind_Hisnul_Muslim/n" + num + ".mp3";
  }
  return GITHUB_AUDIO_BASE + "n" + num + ".mp3";
}

var ALIMRAN_AYAH_URLS = Array.from({ length: 11 }, function (_, i) {
  var n = 190 + i;
  return GITHUB_AUDIO_BASE + "ayah-" + n + ".mp3";
});

// Which track(s) a given du'a uses.
//   key   "<chapterNum>:<duaIndex>"   (duaIndex is 0-based within the chapter)
//   value "n21"      -> that single track
//         "n21-n25"  -> that inclusive range
// Numbering continues sequentially from the end of the range. To make two
// du'as share one file (the reciter read them together), give them both the
// same track — e.g. "n40" and "n40".
// Calibrated by ear via audio-check.html. Chapter 15's merged adhan-response
// entry turned out to be a single file (n22), not the five-track range
// originally assumed.
var TRACK_OVERRIDES = {
  "2:0": "n5",
  "15:0": "n22",
  "25:4": "n66",
  "26:2": "n71",
  "27:0": "n71",
  "27:1": "n72",
  "27:2": "n66",
  "27:3": "n74",
  "27:19": "n89",
  "27:20": "n90"
};

function isTopicHeader(d) {
  var a = d.arabic.trimStart();
  if (a.startsWith("(") || a.startsWith("«") || a.startsWith('"')) return false;
  return /\d+\s*[ـ\-]+/.test(a);
}

function isAlimranCombinedDua(d) {
  // Khawatim Aali Imraan (3:190-200) comes from a different recitation source
  // entirely, so it never draws from the sequential archive.org counter.
  // Diacritic ordering in the source JSON can differ from this literal's
  // combining-mark order (same rendered text); normalize before comparing.
  return d.arabic.normalize("NFC").indexOf("خَلْقِ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ وَٱخْتِلَٰفِ".normalize("NFC")) !== -1;
}

// Accepts "n3", "3", "n3-n4", "n3 - n4", "3-4". Returns {start, end} track
// numbers, or null if it isn't parseable.
function parseTrackRange(value) {
  if (value == null) return null;
  if (typeof value === "number") return null; // legacy count form, handled below
  var s = String(value).trim().toLowerCase().replace(/\s+/g, "");
  var m = s.match(/^n?(\d+)(?:[-–—]n?(\d+))?$/);
  if (!m) return null;
  var a = parseInt(m[1], 10);
  var b = m[2] ? parseInt(m[2], 10) : a;
  if (!isFinite(a) || a < 1) return null;
  if (!isFinite(b) || b < a) b = a;
  return { start: a, end: b };
}

function formatTrackRange(start, end) {
  return end > start ? "n" + start + "-n" + end : "n" + start;
}

// Build the whole chapter -> {urls, duaRanges} map from a given override table.
// Exposed so the calibration page can rebuild live as overrides are edited.
function buildAudioMap(overrides) {
  overrides = overrides || {};
  var map = {};
  var track = 0; // highest archive.org track number consumed so far

  CHAPTERS.forEach(function (c) {
    var urls = [];
    var duaRanges = [];
    var trackToIdx = {}; // track number -> index in this chapter's urls

    function useTracks(from, to) {
      var idxs = [];
      for (var n = from; n <= to; n++) {
        if (trackToIdx[n] === undefined) {
          trackToIdx[n] = urls.length;
          urls.push(audioUrl(n));
        }
        idxs.push(trackToIdx[n]);
      }
      return { start: Math.min.apply(null, idxs), end: Math.max.apply(null, idxs) };
    }

    c.duas.forEach(function (d, i) {
      if (isTopicHeader(d)) {
        duaRanges.push(null);
        return;
      }

      if (isAlimranCombinedDua(d)) {
        var startA = urls.length;
        urls.push.apply(urls, ALIMRAN_AYAH_URLS);
        duaRanges.push({ start: startA, end: urls.length - 1 });
        return;
      }

      var key = c.num + ":" + i;
      var raw = Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : null;

      if (raw === "none") {
        // No recording exists for this du'a yet (text added after the
        // narration was tracked) — skip it without consuming a track
        // number, so everything after it keeps its calibrated alignment.
        duaRanges.push(null);
        return;
      }

      var rng = parseTrackRange(raw);

      if (rng) {
        duaRanges.push(useTracks(rng.start, rng.end));
        // Resume sequential numbering after this range.
        if (rng.end > track) track = rng.end;
        return;
      }

      // Legacy numeric form: a count of consecutive tracks.
      if (typeof raw === "number") {
        if (raw <= 0) {
          var prev = urls.length - 1;
          duaRanges.push(prev >= 0 ? { start: prev, end: prev } : null);
          return;
        }
        var lo = track + 1;
        track += raw;
        duaRanges.push(useTracks(lo, track));
        return;
      }

      track += 1;
      duaRanges.push(useTracks(track, track));
    });

    map[c.num] = { urls: urls, duaRanges: duaRanges };
  });

  return map;
}

var audioByChapter = buildAudioMap(TRACK_OVERRIDES);

function urlsForChapter(num) {
  return (audioByChapter[num] && audioByChapter[num].urls) || [];
}
function rangeForDua(chapterNum, duaIndex) {
  return (audioByChapter[chapterNum] && audioByChapter[chapterNum].duaRanges[duaIndex]) || null;
}
function fmtTime(s) {
  if (!isFinite(s) || s < 0) return "0:00";
  var m = Math.floor(s / 60);
  var sec = Math.floor(s % 60);
  return m + ":" + String(sec).padStart(2, "0");
}
