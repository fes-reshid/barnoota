// --- Ported from src/lib/audio.ts ---
function audioUrl(num) {
  return "https://archive.org/download/peacefulmankind_Hisnul_Muslim/n" + num + ".mp3";
}

var ALIMRAN_AYAH_URLS = Array.from({ length: 11 }, function (_, i) {
  var n = 190 + i;
  return "https://everyayah.com/data/Alafasy_128kbps/003" + n + ".mp3";
});

function isTopicHeader(d) {
  var a = d.arabic.trimStart();
  if (a.startsWith("(") || a.startsWith("«") || a.startsWith('"')) return false;
  return /\d+\s*[ـ\-]+/.test(a);
}

function isAlimranCombinedDua(d) {
  // Diacritic ordering in the source JSON can differ from this literal's
  // combining-mark order (same rendered text); normalize before comparing.
  return d.arabic.normalize("NFC").indexOf("خَلْقِ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ وَٱخْتِلَٰفِ".normalize("NFC")) !== -1;
}

var audioByChapter = (function () {
  var map = {};
  var track = 0;
  CHAPTERS.forEach(function (c) {
    var urls = [];
    var duaRanges = [];
    c.duas.forEach(function (d, i) {
      if (isTopicHeader(d)) {
        duaRanges.push(null);
        return;
      }
      if (isAlimranCombinedDua(d)) {
        var start = urls.length;
        urls.push.apply(urls, ALIMRAN_AYAH_URLS);
        duaRanges.push({ start: start, end: urls.length - 1 });
        return;
      }
      if (c.num === 15 && i === 0) {
        var start2 = urls.length;
        for (var k = 0; k < 5; k++) {
          track += 1;
          urls.push(audioUrl(track));
        }
        duaRanges.push({ start: start2, end: urls.length - 1 });
        return;
      }
      track += 1;
      var start3 = urls.length;
      urls.push(audioUrl(track));
      duaRanges.push({ start: start3, end: urls.length - 1 });
    });
    map[c.num] = { urls: urls, duaRanges: duaRanges };
  });
  return map;
})();

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
