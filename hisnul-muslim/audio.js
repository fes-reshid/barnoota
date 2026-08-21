// --- Audio track mapping ---
//
// Track numbers on archive.org are assigned by walking every du'a in order and
// handing out n1.mp3, n2.mp3, ... sequentially. That only stays correct while
// the recording's structure matches the text's du'a splitting exactly. Wherever
// the reciter merged two du'as into one file, or split one du'a across several,
// the count diverges and EVERY du'a after that point plays the wrong audio.
//
// TRACK_COUNT_OVERRIDES corrects those spots. Use /audio-check.html to find them
// by ear, then paste the exported table here.

function audioUrl(num) {
  return "https://archive.org/download/peacefulmankind_Hisnul_Muslim/n" + num + ".mp3";
}

var ALIMRAN_AYAH_URLS = Array.from({ length: 11 }, function (_, i) {
  var n = 190 + i;
  return "https://everyayah.com/data/Alafasy_128kbps/003" + n + ".mp3";
});

// How many consecutive archive.org tracks a given du'a consumes.
//   key   "<chapterNum>:<duaIndex>"   (duaIndex is 0-based within the chapter)
//   value number of tracks
//     1  = default, never needs an entry
//     2+ = the reciter split this du'a across that many files
//     0  = this du'a shares the previous file (reciter read them together)
var TRACK_COUNT_OVERRIDES = {
  // Chapter 15 (adhan adhkar): five sequential adhan-response du'as are shown
  // as one merged entry in the text, but the recording keeps all five files.
  "15:0": 5
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

// Build the whole chapter -> {urls, duaRanges} map from a given override table.
// Exposed so the calibration page can rebuild live as overrides are edited.
function buildAudioMap(overrides, startTrack) {
  overrides = overrides || {};
  var map = {};
  var track = typeof startTrack === "number" ? startTrack : 0;

  CHAPTERS.forEach(function (c) {
    var urls = [];
    var duaRanges = [];

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
      var count = Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : 1;

      if (count <= 0) {
        // Shares the previous track: point at whatever the last one was, and
        // don't advance the counter.
        var prev = urls.length - 1;
        duaRanges.push(prev >= 0 ? { start: prev, end: prev } : null);
        return;
      }

      var startB = urls.length;
      for (var k = 0; k < count; k++) {
        track += 1;
        urls.push(audioUrl(track));
      }
      duaRanges.push({ start: startB, end: urls.length - 1 });
    });

    map[c.num] = { urls: urls, duaRanges: duaRanges };
  });

  return map;
}

var audioByChapter = buildAudioMap(TRACK_COUNT_OVERRIDES);

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
