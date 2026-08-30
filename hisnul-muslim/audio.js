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

// Most tracks are self-hosted as plain static files in this repo (served
// by GitHub Pages alongside the rest of the app) rather than as GitHub
// Release assets. Release assets are always served with
// "Content-Type: application/octet-stream", "Content-Disposition:
// attachment", and "X-Content-Type-Options: nosniff" - a combination
// desktop browsers mostly shrug off but iOS Safari takes literally,
// treating the file as a forced download instead of playable inline
// audio and failing every <audio> playback silently. Plain static files
// get a correct "audio/mpeg" Content-Type and no attachment header, same
// as any other asset on the site. A handful of tracks weren't included
// in that migration (upload gaps) — those still stream from archive.org,
// same as before. If that gap is ever closed, just empty out
// MISSING_FROM_RELEASE.
var LOCAL_AUDIO_BASE = "audio/";
var MISSING_FROM_RELEASE = [95, 105, 106, 110, 134, 139, 179, 193, 213, 214, 217, 219, 229, 247, 248, 249];
var MISSING_FROM_RELEASE_SET = {};
MISSING_FROM_RELEASE.forEach(function (n) { MISSING_FROM_RELEASE_SET[n] = true; });

function audioUrl(num) {
  if (MISSING_FROM_RELEASE_SET[num]) {
    return "https://archive.org/download/peacefulmankind_Hisnul_Muslim/n" + num + ".mp3";
  }
  return LOCAL_AUDIO_BASE + "n" + num + ".mp3";
}

var ALIMRAN_AYAH_URLS = Array.from({ length: 11 }, function (_, i) {
  var n = 190 + i;
  return LOCAL_AUDIO_BASE + "ayah-" + n + ".mp3";
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
// originally assumed. Chapter 132 (the book's closing etiquette/colophon
// text) has no matching recording at all - both its entries are pinned
// "none" so they don't try to claim a track.
var TRACK_OVERRIDES = {
  "2:0": "n5",
  "15:0": "n22",
  "25:4": "n66",
  "26:1": "none",
  "26:2": "none",
  "27:0": "n71",
  "27:1": "n72",
  "27:2": "n66",
  "27:3": "n74",
  "27:19": "n89",
  "27:20": "n90",
  "28:0": "n71",
  "28:1": "n72",
  "28:2": "n66",
  "28:3": "n74",
  "28:4": "n75",
  "28:5": "n76",
  "28:6": "n77",
  "28:7": "n78",
  "28:8": "n79",
  "28:9": "n80",
  "28:10": "n81",
  "28:11": "n82",
  "28:12": "n83",
  "28:13": "n84",
  "28:14": "n85",
  "28:15": "n86",
  "28:16": "n87",
  "28:17": "n88",
  "28:18": "n89",
  "28:19": "n89",
  "28:20": "n90",
  "28:21": "n91",
  "28:22": "n92",
  "28:23": "n93",
  "28:24": "n94",
  "29:0": "n66",
  "29:1": "n96",
  "29:2": "n97",
  "29:3": "n98",
  "29:4": "n99",
  "29:5": "n100",
  "29:6": "n101",
  "29:7": "n102",
  "29:8": "n103",
  "29:9": "n104",
  "29:10": "n105",
  "29:11": "n106",
  "29:12": "n107",
  "32:1": "n110",
  "32:2": "n110",
  "32:3": "n110",
  "32:4": "n110",
  "33:0": "n111",
  "41:1": "n128",
  "41:2": "n128",
  "46:1": "n135",
  "46:2": "n135",
  "50:0": "n140",
  "50:1": "n141",
  "51:0": "n141",
  "52:0": "n142",
  "108:2": "n214",
  "108:3": "n214",
  "108:4": "n214",
  "109:0": "n214",
  "109:1": "n214",
  "109:2": "n214",
  "110:0": "n215",
  "112:0": "n216",
  "113:0": "n218",
  "115:0": "n220",
  "116:0": "n221",
  "117:0": "n222",
  "124:0": "n229",
  "130:1": "n235",
  "130:2": "n235",
  "130:3": "n235",
  "130:4": "n235",
  "130:5": "n235",
  "131:9": "n244",
  "133:0": "none",
  "133:1": "none"
};

// Real, dedicated recordings for specific du'as, replacing whatever track
// they'd otherwise resolve to (an archive.org number via TRACK_OVERRIDES or
// the plain sequential counter) — used for one-off re-recordings, not for
// the archive.org "nXX" numbering scheme. Unlike TRACK_OVERRIDES, applying
// one of these never advances or otherwise touches the sequential track
// counter, so nothing after it shifts (see useTracks in buildAudioMap).
//
// Chapters 27/28 (Zikrii Ganamaa/Galgalaa) started out as an exact copy of
// the same 25 du'as with the morning recording as a placeholder for all of
// them (see TRACK_OVERRIDES above); these six are the day/night-reworded
// du'as (4, 5, 7, 8, 16, 17) now replaced with their own real evening
// recordings.
var LOCAL_OVERRIDES = {
  "16:2": "Ch16d3.mp3",
  "16:5": "Ch16d6.mp3",
  "24:2": "Ch24d3.mp3",
  "24:4": "Ch24d5.mp3",
  "24:5": "Ch24d6.mp3",
  "24:7": "Ch24d8.mp3",
  "24:8": "Ch24d9.mp3",
  "24:9": "Ch24d10.mp3",
  "28:3": "Ch28d4.mp3",
  "28:4": "Ch28d5.mp3",
  "28:6": "Ch28d7.mp3",
  "28:7": "Ch28d8.mp3",
  "28:15": "Ch28d16.mp3",
  "28:16": "Ch28d17.mp3"
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

    function useTracks(from, to, duaIndex) {
      var localFile = duaIndex != null ? LOCAL_OVERRIDES[c.num + ":" + duaIndex] : null;
      var idxs = [];
      for (var n = from; n <= to; n++) {
        if (trackToIdx[n] === undefined) {
          trackToIdx[n] = urls.length;
          urls.push(localFile ? (LOCAL_AUDIO_BASE + localFile) : audioUrl(n));
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
        duaRanges.push(useTracks(rng.start, rng.end, i));
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
        duaRanges.push(useTracks(lo, track, i));
        return;
      }

      track += 1;
      duaRanges.push(useTracks(track, track, i));
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
