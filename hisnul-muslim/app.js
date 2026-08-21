(function () {
  "use strict";

  // ---------------- Icons (inline SVG, lucide-style) ----------------
  var ICONS = {
    search: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="{fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    bookOpen: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
    circleDot: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    volume2: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.7 6.3 8.4H3a1 1 0 0 0-1 1v5.2a1 1 0 0 0 1 1h3.3L11 19.3a.5.5 0 0 0 .8-.4V5.1a.5.5 0 0 0-.8-.4Z"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>',
    settings: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.7 3.2a2 2 0 0 1 4.6 0l.2.9a2 2 0 0 0 2.6 1.4l.9-.3a2 2 0 0 1 2.3 3.2l-.6.7a2 2 0 0 0 0 2.6l.6.7a2 2 0 0 1-2.3 3.2l-.9-.3a2 2 0 0 0-2.6 1.4l-.2.9a2 2 0 0 1-4.6 0l-.2-.9a2 2 0 0 0-2.6-1.4l-.9.3a2 2 0 0 1-2.3-3.2l.6-.7a2 2 0 0 0 0-2.6l-.6-.7A2 2 0 0 1 6 5.2l.9.3A2 2 0 0 0 9.5 4.1z"/><circle cx="12" cy="12" r="3"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    share2: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 3.9M15.4 6.5 8.6 10.4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    rotate: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    type: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/></svg>',
    download2: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 5-5"/></svg>',
    loader: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>',
    alertCircle: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>',
    bell: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'
  };
  function icon(name, size, extra) {
    var svg = (ICONS[name] || "").replace(/\{s\}/g, size).replace(/\{fill\}/g, (extra && extra.fill) || "none");
    return svg;
  }

  // ---------------- Persisted state ----------------
  var FAV_KEY = "hisn:favorites:v1";
  var FONT_KEY = "hisn:fontscale:v1";
  var THEME_KEY = "hisn:theme:v1";
  var TASBIH_KEY = "hisn:tasbih:v1";

  function readFavorites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function writeFavorites(ids) {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  }
  function toggleFavorite(num) {
    var cur = readFavorites();
    var idx = cur.indexOf(num);
    if (idx === -1) cur.push(num); else cur.splice(idx, 1);
    writeFavorites(cur);
  }
  function isFavorite(num) { return readFavorites().indexOf(num) !== -1; }

  function loadFontScale() {
    var v = parseFloat(localStorage.getItem(FONT_KEY) || "1.15");
    return isFinite(v) ? Math.min(1.8, Math.max(0.8, v)) : 1.15;
  }
  var fontScale = loadFontScale();
  function applyFontScale() {
    document.documentElement.style.setProperty("--reading-scale", String(fontScale));
    localStorage.setItem(FONT_KEY, String(fontScale));
  }
  function incFont() { fontScale = Math.min(1.8, +(fontScale + 0.1).toFixed(2)); applyFontScale(); rerenderFontReadouts(); }
  function decFont() { fontScale = Math.max(0.8, +(fontScale - 0.1).toFixed(2)); applyFontScale(); rerenderFontReadouts(); }
  function resetFont() { fontScale = 1; applyFontScale(); rerenderFontReadouts(); }
  function rerenderFontReadouts() {
    document.querySelectorAll("[data-font-readout]").forEach(function (el) {
      el.textContent = Math.round(fontScale * 100) + "%";
    });
  }

  function loadTheme() {
    var v = localStorage.getItem(THEME_KEY);
    if (v === "dark" || v === "light") return v;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(loadTheme());

  // ---------------- DOM refs ----------------
  var root = document.getElementById("screen-root");
  var topbar = document.getElementById("topbar");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------------- Top bar ----------------
  function renderTopbar() {
    var favCount = readFavorites().length;
    topbar.innerHTML =
      '<a href="#/search" class="glass pill-btn">' + icon("search", 14) + "<span>Barbaadi</span></a>" +
      '<div style="display:flex;align-items:center;gap:0.5rem;">' +
        '<a href="#/favorites" class="glass fav-pill' + (favCount ? " active" : "") + '" aria-label="Filannoo">' + icon("heart", 16, { fill: favCount ? "currentColor" : "none" }) + "</a>" +
        '<div class="glass font-control">' +
          icon("type", 14) +
          '<button data-action="font-dec" aria-label="Xiqqeessi">' + icon("minus", 14) + "</button>" +
          '<span class="readout" data-font-readout>' + Math.round(fontScale * 100) + "%</span>" +
          '<button class="plus-btn" data-action="font-inc" aria-label="Guddisi">' + icon("plus", 14) + "</button>" +
        "</div>" +
      "</div>";
    topbar.querySelector('[data-action="font-dec"]').addEventListener("click", decFont);
    topbar.querySelector('[data-action="font-inc"]').addEventListener("click", incFont);
  }

  // ---------------- Bottom nav ----------------
  var NAV_ITEMS = [
    { to: "#/categories", label: "Zikrii", icon: "bookOpen" },
    { to: "#/tasbih", label: "Tasbiih", icon: "circleDot" },
    { to: "#/sagalee", label: "Sagalee", icon: "volume2" },
    { to: "#/settings", label: "Qindaa'ina", icon: "settings" }
  ];
  function renderBottomNav(activePath) {
    var html = NAV_ITEMS.map(function (item) {
      var active = activePath.indexOf(item.to.slice(1)) === 0;
      return '<li style="display:flex;"><a href="' + item.to + '" class="' + (active ? "active" : "") + '">' +
        icon(item.icon, 20) + "<span>" + item.label + "</span></a></li>";
    }).join("");
    document.getElementById("bottomnav-grid").innerHTML = html;
  }

  // ---------------- Category card ----------------
  function categoryCardHTML(c) {
    return '<a href="#/category/' + c.num + '" class="glass category-card">' +
      '<div class="category-num">' + c.num + "</div>" +
      '<div class="category-text"><h3>' + esc(c.oromoTitle) + '</h3><p class="font-arabic" lang="ar" dir="rtl">' + esc(c.arabicTitle) + "</p></div>" +
      '<div class="category-count">' + c.duas.length + "</div>" +
      '<span class="category-chevron">' + icon("chevronLeft", 16) + "</span>" +
      "</a>";
  }

  // ---------------- Pages ----------------
  function pageCategories() {
    document.title = "Gosoota Zikrii — Hisnul Muslim";
    return (
      '<header class="animate-fade-in">' +
        '<p class="eyebrow">Hundi ' + CHAPTERS.length + "</p>" +
        '<h1 class="page-title">Gosoota <span class="gold-text">Zikrii</span></h1>' +
        '<p class="page-sub">Lakkoofsi tartiiba kitaaba Hisnul Muslim hordofa.</p>' +
      "</header>" +
      '<div class="category-list">' + CHAPTERS.map(categoryCardHTML).join("") + "</div>"
    );
  }

  function pageFavorites() {
    document.title = "Filannoo — Hisnul Muslim";
    var ids = readFavorites();
    var favs = CHAPTERS.filter(function (c) { return ids.indexOf(c.num) !== -1; });
    var body;
    if (!favs.length) {
      body =
        '<div class="glass empty-panel">' +
          '<div class="empty-icon">' + icon("heart", 24) + "</div>" +
          '<p class="title">Hin jiru</p>' +
          '<p class="sub">Gosa fudhachuuf, ♡ tuqi.</p>' +
          '<a href="#/categories" class="cta">Gosoota ilaali</a>' +
        "</div>";
    } else {
      body = '<div class="category-list">' + favs.map(categoryCardHTML).join("") + "</div>";
    }
    return (
      '<header class="animate-fade-in">' +
        '<p class="eyebrow">Bookmarks</p>' +
        '<h1 class="page-title">Filannoo <span class="gold-text">Kee</span></h1>' +
      "</header>" + body
    );
  }

  function pageSearch(initialQuery) {
    document.title = "Barbaadi — Hisnul Muslim";
    setTimeout(function () {
      var input = document.getElementById("search-input");
      if (input) {
        input.focus();
        input.addEventListener("input", function () {
          renderSearchResults(input.value);
          history.replaceState(null, "", "#/search?" + encodeURIComponent(input.value));
        });
        var clearBtn = document.getElementById("search-clear");
        if (clearBtn) clearBtn.addEventListener("click", function () {
          input.value = "";
          renderSearchResults("");
          input.focus();
          history.replaceState(null, "", "#/search");
        });
      }
    }, 0);
    return (
      '<header class="animate-fade-in">' +
        '<p class="eyebrow">Barbaadi</p>' +
        '<h1 class="page-title">Zikrii <span class="gold-text">barbaadi</span></h1>' +
      "</header>" +
      '<div class="glass search-box">' + icon("search", 16) +
        '<input id="search-input" type="text" value="' + esc(initialQuery || "") + '" placeholder="Afaan Oromoo, Arabaa, ykn lakkoofsa…" autocomplete="off">' +
        (initialQuery ? '<button id="search-clear" aria-label="Clear">' + icon("x", 16) + "</button>" : "") +
      "</div>" +
      '<p class="search-count" id="search-count"></p>' +
      '<div class="category-list" id="search-results"></div>'
    );
  }
  function renderSearchResults(q) {
    var results = q ? searchChapters(q) : CHAPTERS;
    document.getElementById("search-count").textContent = results.length + " bu'aa";
    document.getElementById("search-results").innerHTML = results.slice(0, 60).map(categoryCardHTML).join("");
  }

  function isTopicHeaderText(d) {
    var a = d.arabic.trimStart();
    if (a.startsWith("(") || a.startsWith("«") || a.startsWith('"')) return false;
    return /\d+\s*[ـ\-]+/.test(a);
  }

  var chapterAudioState = null; // { chapterNum, urls, idx, playing, loading, current, duration, progress }

  function stopChapterAudio() {
    if (chapterAudioState) chapterAudioState.destroy();
    chapterAudioState = null;
  }

  function pageCategory(num) {
    var chapter = chapterById(num);
    if (!chapter) {
      return '<div class="empty-panel glass"><p class="title">Argamuu baate</p><a class="cta" href="#/categories">Gosoota ilaali</a></div>';
    }
    document.title = chapter.oromoTitle + " — Hisnul Muslim";
    var idx = CHAPTERS.findIndex(function (c) { return c.num === chapter.num; });
    var prev = CHAPTERS[idx - 1];
    var next = CHAPTERS[idx + 1];
    var fav = isFavorite(chapter.num);

    var n = 0;
    var duaHTML = chapter.duas.map(function (d, i) {
      if (isTopicHeaderText(d)) {
        var cleanAr = d.arabic.replace(/^\s*\d+\.?\s*/, "");
        return '<div class="topic-header animate-fade-in">' +
          '<p class="eyebrow">Mata-duree</p>' +
          '<p class="om">' + esc(d.oromo) + '</p>' +
          '<p class="ar font-arabic" lang="ar" dir="rtl">' + esc(cleanAr) + "</p>" +
        "</div>";
      }
      n += 1;
      return duaCardHTML(chapter, d, n, i);
    }).join("");

    setTimeout(function () { bindCategoryPageEvents(chapter); }, 0);

    return (
      '<header class="animate-fade-in">' +
        '<a href="#/categories" class="back-link">' + icon("chevronRight", 14) + " Gosoota</a>" +
        '<div class="chapter-header-row">' +
          '<div style="min-width:0;">' +
            '<p class="chapter-id">#' + String(chapter.num).padStart(3, "0") + "</p>" +
            '<h1 class="chapter-title-om">' + esc(chapter.oromoTitle) + "</h1>" +
            '<p class="chapter-title-ar font-arabic" lang="ar" dir="rtl">' + esc(chapter.arabicTitle) + "</p>" +
          "</div>" +
          '<button class="glass heart-btn' + (fav ? " active" : "") + '" data-action="toggle-fav" data-num="' + chapter.num + '" aria-label="Bookmark">' +
            icon("heart", 20, { fill: fav ? "currentColor" : "none" }) +
          "</button>" +
        "</div>" +
      "</header>" +
      '<section class="dua-section">' + duaHTML + "</section>" +
      '<nav class="chapter-nav">' +
        (prev ? '<a href="#/category/' + prev.num + '" class="glass"><span class="ico">' + icon("chevronRight", 16) + '</span><span class="t">' + esc(prev.oromoTitle) + "</span></a>" : "<span></span>") +
        (next ? '<a href="#/category/' + next.num + '" class="glass next"><span class="t">' + esc(next.oromoTitle) + '</span><span class="ico rot">' + icon("chevronRight", 16) + "</span></a>" : "") +
      "</nav>"
    );
  }

  function duaCardHTML(chapter, d, n, i) {
    return (
      '<article class="glass dua-card animate-fade-in" data-dua-idx="' + i + '">' +
        '<div class="dua-card-top">' +
          '<div class="dua-idx">' + n + "</div>" +
          '<div class="dua-actions">' +
            '<button class="play-btn" data-action="play-dua" data-idx="' + i + '" aria-label="Sagalee dhageeffadhu">' + icon("play", 14) + "</button>" +
            '<button class="dl-btn" data-action="download-dua" aria-label="Bilbila kee irratti ol kaa\'i">' + icon("download2", 16) + "</button>" +
            '<button data-action="share" data-arabic="' + esc(d.arabic) + '" data-oromo="' + esc(d.oromo) + '" data-title="' + esc(chapter.oromoTitle) + '" aria-label="Share">' + icon("share2", 16) + "</button>" +
          "</div>" +
        "</div>" +
        '<div class="seek-wrap" hidden></div>' +
        '<p class="audio-error" hidden></p>' +
        '<p class="dua-arabic font-arabic" lang="ar" dir="rtl">' + esc(d.arabic) + "</p>" +
        (d.oromo ? '<p class="dua-oromo">' + esc(d.oromo) + "</p>" : "") +
        '<div class="counter-row">' +
          '<span class="counter-label">Lakkooftuu</span>' +
          '<div class="counter-controls">' +
            '<button class="counter-reset" data-action="counter-reset" aria-label="Reset">' + icon("rotate", 14) + "</button>" +
            '<button class="counter-minus" data-action="counter-minus" aria-label="-">' + icon("minus", 16) + "</button>" +
            '<span class="counter-value">0</span>' +
            '<button class="counter-plus" data-action="counter-plus" aria-label="+">' + icon("plus", 16) + "</button>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function bindCategoryPageEvents(chapter) {
    var favBtn = document.querySelector('[data-action="toggle-fav"]');
    if (favBtn) favBtn.addEventListener("click", function () {
      toggleFavorite(chapter.num);
      renderTopbar();
      navigate(location.hash, true);
    });

    document.querySelectorAll(".dua-card").forEach(function (card) {
      var counterVal = card.querySelector(".counter-value");
      var count = 0;
      card.querySelector('[data-action="counter-reset"]').addEventListener("click", function () { count = 0; counterVal.textContent = count; });
      card.querySelector('[data-action="counter-minus"]').addEventListener("click", function () { count = Math.max(0, count - 1); counterVal.textContent = count; });
      card.querySelector('[data-action="counter-plus"]').addEventListener("click", function () { count += 1; counterVal.textContent = count; });

      card.querySelector('[data-action="share"]').addEventListener("click", function (e) {
        var btn = e.currentTarget;
        shareText(btn.getAttribute("data-title"), btn.getAttribute("data-arabic") + "\n\n" + btn.getAttribute("data-oromo") + "\n\n— Hisnul Muslim");
      });

      var duaIdx = parseInt(card.getAttribute("data-dua-idx"), 10);
      var duaRange = rangeForDua(chapter.num, duaIdx);
      var duaUrls = duaRange ? urlsForChapter(chapter.num).slice(duaRange.start, duaRange.end + 1) : [];
      bindDownloadButton(card.querySelector('[data-action="download-dua"]'), duaUrls);
    });

    var urls = urlsForChapter(chapter.num);
    chapterAudioState = createAudioController(urls, function (state) {
      updateDuaPlayUI(chapter, state);
    });

    document.querySelectorAll('[data-action="play-dua"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var duaIdx = parseInt(btn.getAttribute("data-idx"), 10);
        var range = rangeForDua(chapter.num, duaIdx) || { start: 0, end: 0 };
        var st = chapterAudioState;
        var inRange = st.idx >= range.start && st.idx <= range.end;
        if (st.playing && inRange) {
          st.pause();
        } else {
          st.play(range.start);
        }
      });
    });
  }

  function updateDuaPlayUI(chapter, st) {
    document.querySelectorAll(".dua-card").forEach(function (card) {
      var i = parseInt(card.getAttribute("data-dua-idx"), 10);
      var range = rangeForDua(chapter.num, i) || { start: -1, end: -1 };
      var inRange = st.idx >= range.start && st.idx <= range.end && range.start !== -1;
      var playing = st.playing && inRange;
      var loading = st.loading && inRange;
      var btn = card.querySelector('[data-action="play-dua"]');
      btn.classList.toggle("playing", playing);
      btn.innerHTML = loading ? icon("volume2", 14) : playing ? icon("pause", 14) : icon("play", 14);
      card.classList.toggle("playing", playing);
      var seekWrap = card.querySelector(".seek-wrap");
      if (playing || loading) {
        seekWrap.hidden = false;
        seekWrap.innerHTML =
          '<input type="range" min="0" max="' + (st.duration || 0) + '" step="0.1" value="' + st.current + '" ' +
          'style="background:linear-gradient(to right, var(--gold) ' + st.progress + '%, color-mix(in oklab, var(--primary) 20%, transparent) ' + st.progress + '%)">' +
          '<div class="seek-times"><span>' + fmtTime(st.current) + "</span><span>" + fmtTime(st.duration) + "</span></div>";
        var range_input = seekWrap.querySelector("input");
        range_input.addEventListener("input", function () { chapterAudioState.seek(parseFloat(range_input.value)); });
      } else {
        seekWrap.hidden = true;
        seekWrap.innerHTML = "";
      }
      var errEl = card.querySelector(".audio-error");
      if (st.error && inRange) {
        errEl.hidden = false;
        errEl.textContent = "Sagaleen argamuu dadhabe — interneeta kee mirkaneessi, ykn gadi buusii kaa'i (⬇) yeroo booda dhaggeeffachuuf.";
      } else {
        errEl.hidden = true;
      }
    });
  }

  // ---------------- Generic HTMLAudio sequential-queue controller ----------------
  // Only one audio controller (chapter view, sagalee view, whichever) may be
  // playing anywhere in the app at once. Every controller checks in here
  // before starting playback, so starting one always stops any other.
  var activeAudioController = null;

  function createAudioController(urls, onUpdate) {
    var audioEl = new Audio();
    audioEl.preload = "auto";
    // Deliberately no crossOrigin="anonymous": these hosts aren't guaranteed
    // to send CORS headers, plain playback doesn't need them, and forcing
    // CORS mode would make the browser refuse the opaque (no-cors) responses
    // stored by the offline-download feature below.
    var preloadEl = new Audio();
    preloadEl.preload = "auto";
    preloadEl.muted = true;

    var state = { urls: urls, idx: 0, playing: false, loading: false, current: 0, duration: 0, progress: 0, repeat: false, advancing: false, error: false, destroyed: false };

    // emit()/preloadNext()/advance() all short-circuit once destroyed, so a
    // torn-down controller can't resurrect itself: clearing audioEl.src in
    // destroy() below fires a real "error" event on the old element, which
    // would otherwise be treated as "this track failed, try the next one"
    // and keep it silently playing/fetching in the background forever.
    function emit() { if (state.destroyed) return; onUpdate(state); }

    function preloadNext() {
      if (state.destroyed) return;
      var nextIdx = state.idx + 1;
      var nextUrl = nextIdx < state.urls.length ? state.urls[nextIdx] : (state.repeat ? state.urls[0] : null);
      if (!nextUrl) { preloadEl.removeAttribute("src"); return; }
      if (preloadEl.src !== nextUrl) { preloadEl.src = nextUrl; try { preloadEl.load(); } catch (e) {} }
    }

    function advance() {
      if (state.destroyed || state.advancing) return;
      var atEnd = state.idx >= state.urls.length - 1;
      if (atEnd && !state.repeat) {
        state.playing = false; state.current = 0; state.duration = 0; state.progress = 0;
        emit();
        return;
      }
      state.advancing = true;
      state.idx = atEnd ? 0 : state.idx + 1;
      audioEl.src = state.urls[state.idx];
      state.current = 0; state.duration = 0; state.progress = 0;
      try { audioEl.load(); } catch (e) {}
      audioEl.play().catch(function () { state.playing = false; state.loading = false; state.error = true; emit(); }).finally(function () {
        state.advancing = false;
        preloadNext();
      });
    }

    audioEl.addEventListener("ended", advance);
    audioEl.addEventListener("error", function () {
      // A track genuinely failed (bad URL, offline, blocked, etc). Try the
      // next track in the queue so one bad file doesn't stall a whole du'a;
      // only surface a hard error once there's nowhere left to go.
      var hasNext = state.idx < state.urls.length - 1 || state.repeat;
      if (hasNext) { advance(); }
      else { state.playing = false; state.loading = false; state.error = true; emit(); }
    });
    audioEl.addEventListener("playing", function () { state.loading = false; state.playing = true; emit(); });
    audioEl.addEventListener("pause", function () { state.playing = false; emit(); });
    audioEl.addEventListener("loadedmetadata", function () { state.duration = audioEl.duration || 0; emit(); });
    audioEl.addEventListener("timeupdate", function () {
      state.current = audioEl.currentTime;
      if (audioEl.duration > 0) state.progress = (audioEl.currentTime / audioEl.duration) * 100;
      if (audioEl.duration > 0 && audioEl.currentTime >= audioEl.duration - 0.35 && !audioEl.seeking && !state.advancing) advance();
      emit();
    });

    state.play = function (fromIdx) {
      if (!state.urls.length) return;
      if (activeAudioController && activeAudioController !== state) {
        activeAudioController.pause();
      }
      activeAudioController = state;
      state.idx = fromIdx || 0;
      audioEl.src = state.urls[state.idx];
      state.loading = true; state.error = false; state.current = 0; state.duration = 0; state.progress = 0;
      emit();
      try { audioEl.load(); } catch (e) {}
      audioEl.play().then(function () { preloadNext(); }).catch(function () { state.loading = false; state.error = true; emit(); });
    };
    state.pause = function () { audioEl.pause(); };
    state.seek = function (t) { if (isFinite(t)) { audioEl.currentTime = t; state.current = t; emit(); } };
    state.destroy = function () {
      state.destroyed = true;
      audioEl.pause();
      audioEl.removeAttribute("src");
      try { audioEl.load(); } catch (e) {}
      if (activeAudioController === state) activeAudioController = null;
    };

    return state;
  }

  // ---------------- Offline audio download ----------------
  function setDownloadBtnState(btn, s) {
    btn.setAttribute("data-dl-state", s);
    btn.classList.toggle("spinning", s === "downloading" || s === "checking");
    if (s === "downloading" || s === "checking") btn.innerHTML = icon("loader", 16);
    else if (s === "done") btn.innerHTML = icon("checkCircle", 16);
    else if (s === "error") btn.innerHTML = icon("alertCircle", 16);
    else btn.innerHTML = icon("download2", 16);
  }

  function bindDownloadButton(btn, urls) {
    if (!btn) return;
    if (!AudioCacheAPI.supported() || !urls || !urls.length) { btn.style.display = "none"; return; }

    setDownloadBtnState(btn, "checking");
    AudioCacheAPI.areAllCached(urls).then(function (all) {
      setDownloadBtnState(btn, all ? "done" : "idle");
    });

    btn.addEventListener("click", async function () {
      var cur = btn.getAttribute("data-dl-state");
      if (cur === "downloading" || cur === "checking") return;

      if (cur === "done") {
        var wantsRemove = confirm("Sagalee kana bilbila kee irraa haquu barbaaddaa?");
        if (wantsRemove) {
          await AudioCacheAPI.remove(urls);
          setDownloadBtnState(btn, "idle");
        }
        return;
      }

      var wantsDownload = confirm(
        "Sagalee kana (" + urls.length + (urls.length === 1 ? " faayilii" : " faayiloota") + ") " +
        "bilbila kee irratti ol kaa'uu barbaaddaa? Kunis booda interneeta malee dhaggeeffachuu si dandeessisa."
      );
      if (!wantsDownload) return;

      setDownloadBtnState(btn, "downloading");
      try {
        var result = await AudioCacheAPI.download(urls);
        setDownloadBtnState(btn, result.failed.length ? "error" : "done");
      } catch (e) {
        setDownloadBtnState(btn, "error");
      }
    });
  }

  function shareText(title, text) {
    if (navigator.share) {
      navigator.share({ title: title, text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  }

  // ---------------- Tasbih ----------------
  var TASBIH_PRESETS = [
    { label: "SubḥānAllāh", arabic: "سُبْحَانَ اللَّهِ", target: 33 },
    { label: "Alḥamdulillāh", arabic: "الحَمْدُ لِلَّهِ", target: 33 },
    { label: "Allāhu akbar", arabic: "اللَّهُ أَكْبَرُ", target: 34 },
    { label: "Lā ilāha illā Allāh", arabic: "لَا إِلَهَ إِلَّا اللَّهُ", target: 100 },
    { label: "Astaghfirullāh", arabic: "أَسْتَغْفِرُ اللَّهَ", target: 100 },
    { label: "Ṣall Allāhu ʿalā Muḥammad", arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", target: 100 }
  ];

  function pageTasbih() {
    document.title = "Tasbiih — Hisnul Muslim";
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(TASBIH_KEY) || "{}"); } catch (e) {}
    var presetIdx = saved.presetIdx || 0;
    var count = saved.count || 0;

    setTimeout(function () { bindTasbihEvents(presetIdx, count); }, 0);

    var chips = TASBIH_PRESETS.map(function (p, i) {
      return '<button class="preset-chip glass' + (i === presetIdx ? " active" : "") + '" data-preset-idx="' + i + '">' + esc(p.label) + "</button>";
    }).join("");

    return (
      '<header class="animate-fade-in">' +
        '<p class="eyebrow">Tasbiih</p>' +
        '<h1 class="page-title">Lakkooftuu <span class="gold-text">Zikrii</span></h1>' +
      "</header>" +
      '<div class="preset-row">' + chips + "</div>" +
      '<section class="glass tasbih-panel" id="tasbih-panel"></section>'
    );
  }

  function renderTasbihPanel(presetIdx, count) {
    var preset = TASBIH_PRESETS[presetIdx];
    var progress = Math.min(100, (count / preset.target) * 100);
    var round = Math.floor(count / preset.target);
    var inRound = count % preset.target;
    var circumference = 276.46;
    var panel = document.getElementById("tasbih-panel");
    panel.innerHTML =
      '<p class="tasbih-arabic font-arabic" lang="ar" dir="rtl">' + esc(preset.arabic) + "</p>" +
      '<p class="tasbih-progress-label">' + (round > 0 ? "Cikkii " + round + " • " : "") + inRound + " / " + preset.target + "</p>" +
      '<div class="tasbih-ring-wrap">' +
        '<svg viewBox="0 0 100 100">' +
          '<circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" stroke-width="6"/>' +
          '<circle cx="50" cy="50" r="44" fill="none" stroke="url(#tg)" stroke-width="6" stroke-linecap="round" ' +
            'stroke-dasharray="' + ((progress / 100) * circumference) + " " + circumference + '"/>' +
          '<defs><linearGradient id="tg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="var(--gold)"/><stop offset="100%" stop-color="var(--primary-glow)"/></linearGradient></defs>' +
        "</svg>" +
        '<button class="tasbih-tap-btn" id="tasbih-tap">' +
          '<span class="tasbih-count">' + count + "</span>" +
          '<span class="tasbih-tap-label">Tuqi</span>' +
        "</button>" +
      "</div>" +
      '<button class="tasbih-reset" id="tasbih-reset">' + icon("rotate", 14) + " Irra deebi'i</button>";

    document.getElementById("tasbih-tap").addEventListener("click", function () { tasbihTap(presetIdx, count, function (c) { count = c; renderTasbihPanel(presetIdx, count); }); });
    document.getElementById("tasbih-reset").addEventListener("click", function () { count = 0; saveTasbih(presetIdx, count); renderTasbihPanel(presetIdx, count); });
  }

  function saveTasbih(presetIdx, count) {
    try { localStorage.setItem(TASBIH_KEY, JSON.stringify({ presetIdx: presetIdx, count: count })); } catch (e) {}
  }

  function playChime() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      var ctx = new Ctx();
      var now = ctx.currentTime;
      [{ f: 880, t: 0 }, { f: 1318.5, t: 0.18 }].forEach(function (tone) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = tone.f;
        g.gain.setValueAtTime(0.0001, now + tone.t);
        g.gain.exponentialRampToValueAtTime(0.35, now + tone.t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + tone.t + 0.9);
        o.connect(g).connect(ctx.destination);
        o.start(now + tone.t);
        o.stop(now + tone.t + 0.95);
      });
      setTimeout(function () { ctx.close(); }, 1200);
    } catch (e) {}
  }

  function tasbihTap(presetIdx, count, setCount) {
    var preset = TASBIH_PRESETS[presetIdx];
    if (count >= preset.target) return;
    var next = count + 1;
    saveTasbih(presetIdx, next);
    var canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
    if (next === preset.target) {
      if (canVibrate) navigator.vibrate([60, 50, 60, 50, 200]);
      playChime();
    } else if (canVibrate) {
      navigator.vibrate(12);
    }
    setCount(next);
  }

  function bindTasbihEvents(presetIdx, count) {
    renderTasbihPanel(presetIdx, count);
    document.querySelectorAll(".preset-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var i = parseInt(chip.getAttribute("data-preset-idx"), 10);
        document.querySelectorAll(".preset-chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        saveTasbih(i, 0);
        renderTasbihPanel(i, 0);
      });
    });
  }

  // ---------------- Sagalee (audio library) ----------------
  var sagaleeState = null;
  function pageSagalee() {
    document.title = "Sagalee — Hisnul Muslim";
    setTimeout(bindSagaleeEvents, 0);
    var items = CHAPTERS.map(function (c) {
      return (
        '<li class="glass sagalee-item animate-fade-in" data-chapter="' + c.num + '">' +
          '<div class="sagalee-row">' +
            '<button type="button" class="sagalee-play" data-action="sagalee-toggle" data-num="' + c.num + '" aria-label="Taphachiisi">' + icon("play", 20) + "</button>" +
            '<span class="sagalee-text"><span class="om">' + esc(c.oromoTitle) + '</span><span class="ar font-arabic" lang="ar" dir="rtl">' + esc(c.arabicTitle) + "</span></span>" +
            '<button class="dl-btn" data-action="download-chapter" data-num="' + c.num + '" aria-label="Bilbila kee irratti ol kaa\'i"></button>' +
            '<span class="sagalee-num">#' + String(c.num).padStart(3, "0") + "</span>" +
          "</div>" +
          '<div class="seek-wrap" hidden></div>' +
          '<p class="audio-error" hidden></p>' +
        "</li>"
      );
    }).join("");
    return (
      '<header class="animate-fade-in">' +
        '<p class="eyebrow">Audio</p>' +
        '<div class="sagalee-header-row">' +
          '<h1 class="page-title" style="margin:0;"><span class="gold-text">Sagalee</span> Du\'aa</h1>' +
          '<button class="glass repeat-toggle" id="sagalee-repeat">' + icon("repeat", 14) + "<span>Irra deebi'i</span></button>" +
        "</div>" +
        '<p class="page-sub">Sagalee du\'aa dhaggeeffadhu. Tuqi ▶︎ jalqabuuf.</p>' +
      "</header>" +
      '<ul class="sagalee-list">' + items + "</ul>"
    );
  }
  function bindSagaleeEvents() {
    var repeatOn = false;
    var repeatBtn = document.getElementById("sagalee-repeat");
    repeatBtn.addEventListener("click", function () {
      repeatOn = !repeatOn;
      repeatBtn.classList.toggle("active", repeatOn);
      if (sagaleeState) sagaleeState.repeat = repeatOn;
    });

    document.querySelectorAll('[data-action="sagalee-toggle"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var num = parseInt(btn.getAttribute("data-num"), 10);
        if (sagaleeState && sagaleeState.currentChapter === num) {
          sagaleeState.pause();
          return;
        }
        if (sagaleeState) sagaleeState.destroy();
        var urls = urlsForChapter(num);
        sagaleeState = createAudioController(urls, function (st) { updateSagaleeUI(num, st); });
        sagaleeState.currentChapter = num;
        sagaleeState.repeat = repeatOn;
        sagaleeState.play(0);
      });
    });

    document.querySelectorAll('[data-action="download-chapter"]').forEach(function (btn) {
      var num = parseInt(btn.getAttribute("data-num"), 10);
      bindDownloadButton(btn, urlsForChapter(num));
    });
  }
  function updateSagaleeUI(num, st) {
    document.querySelectorAll(".sagalee-item").forEach(function (li) {
      var liNum = parseInt(li.getAttribute("data-chapter"), 10);
      var isThis = liNum === num;
      var playBtn = li.querySelector(".sagalee-play");
      var seekWrap = li.querySelector(".seek-wrap");
      var errEl = li.querySelector(".audio-error");
      if (!isThis) {
        playBtn.innerHTML = icon("play", 20);
        seekWrap.hidden = true; seekWrap.innerHTML = "";
        errEl.hidden = true;
        return;
      }
      var playing = st.playing;
      var loading = st.loading;
      playBtn.innerHTML = loading ? icon("volume2", 20) : playing ? icon("pause", 20) : icon("play", 20);
      if (playing || loading) {
        seekWrap.hidden = false;
        seekWrap.innerHTML =
          '<input type="range" min="0" max="' + (st.duration || 0) + '" step="0.1" value="' + st.current + '" ' +
          'style="background:linear-gradient(to right, var(--gold) ' + st.progress + '%, color-mix(in oklab, var(--primary) 20%, transparent) ' + st.progress + '%)">' +
          '<div class="seek-times"><span>' + fmtTime(st.current) + "</span><span>" +
            (st.urls.length > 1 ? (st.idx + 1) + "/" + st.urls.length + " · " : "") + fmtTime(st.duration) + "</span></div>";
        var input = seekWrap.querySelector("input");
        input.addEventListener("input", function () { sagaleeState.seek(parseFloat(input.value)); });
      } else {
        seekWrap.hidden = true; seekWrap.innerHTML = "";
      }
      errEl.hidden = !st.error;
      if (st.error) errEl.textContent = "Sagaleen argamuu dadhabe — interneeta kee mirkaneessi, ykn gadi buusii kaa'i (⬇) yeroo booda dhaggeeffachuuf.";
    });
  }

  // ---------------- Settings ----------------
  function fmtClock(d) {
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function reminderStatusText() {
    if (!window.RemindersAPI || !RemindersAPI.isEnabled()) return "Yaadachiisni zikrii cufaadha.";
    var t = RemindersAPI.todaysTimes();
    if (!t) return "Yaadachiisni banaadha.";
    return "Banaadha — har'a Faajrii " + fmtClock(t.fajr) + ", Maghrib " + fmtClock(t.maghrib) + ".";
  }
  function reminderErrorText(reason) {
    switch (reason) {
      case "geo-denied": return "Eeyyama bakka argamuu hin arganne. Qindaa'ina browser/appii keessatti bakka argamuu (location) eeyyamaaf.";
      case "geo-unsupported": return "Bilbilli ykn browserichi kun bakka argamuu hin deeggaru.";
      case "notif-denied": return "Eeyyama beeksisaa hin argamne. Qindaa'ina browser/appii keessatti beeksisa (notification) appii kanaaf eeyyamaa.";
      case "notif-unsupported": return "Browserichi kun beeksisa hin deeggaru.";
      default: return "Wanti tokko dogongore. Irra deebi'aa yaalaa.";
    }
  }
  function pageSettings() {
    document.title = "Qindaa'ina — Hisnul Muslim";
    var theme = loadTheme();
    var reminderOn = window.RemindersAPI && RemindersAPI.isEnabled();
    setTimeout(function () { bindSettingsEvents(theme); }, 0);
    return (
      '<header class="animate-fade-in">' +
        '<p class="eyebrow">Qindaa\'ina</p>' +
        '<h1 class="page-title">App <span class="gold-text">qindeessi</span></h1>' +
      "</header>" +

      '<section class="glass settings-section">' +
        '<div class="settings-section-head">' + icon(theme === "dark" ? "moon" : "sun", 16) + "<span>Halluu (Theme)</span></div>" +
        '<div class="theme-toggle-grid">' +
          '<button data-theme-btn="light" class="' + (theme === "light" ? "active" : "") + '">' + icon("sun", 16) + " Ifaa</button>" +
          '<button data-theme-btn="dark" class="' + (theme === "dark" ? "active" : "") + '">' + icon("moon", 16) + " Dukkanaa'aa</button>" +
        "</div>" +
      "</section>" +

      '<section class="glass settings-section">' +
        '<div class="settings-section-head">' + icon("type", 16) + "<span>Guddina bocaa</span></div>" +
        '<div class="font-row">' +
          '<button data-action="settings-font-dec">−</button>' +
          '<span class="val" data-font-readout>' + Math.round(fontScale * 100) + "%</span>" +
          '<button class="plus" data-action="settings-font-inc">+</button>' +
        "</div>" +
        '<button class="font-reset" data-action="settings-font-reset">Deebisi gara 100%</button>' +
      "</section>" +

      '<section class="glass settings-section">' +
        '<div class="settings-section-head">' + icon("info", 16) + "<span>Waa'ee Appii</span></div>" +
        '<div class="about-body">' +
          "<p>Appiin kun <span class=\"gold-text\" style=\"font-weight:600;\">Hisnul Muslim</span> — kitaaba zikriifi du'aa'ii Musliimaa, Afaan Oromootiin akka salphaatti dubbifamuufi dhaggeeffatamu kan qopha'e dha.</p>" +
          '<p>Kitaabni <a href="https://islamhouse.com" target="_blank" rel="noreferrer" class="link">islamhouse.com</a> irraahi.</p>' +
          '<p>Audio immoo <a href="https://archive.org" target="_blank" rel="noreferrer" class="link">archive.org</a> irraahi.</p>' +
          '<p>Hojii fi qopheessuun appichaa <strong>Feysel Mustefa</strong> tiin gaggeeffame. Akka aakhiraatti hojii gaarii naa galmeessu, namni fayyadame <strong>du\'aa\'ii</strong> naaf akka godhu kabajaan gaafadha.</p>' +
          '<p style="color:var(--muted-foreground);">Yaada, dogoggora, ykn fooyya\'iinsaaf:</p>' +
          '<a class="mail-btn" href="mailto:fes900@yahoo.com?subject=Hisnul%20Muslim%20App%20Feedback">' + icon("mail", 16) + " fes900@yahoo.com</a>" +
          '<p style="margin-top:0.5rem;"><a href="privacy.html" target="_blank" rel="noreferrer" class="link">Imaammata Iccitii (Privacy Policy)</a></p>' +
        "</div>" +
      "</section>" +

      '<section class="glass settings-section">' +
        '<div class="settings-section-head">' + icon("bell", 16) + "<span>Yaadachiisa Zikrii</span></div>" +
        '<p class="page-sub" style="margin-top:0.5rem;">Bakka bilbilli keessan jiru irratti hundaa\'uudhaan, yeroo Faajrii (zikrii ganamaa) fi Maghrib (zikrii galgalaa) ga\'utti beeksisa siif erga.</p>' +
        '<button class="font-reset" id="settings-reminder-toggle" data-on="' + (reminderOn ? "1" : "0") + '" style="margin-top:0.75rem;">' +
          (reminderOn ? "Yaadachiisa dhaamsi" : "Yaadachiisa banii") +
        "</button>" +
        '<p class="reminder-status" id="settings-reminder-status" style="margin-top:0.5rem;color:var(--muted-foreground);font-size:0.85rem;">' + esc(reminderStatusText()) + "</p>" +
      "</section>" +

      '<section class="glass settings-section">' +
        '<div class="settings-section-head">' + icon("download2", 16) + "<span>Sagalee ol kaa\'ame</span></div>" +
        '<p class="page-sub" style="margin-top:0.5rem;">Du\'aa\'ii ⬇ tuqxee ol kaayye interneeta malees ni dhaggeeffatama.</p>' +
        '<button class="font-reset" id="settings-clear-audio" style="margin-top:0.75rem;">Sagalee ol kaa\'ame hunda haqi</button>' +
      "</section>" +

      '<section class="glass settings-section">' +
        '<div class="settings-section-head">' + icon("heart", 16) + "<span>Appii biroo / Qoodi</span></div>" +
        '<div class="share-grid">' +
          '<button id="settings-share">' + icon("share2", 16) + " Hiriyyootatti qoodi</button>" +
          '<a href="mailto:fes900@yahoo.com?subject=App%20Suggestion">Appii biroo gaafadhu</a>' +
        "</div>" +
        '<p class="copyright">© ' + new Date().getFullYear() + " — Feysel Mustefa</p>" +
      "</section>"
    );
  }
  function bindSettingsEvents(theme) {
    document.querySelectorAll("[data-theme-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = btn.getAttribute("data-theme-btn");
        applyTheme(t);
        navigate(location.hash, true);
      });
    });
    var dec = document.querySelector('[data-action="settings-font-dec"]');
    var inc = document.querySelector('[data-action="settings-font-inc"]');
    var reset = document.querySelector('[data-action="settings-font-reset"]');
    if (dec) dec.addEventListener("click", decFont);
    if (inc) inc.addEventListener("click", incFont);
    if (reset) reset.addEventListener("click", resetFont);
    var shareBtn = document.getElementById("settings-share");
    if (shareBtn) shareBtn.addEventListener("click", function () {
      var url = window.location.origin + window.location.pathname;
      if (navigator.share) {
        navigator.share({ title: "Hisnul Muslim", text: "Zikriifi du'aa'ii Musliimaa Afaan Oromootiin.", url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(function () {});
      }
    });
    var clearAudioBtn = document.getElementById("settings-clear-audio");
    if (clearAudioBtn) clearAudioBtn.addEventListener("click", async function () {
      if (!confirm("Sagalee bilbila kee irratti ol kaa'ame hunda haquu barbaaddaa?")) return;
      await AudioCacheAPI.clearAll();
      alert("Sagaleen ol kaa'ame haqameera.");
    });

    var remBtn = document.getElementById("settings-reminder-toggle");
    if (remBtn && window.RemindersAPI) remBtn.addEventListener("click", async function () {
      var status = document.getElementById("settings-reminder-status");
      if (remBtn.getAttribute("data-on") === "1") {
        RemindersAPI.disable();
        navigate(location.hash, true);
        return;
      }
      remBtn.disabled = true;
      var res = await RemindersAPI.enable();
      remBtn.disabled = false;
      if (res.ok) {
        navigate(location.hash, true);
      } else if (status) {
        status.textContent = reminderErrorText(res.reason);
      }
    });
  }

  // ---------------- Router ----------------
  function parseHash() {
    var hash = location.hash.replace(/^#/, "") || "/categories";
    var qIdx = hash.indexOf("?");
    var query = "";
    if (qIdx !== -1) { query = decodeURIComponent(hash.slice(qIdx + 1)); hash = hash.slice(0, qIdx); }
    var parts = hash.split("/").filter(Boolean);
    return { parts: parts, query: query, hash: hash };
  }

  function navigate() {
    stopChapterAudio();
    if (sagaleeState) { sagaleeState.destroy(); sagaleeState = null; }
    var r = parseHash();
    var html = "";
    if (r.parts[0] === "categories" || r.parts.length === 0) html = pageCategories();
    else if (r.parts[0] === "favorites") html = pageFavorites();
    else if (r.parts[0] === "search") html = pageSearch(r.query);
    else if (r.parts[0] === "tasbih") html = pageTasbih();
    else if (r.parts[0] === "sagalee") html = pageSagalee();
    else if (r.parts[0] === "settings") html = pageSettings();
    else if (r.parts[0] === "category" && r.parts[1]) html = pageCategory(parseInt(r.parts[1], 10));
    else html = pageCategories();

    root.innerHTML = html;
    if (r.parts[0] === "search") setTimeout(function () { renderSearchResults(r.query || ""); }, 0);
    renderTopbar();
    renderBottomNav(r.hash);
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", navigate);

  // ---------------- Install prompt ----------------
  (function initInstallPrompt() {
    var DISMISS_KEY = "hisn:install:dismissed";
    function isStandalone() {
      return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
    }
    if (isStandalone()) return;
    try { if (localStorage.getItem(DISMISS_KEY)) return; } catch (e) {}

    var platform = "other";
    var ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) platform = "ios";
    else if (/Android/i.test(ua)) platform = "android";

    var deferred = null;
    var container = document.getElementById("install-prompt");

    function show() {
      var body;
      if (platform === "ios") {
        body = 'Safari keessatti Share tuqaa, ergasii <strong>"Add to Home Screen"</strong> filadhaa.';
      } else if (platform === "android" && deferred) {
        body = "Yaadachiisni sirritti akka hojjetu, akka appii dhugaatti dabaladhaa.";
      } else {
        body = 'Browser kee keessatti "Install app" ykn "Add to Home Screen" filadhaa.';
      }
      container.innerHTML =
        '<div class="glass install-card animate-fade-in">' +
          '<div class="install-icon">' + icon("download", 20) + "</div>" +
          '<div class="install-text"><p class="title">Appii kana <span class="gold-text">bilbila keessanitti</span> dabalaa</p><p class="sub">' + body + "</p></div>" +
          '<button class="install-close" id="install-close">' + icon("x", 16) + "</button>" +
        "</div>";
      container.hidden = false;
      document.getElementById("install-close").addEventListener("click", dismiss);
      if (platform === "android" && deferred) {
        var cta = document.createElement("button");
        cta.textContent = "Dabaladhu";
        cta.style.cssText = "margin-top:0.75rem;width:100%;border-radius:1rem;padding:0.6rem;font-weight:600;color:var(--primary-foreground);background:var(--gradient-primary);box-shadow:var(--shadow-elegant);";
        container.querySelector(".install-text").appendChild(cta);
        cta.addEventListener("click", async function () {
          if (!deferred) return;
          deferred.prompt();
          var choice = await deferred.userChoice;
          if (choice.outcome === "accepted") dismiss(); else hide();
          deferred = null;
        });
      }
    }
    function hide() { container.hidden = true; container.innerHTML = ""; }
    function dismiss() { try { localStorage.setItem(DISMISS_KEY, "1"); } catch (e) {} hide(); }

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
      show();
    });
    if (platform === "ios") {
      var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
      if (isSafari) setTimeout(show, 1200);
    }
  })();

  // ---------------- Init ----------------
  applyFontScale();
  navigate();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
    navigator.serviceWorker.addEventListener("message", function (event) {
      if (event.data && event.data.type === "navigate" && event.data.hash) {
        location.hash = event.data.hash;
      }
    });
  }
})();
