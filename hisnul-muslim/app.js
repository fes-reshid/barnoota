(function () {
  "use strict";

  // ---------------- Icons (inline SVG, lucide-style) ----------------
  var ICONS = {
    search: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="{fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    bookOpen: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/></svg>',
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
    bell: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    ayahEnd: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="currentColor"><path d="M12 2l2.4 5.2L20 9l-4.8 3.4L17 18l-5-3.3L7 18l1.8-5.6L4 9l5.6-1.8z"/></svg>',
    skipNext: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="currentColor"><path d="M6 5v14l10-7z"/><rect x="17" y="5" width="2.5" height="14" rx="0.5"/></svg>',
    skipPrev: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="currentColor"><path d="M18 5v14L8 12z"/><rect x="4.5" y="5" width="2.5" height="14" rx="0.5"/></svg>',
    sunrise: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v7"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>',
    sunset: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 5 4 4 4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>',
    mihrab: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21V11c0-3 2-6 5-8 3 2 5 5 5 8v10"/><path d="M3 21h18"/></svg>',
    kaaba: '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10.5h16"/></svg>'
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

  // First-ever visit (the key has literally never been written) seeds a
  // starter set of favorites, same as the reference design ships with -
  // once written, this never runs again, so deliberately clearing all
  // favorites later stays empty rather than snapping back to these.
  // Four topics: Prayer (16), Morning (27), Evening (28), Du'a after Salah
  // (25) — everything else is left for the user to add themselves from Zikrii.
  var DEFAULT_FAVORITES = [16, 27, 28, 25];
  function readFavorites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      if (raw === null) {
        writeFavorites(DEFAULT_FAVORITES);
        return DEFAULT_FAVORITES.slice();
      }
      return JSON.parse(raw);
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
    var v = parseFloat(localStorage.getItem(FONT_KEY) || "1.25");
    return isFinite(v) ? Math.min(1.8, Math.max(0.8, v)) : 1.25;
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

  // The source text has single line breaks baked in purely for a narrow
  // print column — on screen (especially at the Arabic font's larger size)
  // they land well short of the actual line width and read as broken
  // sentences. Collapse those into spaces so text reflows normally, while
  // keeping genuine blank-line paragraph/verse breaks intact.
  function normalizeText(s) {
    if (!s) return s;
    var PARA = "@@PARA@@";
    return s
      .replace(/\n{2,}/g, PARA)
      .replace(/\s*\n\s*/g, " ")
      .split(PARA).join("\n\n");
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
    { to: "#/home", label: "Mana", icon: "home" },
    { to: "#/categories", label: "Zikrii", icon: "bookOpen" },
    { to: "#/sagalee", label: "Sagalee", icon: "volume2" },
    { to: "#/tasbih", label: "Tasbiih", icon: "circleDot" },
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

  // ---------------- AdSense ----------------
  var ADSENSE_CLIENT = "ca-pub-7778012722329637";
  // Ad unit slot IDs from the AdSense dashboard (Ads > By ad unit > Display
  // ads) — one unit per placement. These are placeholders; swap in the real
  // slot ID each unit is given once created.
  var AD_SLOT_HOME = "0000000000";
  var AD_SLOT_ZIKRII = "0000000000";
  var AD_SLOT_SAGALEE = "0000000000";
  function adSlotHTML(slot) {
    return '<div class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="' +
      ADSENSE_CLIENT + '" data-ad-slot="' + slot + '" data-ad-format="auto" data-full-width-responsive="true"></ins></div>';
  }
  // Each SPA navigation replaces the DOM with a fresh, unfilled <ins> tag —
  // unlike a normal multi-page site, adsbygoogle.push() has to be called
  // again after every render, not just once at initial page load.
  function pushAd() {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }

  // ---------------- Category card ----------------
  // A few especially common chapters get a themed badge instead of the
  // plain chapter-number one, echoing how other adhkar apps mark these out
  // at a glance: Zikrii Ganamaa/Galgalaa (Morning/Evening, #27/#28), the
  // opening prayer du'a (#16), the dhikr said after finishing salah (#25),
  // and the Hajj/Umrah Talbiyah (#116, not a default favorite but still
  // themed if the user adds it themselves).
  var THEME_BADGE = {
    16: { icon: "mihrab", cls: "prayer" },
    25: { icon: "circleDot", cls: "afterprayer" },
    27: { icon: "sunrise", cls: "sunrise" },
    28: { icon: "sunset", cls: "sunset" },
    116: { icon: "kaaba", cls: "hajj" }
  };
  function categoryCardHTML(c) {
    var theme = THEME_BADGE[c.num];
    var badge = theme
      ? '<div class="category-num category-num-' + theme.cls + '">' + icon(theme.icon, 22) + "</div>"
      : '<div class="category-num">' + c.num + "</div>";
    return '<a href="#/category/' + c.num + '" class="glass category-card">' +
      badge +
      '<div class="category-text"><h3>' + esc(c.oromoTitle) + '</h3><p class="font-arabic" lang="ar" dir="rtl">' + esc(c.arabicTitle) + "</p></div>" +
      '<div class="category-count">' + c.duas.length + "</div>" +
      '<span class="category-chevron">' + icon("chevronLeft", 16) + "</span>" +
      "</a>";
  }

  // ---------------- Pages ----------------
  function pageCategories() {
    document.title = "Gosoota Zikrii — Hisnul Muslim";
    setTimeout(pushAd, 0);
    return (
      '<header class="animate-fade-in">' +
        '<p class="eyebrow">Hundi ' + CHAPTERS.length + "</p>" +
        '<h1 class="page-title">Gosoota <span class="gold-text">Zikrii</span></h1>' +
        '<p class="page-sub">Lakkoofsi tartiiba kitaaba Hisnul Muslim hordofa.</p>' +
      "</header>" +
      '<div class="category-list">' + CHAPTERS.map(categoryCardHTML).join("") + "</div>" +
      adSlotHTML(AD_SLOT_ZIKRII)
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

  // ---------------- Home (Mana) ----------------
  var homeState = null;
  function homeFavCardHTML(c) {
    var theme = THEME_BADGE[c.num];
    return (
      '<a href="#/category/' + c.num + '" class="home-fav-card' + (theme ? " home-fav-" + theme.cls : "") + '" data-chapter="' + c.num + '">' +
        (theme ? '<span class="home-fav-decor" aria-hidden="true">' + icon(theme.icon, 96) + "</span>" : "") +
        '<button class="home-fav-remove" data-action="home-remove" data-num="' + c.num + '" aria-label="Filannoo irraa balleessi">' + icon("x", 14) + "</button>" +
        '<p class="home-fav-num">#' + String(c.num).padStart(2, "0") + "</p>" +
        '<h3 class="home-fav-title">' + esc(c.oromoTitle) + "</h3>" +
        '<p class="home-fav-ar font-arabic" lang="ar" dir="rtl">' + esc(c.arabicTitle) + "</p>" +
        '<div class="home-fav-footer">' +
          '<span class="home-fav-count">' + c.duas.length + " du'aa'ii</span>" +
          '<div class="home-fav-controls">' +
            '<button class="skip-btn" data-action="home-prev" data-num="' + c.num + '" aria-label="Kan dabre" hidden>' + icon("skipPrev", 14) + "</button>" +
            '<button class="home-fav-play" data-action="home-play" data-num="' + c.num + '" aria-label="Taphachiisi">' + icon("play", 14) + "</button>" +
            '<button class="skip-btn" data-action="home-next" data-num="' + c.num + '" aria-label="Kan itti aanu" hidden>' + icon("skipNext", 14) + "</button>" +
          "</div>" +
        "</div>" +
      "</a>"
    );
  }
  function pageHome() {
    document.title = "Mana — Hisnul Muslim";
    var ids = readFavorites();
    var favs = CHAPTERS.filter(function (c) { return ids.indexOf(c.num) !== -1; });
    setTimeout(function () { bindHomeEvents(); pushAd(); }, 0);
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
      body =
        '<div class="home-fav-grid">' +
          favs.map(homeFavCardHTML).join("") +
          '<a href="#/categories" class="home-fav-add"><span class="ico">' + icon("plus", 22) + '</span><span>Kan biraa dabali</span></a>' +
        "</div>";
    }
    return (
      '<header class="animate-fade-in">' +
        '<p class="eyebrow">Hisnul Muslim</p>' +
        '<h1 class="page-title">Du’aa’ii <span class="gold-text">barbaachisoo</span></h1>' +
        '<p class="page-sub">Kanneen yeroo hunda fayyadamtu asitti qabadhu.</p>' +
      "</header>" + body + adSlotHTML(AD_SLOT_HOME)
    );
  }
  function bindHomeEvents() {
    document.querySelectorAll('[data-action="home-remove"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(parseInt(btn.getAttribute("data-num"), 10));
        renderTopbar();
        navigate();
      });
    });
    document.querySelectorAll('[data-action="home-play"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var num = parseInt(btn.getAttribute("data-num"), 10);
        if (homeState && homeState.currentChapter === num) {
          if (homeState.playing || homeState.loading) homeState.pause();
          else homeState.resume();
          return;
        }
        if (homeState) homeState.destroy();
        var chapter = CHAPTERS.find(function (c) { return c.num === num; });
        var urls = urlsForChapter(num);
        homeState = createAudioController(urls, function (st) { updateHomeUI(num, st); }, chapter ? repeatCountsForChapter(chapter) : null, chapter ? chapter.oromoTitle : null);
        homeState.currentChapter = num;
        homeState.play(0);
      });
    });
    document.querySelectorAll('[data-action="home-prev"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (homeState) homeState.previous();
      });
    });
    document.querySelectorAll('[data-action="home-next"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (homeState) homeState.next();
      });
    });
  }
  function updateHomeUI(num, st) {
    document.querySelectorAll(".home-fav-card").forEach(function (card) {
      var btn = card.querySelector('[data-action="home-play"]');
      if (!btn) return;
      var isThis = parseInt(card.getAttribute("data-chapter"), 10) === num;
      var playing = isThis && st.playing;
      var loading = isThis && st.loading;
      btn.innerHTML = loading ? icon("volume2", 14) : playing ? icon("pause", 14) : icon("play", 14);
      var showSkip = (playing || loading) && st.urls.length > 1;
      var prevBtn = card.querySelector('[data-action="home-prev"]');
      if (prevBtn) prevBtn.hidden = !showSkip;
      var nextBtn = card.querySelector('[data-action="home-next"]');
      if (nextBtn) nextBtn.hidden = !showSkip;
    });
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

  // Chapter 26 (Istikhaaraa): only the first entry is the actual du'a to
  // recite — the next two are supporting guidance/citation text (a wisdom
  // saying and a Qur'an verse about consultation), not further du'as. Kept
  // as ordinary cards (with their calibrated audio intact) rather than
  // topic-header blocks, just visually separated from the real du'a.
  var GUIDANCE_DIVIDER_BEFORE = { "26:1": true };

  var chapterAudioState = null; // { chapterNum, urls, idx, playing, loading, current, duration, progress }

  // Set right before navigating to the next chapter because the previous
  // one's audio finished on its own (see createAudioController's onEnded),
  // so bindCategoryPageEvents below knows to start playback immediately
  // instead of waiting for a tap — a continuous, hands-free listening flow
  // (e.g. while driving) rather than one chapter at a time.
  var autoAdvanceChapter = false;

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
      var divider = GUIDANCE_DIVIDER_BEFORE[chapter.num + ":" + i] ? '<hr class="guidance-divider">' : "";
      if (isTopicHeaderText(d)) {
        var cleanAr = d.arabic.replace(/^\s*\d+\.?\s*/, "");
        return divider + '<div class="topic-header animate-fade-in">' +
          '<p class="eyebrow">Mata-duree</p>' +
          '<p class="om">' + esc(normalizeText(d.oromo)) + '</p>' +
          '<p class="ar font-arabic" lang="ar" dir="rtl">' + esc(normalizeText(cleanAr)) + "</p>" +
        "</div>";
      }
      n += 1;
      return divider + duaCardHTML(chapter, d, n, i, !!rangeForDua(chapter.num, i));
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

  // Several du'as name how many times they're meant to be repeated (e.g.
  // "(ثلاث مرات)" = 3 times). Detected from the actual set of phrasings used
  // in this book's text (istighfar 3x, tasbih 33x, etc.) rather than a
  // general Arabic-number parser, matched after stripping diacritics so
  // wording differences between entries don't matter.
  //
  // Deliberately excludes "مائة مرة" (100 times) everywhere except ch.27/28
  // below: that phrase also shows up inside plain hadith narrations about
  // someone's habitual dhikr count elsewhere in the book (e.g. ch.129/130,
  // "fadaa'il" chapters), not as a "recite this now" instruction attached to
  // a specific formula, so matching it blindly would auto-repeat audio on
  // du'as that were never meant to be repeated at all.
  function stripTashkeel(s) {
    return s.replace(/[ً-ْٰۖ-ۭ]/g, "");
  }
  var REPEAT_RULES = [
    [/ثلاث[اى]?\s*وثلاثين/, 33],
    [/اربع[اى]?\s*وثلاثين/, 34],
    [/عشر\s*مرات/, 10],
    [/سبع\s*مرات/, 7],
    [/ست\s*مرات/, 6],
    [/خمس\s*مرات/, 5],
    [/اربع\s*مرات/, 4],
    [/ثلاث\s*مرات/, 3],
    [/\(\s*ثلاث[اى]?\s*\)/, 3]
  ];
  // ch.27/28 (Zikrii Ganamaa/Galgalaa) are exactly where "100 times"
  // recite-now instructions actually live (istighfar, tahlil, tasbih said
  // 100x after salah) - unlike elsewhere in the book, safe to match here.
  var HUNDRED_TIMES_RE = /مائة\s*مر/;
  var HUNDRED_TIMES_CHAPTERS = { 27: true, 28: true };
  // A named count above this would mean playing the same few-second clip a
  // very long time before moving on (e.g. tasbih recited 33/34 times) — cap
  // playback repeats at 10 and advance to the next track after that, same
  // as the audio can already replay when the reader re-taps play manually.
  var MAX_AUDIO_REPEATS = 10;
  function repeatCountFor(arabic, chapterNum) {
    var s = stripTashkeel(arabic).replace(/[إأآ]/g, "ا").replace(/\n/g, " ");
    for (var i = 0; i < REPEAT_RULES.length; i++) {
      if (REPEAT_RULES[i][0].test(s)) return Math.min(REPEAT_RULES[i][1], MAX_AUDIO_REPEATS);
    }
    if (HUNDRED_TIMES_CHAPTERS[chapterNum] && HUNDRED_TIMES_RE.test(s)) return MAX_AUDIO_REPEATS;
    return 1;
  }

  // Array parallel to a chapter's audio urls: how many times in a row to
  // play the track at each position, from the repeat count named in the
  // du'a text it belongs to (1 = play once, the normal case).
  function repeatCountsForChapter(chapter) {
    var counts = new Array(urlsForChapter(chapter.num).length).fill(1);
    chapter.duas.forEach(function (d, i) {
      var range = rangeForDua(chapter.num, i);
      if (!range) return;
      var n = repeatCountFor(d.arabic, chapter.num);
      if (n <= 1) return;
      for (var idx = range.start; idx <= range.end; idx++) counts[idx] = n;
    });
    return counts;
  }

  // The next chapter after fromNum that actually has audio to play — skips
  // over any chapter whose tracks are all "none" so continuous, hands-free
  // listening (see createAudioController's onEnded) doesn't stall on a
  // silent chapter. Returns null once nothing further in the book has audio.
  function nextChapterWithAudio(fromNum) {
    var idx = CHAPTERS.findIndex(function (c) { return c.num === fromNum; });
    for (var i = idx + 1; i < CHAPTERS.length; i++) {
      if (urlsForChapter(CHAPTERS[i].num).length) return CHAPTERS[i];
    }
    return null;
  }

  // Quranic ayat (as opposed to hadith-phrased du'a text) are written with
  // Uthmani orthography (alef wasla "ٱ") and one verse per paragraph — a
  // convention only used for direct Qur'an quotations in this data (Ayat
  // al-Kursi, the three Quls, the Al-Imran closing verses). Detecting that
  // lets rendering add the traditional ornamental start/end-of-ayah marks
  // without having to hand-flag every entry.
  function isQuranicAyat(arabic) {
    return arabic.indexOf("ٱ") !== -1;
  }
  var BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
  function countBismillah(arabic) {
    var n = 0;
    arabic.split(/\n\n+/).forEach(function (v) { if (v.trim() === BISMILLAH) n++; });
    return n;
  }
  // Wraps one surah's (or one standalone passage's) ayat in ornate brackets,
  // with a small star after every verse. Bismillah sits ahead of the
  // brackets as its own heading — it introduces the surah rather than being
  // one of its numbered verses, so it isn't part of the quoted-verse block.
  function renderAyatBlock(verses) {
    var heading = "";
    var ayat = [];
    verses.forEach(function (v) {
      if (v === BISMILLAH) heading += '<span class="bismillah">' + esc(v) + "</span>";
      else ayat.push(v);
    });
    if (!ayat.length) return heading;
    // Some long ayat have single line-breaks in the source data (mid-verse
    // formatting), unlike the \n\n that separates one verse from the next.
    // normalizeText collapses those to spaces so a single verse always
    // flows and wraps as one unit — only the \n\n already used to split
    // `verses` should ever force a break.
    var body = ayat.map(function (v) {
      return esc(normalizeText(v)) + ' <span class="ayah-end" aria-hidden="true">' + icon("ayahEnd", 11) + "</span>";
    }).join(" ");
    return heading + '<span class="ayah-open" aria-hidden="true">﴿</span>' + body + '<span class="ayah-close" aria-hidden="true">﴾</span>';
  }
  function renderArabicText(arabic) {
    if (!isQuranicAyat(arabic)) return esc(normalizeText(arabic));
    var verses = arabic.split(/\n\n+/).map(function (v) { return v.trim(); }).filter(Boolean);
    return renderAyatBlock(verses);
  }
  // Several short surahs bundled into one du'a (e.g. the three Quls): each
  // gets its own bracket pair, with its Oromo translation directly under it
  // rather than one combined translation at the very end. Relies on the
  // data pairing them up 1:1 — one Bismillah-led group in the Arabic per
  // blank-line-separated paragraph in the Oromo.
  function renderMultiSurah(arabic, oromo) {
    var segs = arabic.split(/\n\n+/).map(function (v) { return v.trim(); }).filter(Boolean);
    var arGroups = [];
    segs.forEach(function (v) {
      if (v === BISMILLAH || !arGroups.length) arGroups.push([]);
      arGroups[arGroups.length - 1].push(v);
    });
    var omGroups = oromo.split(/\n\n+/).map(function (v) { return v.trim(); }).filter(Boolean);
    return arGroups.map(function (group, i) {
      return '<div class="surah-block">' +
        '<p class="dua-arabic font-arabic" lang="ar" dir="rtl">' + renderAyatBlock(group) + "</p>" +
        (omGroups[i] ? '<p class="dua-oromo surah-oromo">' + esc(normalizeText(omGroups[i])) + "</p>" : "") +
      "</div>";
    }).join("");
  }

  // Khawatim Aali-'Imraan (3:190-200): a single continuous passage, not
  // several bundled surahs, so each individual ayah gets its own bracket
  // pair with that ayah's Oromo translation directly beneath it — as
  // opposed to renderMultiSurah's one-block-per-surah grouping. Detected
  // the same way audio.js's isAlimranCombinedDua does (kept as an
  // independent copy here since rendering has no reason to depend on the
  // audio module, or vice versa).
  function isAlimranCombinedDua(d) {
    return d.arabic.normalize("NFC").indexOf("خَلْقِ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ وَٱخْتِلَٰفِ".normalize("NFC")) !== -1;
  }

  // Some du'as narrate an action ("he cups his hands, then recites...") that
  // quotes actual Qur'an verses in the middle of otherwise plain hadith
  // text, rather than being pure Qur'an quotation themselves — e.g. the
  // bedtime dhikr that quotes the three Quls. A per-chunk isQuranicAyat
  // check isn't reliable here: some genuine mid-surah verses (e.g. "لَمْ
  // يَلِدْ وَلَمْ يُولَدْ") happen to contain no wasla alef at all, so
  // they'd be misread as "plain" and wrongly split the surah apart. Once
  // inside a Bismillah-led verse group, a chunk stays part of that Qur'an
  // group unless it contains a paren — this book's convention for
  // narration/annotation asides (e.g. "(ثَلَاثَ مَرَّاتٍ)") — which never
  // appears inside an actual ayah in this data.
  function classifyDuaChunks(arabic) {
    var chunks = arabic.split(/\n\n+/).map(function (v) { return v.trim(); }).filter(Boolean);
    var blocks = [];
    var inQuran = false;
    chunks.forEach(function (c) {
      if (c === BISMILLAH) {
        blocks.push({ type: "quran", verses: [c] });
        inQuran = true;
        return;
      }
      if (inQuran && !/[()]/.test(c)) {
        blocks[blocks.length - 1].verses.push(c);
        return;
      }
      blocks.push({ type: "plain", text: c });
      inQuran = false;
    });
    return blocks;
  }
  function isMixedDua(arabic) {
    var blocks = classifyDuaChunks(arabic);
    return blocks.some(function (b) { return b.type === "quran"; }) &&
      blocks.some(function (b) { return b.type === "plain"; });
  }
  function renderMixedDua(arabic, oromo) {
    var blocks = classifyDuaChunks(arabic);
    var omParas = oromo.split(/\n\n+/).map(function (v) { return v.trim(); }).filter(Boolean);
    return blocks.map(function (b, idx) {
      var arHtml = b.type === "quran" ? renderAyatBlock(b.verses) : esc(normalizeText(b.text));
      var omHtml = omParas[idx] ? '<p class="dua-oromo surah-oromo">' + esc(normalizeText(omParas[idx])) + "</p>" : "";
      return '<div class="surah-block">' +
        '<p class="dua-arabic font-arabic" lang="ar" dir="rtl">' + arHtml + "</p>" +
        omHtml +
      "</div>";
    }).join("");
  }
  function renderAyahByAyah(arabic, oromo) {
    var arVerses = arabic.split(/\n\n+/).map(function (v) { return v.trim(); }).filter(Boolean);
    var omVerses = oromo.split(/\n\n+/).map(function (v) { return v.trim(); }).filter(Boolean);
    var body = arVerses.map(function (v, idx) {
      return '<div class="ayah-block">' +
        '<p class="dua-arabic font-arabic" lang="ar" dir="rtl">' + renderAyatBlock([v]) + "</p>" +
        (omVerses[idx] ? '<p class="dua-oromo ayah-oromo">' + esc(normalizeText(omVerses[idx])) + "</p>" : "") +
      "</div>";
    }).join("");
    return '<div class="ayah-citation">Aal-\'Imraan 190-200</div>' + body;
  }

  function duaCardHTML(chapter, d, n, i, hasAudio) {
    return (
      '<article class="glass dua-card animate-fade-in" data-dua-idx="' + i + '">' +
        '<div class="dua-card-top">' +
          '<div class="dua-idx">' + n + "</div>" +
          '<div class="dua-actions">' +
            (hasAudio ?
              '<button class="skip-btn" data-action="dua-prev" aria-label="Kan dabre" hidden>' + icon("skipPrev", 14) + "</button>" +
              '<button class="play-btn" data-action="play-dua" data-idx="' + i + '" aria-label="Sagalee dhageeffadhu">' + icon("play", 14) + "</button>" +
              '<button class="skip-btn" data-action="dua-next" aria-label="Kan itti aanu" hidden>' + icon("skipNext", 14) + "</button>"
              : "") +
            '<button data-action="share" data-arabic="' + esc(d.arabic) + '" data-oromo="' + esc(d.oromo) + '" data-title="' + esc(chapter.oromoTitle) + '" aria-label="Share">' + icon("share2", 16) + "</button>" +
          "</div>" +
        "</div>" +
        '<div class="seek-wrap" hidden></div>' +
        '<p class="audio-error" hidden></p>' +
        (isAlimranCombinedDua(d) ?
          renderAyahByAyah(d.arabic, d.oromo || "") :
          isMixedDua(d.arabic) ?
          renderMixedDua(d.arabic, d.oromo || "") :
          countBismillah(d.arabic) > 1 ?
          renderMultiSurah(d.arabic, d.oromo || "") :
          '<p class="dua-arabic font-arabic" lang="ar" dir="rtl">' + renderArabicText(d.arabic) + "</p>" +
          (d.oromo ? '<p class="dua-oromo">' + esc(normalizeText(d.oromo)) + "</p>" : "")
        ) +
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
    });

    var urls = urlsForChapter(chapter.num);
    // Tracks which du'a card is currently the "active" one so playback can
    // auto-scroll the page to follow along (useful hands-free, e.g. while
    // driving) without re-scrolling on every progress tick — only when the
    // active du'a actually changes.
    var lastActiveDuaIdx = -1;
    chapterAudioState = createAudioController(urls, function (state) {
      updateDuaPlayUI(chapter, state);
      if (state.playing || state.loading) {
        var activeIdx = -1;
        for (var i = 0; i < chapter.duas.length; i++) {
          var r = rangeForDua(chapter.num, i);
          if (r && state.idx >= r.start && state.idx <= r.end) { activeIdx = i; break; }
        }
        if (activeIdx !== -1 && activeIdx !== lastActiveDuaIdx) {
          lastActiveDuaIdx = activeIdx;
          var card = document.querySelector('.dua-card[data-dua-idx="' + activeIdx + '"]');
          if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, repeatCountsForChapter(chapter), chapter.oromoTitle, function () {
      // The whole chapter's audio just finished on its own — continue into
      // the next chapter that has audio instead of just stopping.
      var next = nextChapterWithAudio(chapter.num);
      if (next) {
        autoAdvanceChapter = true;
        location.hash = "#/category/" + next.num;
      }
    });
    if (autoAdvanceChapter) {
      autoAdvanceChapter = false;
      chapterAudioState.play(0);
    }

    document.querySelectorAll('[data-action="dua-prev"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.stopPropagation(); if (chapterAudioState) chapterAudioState.previous(); });
    });
    document.querySelectorAll('[data-action="dua-next"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.stopPropagation(); if (chapterAudioState) chapterAudioState.next(); });
    });

    document.querySelectorAll('[data-action="play-dua"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var duaIdx = parseInt(btn.getAttribute("data-idx"), 10);
        var range = rangeForDua(chapter.num, duaIdx);
        if (!range) return;
        var st = chapterAudioState;
        var inRange = st.idx >= range.start && st.idx <= range.end;
        // Include "loading" so a tap that lands while this track is still
        // buffering pauses it, rather than being read as "not playing yet"
        // and calling play() again on top of the in-flight attempt.
        if ((st.playing || st.loading) && inRange) {
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
      if (btn) {
        btn.classList.toggle("playing", playing);
        btn.innerHTML = loading ? icon("volume2", 14) : playing ? icon("pause", 14) : icon("play", 14);
      }
      var active = playing || loading;
      var showSkip = active && st.urls.length > 1;
      var prevBtn = card.querySelector('[data-action="dua-prev"]');
      if (prevBtn) prevBtn.hidden = !showSkip;
      var nextBtn = card.querySelector('[data-action="dua-next"]');
      if (nextBtn) nextBtn.hidden = !showSkip;
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
        errEl.textContent = "Sagaleen argamuu dadhabe — interneeta kee mirkaneessi.";
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

  // repeatCounts (optional): array parallel to urls, giving how many times
  // in a row to play the track at each position before moving on — for
  // du'as whose text names a repeat count (e.g. "three times").
  //
  // title (optional): shown in the OS/lock-screen media controls via the
  // Media Session API below — this is also what keeps playback going when
  // the tab is backgrounded or the screen locks. Without a registered media
  // session, mobile browsers (iOS Safari in particular) treat background
  // audio as unimportant and suspend it; with one, the OS knows this is a
  // real, ongoing playback session the user asked for and leaves it alone.
  //
  // onEnded (optional): fired once, the moment the whole queue finishes on
  // its own (the last track ends and repeat is off) — not on a user pause,
  // and not on each individual track finishing. Callers use this to chain
  // into the next chapter for hands-free, continuous listening.
  function createAudioController(urls, onUpdate, repeatCounts, title, onEnded) {
    var audioEl = new Audio();
    audioEl.preload = "auto";
    // Deliberately no crossOrigin="anonymous": these hosts aren't guaranteed
    // to send CORS headers, plain playback doesn't need them, and forcing
    // CORS mode would make the browser refuse the opaque (no-cors) responses
    // stored by the offline-download feature below.
    var preloadEl = new Audio();
    preloadEl.preload = "auto";
    preloadEl.muted = true;

    var state = { urls: urls, idx: 0, playing: false, loading: false, current: 0, duration: 0, progress: 0, repeat: false, advancing: false, error: false, destroyed: false, repeatsLeft: 1, repeatTotal: 1, interruptedExternally: false };

    function repeatCountAt(idx) {
      return (repeatCounts && repeatCounts[idx]) || 1;
    }

    // The Media Session API is a single global slot — whichever controller
    // last registered its handlers "owns" the OS-level play/pause/seek
    // controls. That's fine here: state.play() already pauses any other
    // active controller before starting, so only one is ever really live.
    var hasMediaSession = typeof navigator !== "undefined" && "mediaSession" in navigator;
    if (hasMediaSession) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: title || "Hisnul Muslim", artist: "Hisnul Muslim" });
      } catch (e) {}
      navigator.mediaSession.setActionHandler("play", function () { state.resume(); });
      navigator.mediaSession.setActionHandler("pause", function () { state.pause(); });
      try { navigator.mediaSession.setActionHandler("nexttrack", function () { state.next(); }); } catch (e) {}
      try { navigator.mediaSession.setActionHandler("previoustrack", function () { state.previous(); }); } catch (e) {}
    }
    function syncMediaSessionState() {
      if (!hasMediaSession) return;
      try { navigator.mediaSession.playbackState = state.playing ? "playing" : "paused"; } catch (e) {}
    }

    // Tapping our own pause button (or the OS media-control pause button)
    // sets pausedByUs first, so the "pause" listener below can tell that
    // apart from an external interruption — a phone call, another app
    // grabbing the audio focus, etc., which pauses the element without
    // going through any of our own code. Only an external interruption
    // gets auto-resumed once the tab is visible again; a pause the user
    // actually asked for never restarts itself. Listener is removed in
    // destroy() — each controller adds its own, and there's a fresh one
    // per play session, so this would otherwise pile up indefinitely.
    var pausedByUs = false;
    function onVisibilityChange() {
      if (document.visibilityState !== "visible" || state.destroyed) return;
      if (state.interruptedExternally) {
        state.interruptedExternally = false;
        // Silent retry, unlike state.resume() — failing to auto-resume here
        // isn't a real error worth showing the "audio failed to load"
        // banner for, it just means whatever interrupted playback (a call
        // that hasn't actually ended yet, audio focus taken by another app)
        // is still holding on; nothing more to do until the next attempt.
        audioEl.play().catch(function () {});
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

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

    // Attempts audioEl.play(), retrying a couple of times (reloading first)
    // before giving up — a real mobile connection can reject the very next
    // play() call right after switching tracks with a transient error (a
    // brief tower handoff, a slow buffer, momentary congestion) that a
    // fast/local connection never surfaces. onSettled(true/false) fires
    // once, after the whole retry sequence concludes either way.
    function playWithRetry(retriesLeft, onSettled) {
      audioEl.play().then(function () {
        onSettled(true);
      }).catch(function () {
        if (state.destroyed) { onSettled(false); return; }
        if (retriesLeft > 0) {
          setTimeout(function () {
            if (state.destroyed) { onSettled(false); return; }
            try { audioEl.load(); } catch (e) {}
            playWithRetry(retriesLeft - 1, onSettled);
          }, 600);
          return;
        }
        onSettled(false);
      });
    }

    function advance() {
      if (state.destroyed || state.advancing) return;

      // The just-finished track names a repeat count and hasn't been played
      // that many times yet — play it again from the start instead of
      // moving forward.
      if (state.repeatsLeft > 1) {
        state.repeatsLeft -= 1;
        state.advancing = true;
        state.current = 0;
        audioEl.currentTime = 0;
        emit();
        playWithRetry(2, function (ok) {
          if (!ok) { state.playing = false; state.loading = false; state.error = true; emit(); }
          state.advancing = false;
        });
        return;
      }

      var atEnd = state.idx >= state.urls.length - 1;
      if (atEnd && !state.repeat) {
        state.playing = false; state.current = 0; state.duration = 0; state.progress = 0;
        emit();
        if (typeof onEnded === "function") onEnded();
        return;
      }
      state.advancing = true;
      state.idx = atEnd ? 0 : state.idx + 1;
      state.repeatTotal = repeatCountAt(state.idx);
      state.repeatsLeft = state.repeatTotal;
      audioEl.src = state.urls[state.idx];
      state.current = 0; state.duration = 0; state.progress = 0;
      try { audioEl.load(); } catch (e) {}
      playWithRetry(2, function (ok) {
        if (!ok) { state.playing = false; state.loading = false; state.error = true; emit(); }
        state.advancing = false;
        preloadNext();
      });
    }

    audioEl.addEventListener("ended", advance);
    audioEl.addEventListener("error", function () {
      // A track genuinely failed (bad URL, offline, blocked, etc). Try the
      // next track in the queue so one bad file doesn't stall a whole du'a;
      // only surface a hard error once there's nowhere left to go. Skip any
      // remaining repeats of this same (broken) track — retrying it won't help.
      var hasNext = state.idx < state.urls.length - 1 || state.repeat;
      if (hasNext) { state.repeatsLeft = 1; advance(); }
      else { state.playing = false; state.loading = false; state.error = true; emit(); }
    });
    audioEl.addEventListener("playing", function () {
      // Real playback starting is the one signal that's never ambiguous:
      // clear a stale error left over from an earlier track in this same
      // session (advance() moving on to try the next track doesn't reset
      // it, so without this an error banner from one bad file could keep
      // showing even after a later track started playing fine).
      state.loading = false; state.playing = true; state.error = false; state.interruptedExternally = false; emit();
      syncMediaSessionState();
    });
    audioEl.addEventListener("pause", function () {
      state.playing = false;
      // audioEl.ended is already true here if this pause is just the normal
      // side effect of a track finishing on its own (advance()'s "ended"
      // listener runs right after) — not a real interruption, so leave it
      // alone rather than fighting the natural end-of-track handoff.
      if (!pausedByUs && !state.advancing && !audioEl.ended) {
        state.interruptedExternally = true;
        // Retry playback immediately rather than waiting for the tab to
        // become visible again. Simply minimizing the window/app doesn't
        // take away the audio focus the Media Session registration above
        // secured, so this retry succeeds at once and the pause is never
        // really perceptible. A genuine interruption — an incoming call,
        // another app grabbing audio focus — does take the focus away, so
        // the OS refuses this and playback stays paused; onVisibilityChange
        // below retries again once the tab is visible (the call has ended).
        // Silent on failure, same reasoning as onVisibilityChange below —
        // a still-ongoing interruption isn't a real playback error.
        audioEl.play().catch(function () {});
      }
      pausedByUs = false;
      emit();
      syncMediaSessionState();
    });
    audioEl.addEventListener("loadedmetadata", function () { state.duration = audioEl.duration || 0; emit(); });
    audioEl.addEventListener("timeupdate", function () {
      state.current = audioEl.currentTime;
      if (audioEl.duration > 0) state.progress = (audioEl.currentTime / audioEl.duration) * 100;
      // Track-to-track advancement relies solely on the "ended" event below.
      // An earlier version jumped the gun here, calling advance() (and so
      // audioEl.load()) up to 0.35s before the track actually finished —
      // while it was still audibly playing. On a real mobile connection
      // (unlike a fast local/desktop one) that collided with the still-
      // settling previous play() often enough to make the browser reject
      // the next one outright ("interrupted by a new load request"),
      // surfacing as a false "audio failed to load" error on real devices.
      // preloadNext() already fetches the next track's bytes well ahead of
      // time, so waiting for the real "ended" event costs no perceptible gap.
      emit();
    });

    state.play = function (fromIdx) {
      if (!state.urls.length) return;
      if (activeAudioController && activeAudioController !== state) {
        activeAudioController.pause();
      }
      activeAudioController = state;
      state.idx = fromIdx || 0;
      state.repeatTotal = repeatCountAt(state.idx);
      state.repeatsLeft = state.repeatTotal;
      audioEl.src = state.urls[state.idx];
      state.loading = true; state.error = false; state.current = 0; state.duration = 0; state.progress = 0;
      emit();
      try { audioEl.load(); } catch (e) {}
      playWithRetry(2, function (ok) {
        if (ok) { preloadNext(); }
        else { state.loading = false; state.error = true; emit(); }
      });
    };
    state.pause = function () { pausedByUs = true; audioEl.pause(); };
    // Resumes from the current position (unlike state.play, which always
    // restarts a track from 0) — used by the OS media-session "play"
    // control (lock screen / notification).
    state.resume = function () {
      if (state.destroyed) return;
      audioEl.play().catch(function () { state.error = true; emit(); });
    };
    state.seek = function (t) { if (isFinite(t)) { audioEl.currentTime = t; state.current = t; emit(); } };
    // Manual skip: ignores any repeat count still owed on the current track
    // (the reader explicitly asked to move on) and always advances forward,
    // even if repeats are pending — unlike the natural end-of-track path.
    state.next = function () {
      if (state.destroyed || !state.urls.length) return;
      pausedByUs = true;
      state.repeatsLeft = 1;
      advance();
    };
    // Restarts the current track if it's already a few seconds in (the
    // usual "previous" convention in music players); otherwise jumps back
    // to the actual previous track.
    state.previous = function () {
      if (state.destroyed || !state.urls.length) return;
      pausedByUs = true;
      if (state.current > 3) {
        audioEl.currentTime = 0;
        state.current = 0;
        emit();
        return;
      }
      state.advancing = true;
      state.idx = state.idx > 0 ? state.idx - 1 : (state.repeat ? state.urls.length - 1 : 0);
      state.repeatTotal = repeatCountAt(state.idx);
      state.repeatsLeft = state.repeatTotal;
      audioEl.src = state.urls[state.idx];
      state.current = 0; state.duration = 0; state.progress = 0;
      try { audioEl.load(); } catch (e) {}
      playWithRetry(2, function (ok) {
        if (!ok) { state.playing = false; state.loading = false; state.error = true; emit(); }
        state.advancing = false;
      });
    };
    state.destroy = function () {
      state.destroyed = true;
      pausedByUs = true;
      audioEl.pause();
      audioEl.removeAttribute("src");
      try { audioEl.load(); } catch (e) {}
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (activeAudioController === state) activeAudioController = null;
      // Only clear the OS media session if this controller still owns it —
      // a newer controller may already have taken over (and registered its
      // own handlers) by the time this one gets torn down.
      if (hasMediaSession && activeAudioController === null) {
        try {
          navigator.mediaSession.playbackState = "none";
          navigator.mediaSession.setActionHandler("play", null);
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("nexttrack", null);
          navigator.mediaSession.setActionHandler("previoustrack", null);
        } catch (e) {}
      }
    };

    return state;
  }

  function shareText(title, text) {
    if (navigator.share) {
      navigator.share({ title: title, text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  }

  // ---------------- Tasbih ----------------
  // "audio" points to the matching recitation already recorded elsewhere in
  // the book for this exact phrase (see audio.js) - e.g. Astaghfirullah's
  // audio is the same track used for the identical du'a in Zikrii
  // Ganamaa/Galgalaa (ch.27/28, du'a 23). SubhanAllah/Alhamdulillah/Allahu
  // akbar are said together as a single combined phrase (ch.25, du'a 4) and
  // its audio recites exactly that wording, so they're one preset rather
  // than three.
  // Salawat's audio is chapter 27's closing du'a (the same wording, recited
  // 10x there); the target here is kept at 100 by request rather than
  // matching that chapter's own 10x instruction.
  var TASBIH_PRESETS = [
    { label: "SubḥānAllāh, alḥamdulillāh, Allāhu akbar", arabic: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَاللَّهُ أَكْبَرُ", target: 33, audio: "audio/n65.mp3" },
    { label: "Lā ilāha illā Allāh", arabic: "لاَ إِلَهَ إِلاَّ اللَّهُ، وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", target: 100, audio: "audio/n89.mp3" },
    { label: "Astaghfirullāh", arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", target: 100, audio: "audio/n92.mp3" },
    { label: "SubḥānAllāhi wa biḥamdihi", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", target: 100, audio: "audio/n88.mp3" },
    { label: "Ṣall Allāhu ʿalā Muḥammad", arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبَيِّنَا مُحَمَّدٍ", target: 100, audio: "audio/n94.mp3" }
  ];

  function pageTasbih() {
    document.title = "Tasbiih — Hisnul Muslim";
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(TASBIH_KEY) || "{}"); } catch (e) {}
    // A saved index can point past the end after a preset-list change (e.g.
    // three presets merged into one) - fall back to the first preset rather
    // than rendering nothing.
    var presetIdx = saved.presetIdx >= 0 && saved.presetIdx < TASBIH_PRESETS.length ? saved.presetIdx : 0;
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

  // Loops preset.audio up to preset.target times when tapped - a listening
  // companion for the recitation, independent of the tap counter below (the
  // counter still only advances by hand, matching how someone actually
  // counts while listening). Kept as a plain in-memory Audio object rather
  // than an <audio> element in the panel markup so it survives the panel's
  // innerHTML being replaced on every tap.
  var tasbihAudio = null;
  var tasbihAudioPresetIdx = null;
  var tasbihAudioPlays = 0;

  function stopTasbihAudio() {
    if (tasbihAudio) { tasbihAudio.pause(); tasbihAudio.currentTime = 0; }
    tasbihAudio = null;
    tasbihAudioPresetIdx = null;
    tasbihAudioPlays = 0;
  }

  function updateTasbihPlayBtn(presetIdx) {
    var btn = document.getElementById("tasbih-play");
    if (!btn) return;
    var playing = tasbihAudioPresetIdx === presetIdx;
    btn.innerHTML = icon(playing ? "pause" : "play", 18);
    btn.classList.toggle("is-playing", playing);
  }

  function toggleTasbihAudio(presetIdx) {
    var preset = TASBIH_PRESETS[presetIdx];
    if (!preset.audio) return;
    if (tasbihAudioPresetIdx === presetIdx) {
      stopTasbihAudio();
      updateTasbihPlayBtn(presetIdx);
      return;
    }
    stopTasbihAudio();
    tasbihAudioPresetIdx = presetIdx;
    tasbihAudioPlays = 0;
    tasbihAudio = new Audio(preset.audio);
    tasbihAudio.addEventListener("ended", function () {
      tasbihAudioPlays++;
      if (tasbihAudioPresetIdx === presetIdx && tasbihAudioPlays < preset.target) {
        tasbihAudio.currentTime = 0;
        tasbihAudio.play().catch(function () {});
      } else {
        stopTasbihAudio();
        updateTasbihPlayBtn(presetIdx);
      }
    });
    tasbihAudio.play().catch(function () {});
    updateTasbihPlayBtn(presetIdx);
  }

  function renderTasbihPanel(presetIdx, count) {
    var preset = TASBIH_PRESETS[presetIdx];
    var progress = Math.min(100, (count / preset.target) * 100);
    var round = Math.floor(count / preset.target);
    var inRound = count % preset.target;
    var circumference = 276.46;
    var panel = document.getElementById("tasbih-panel");
    panel.innerHTML =
      (preset.audio
        ? '<button class="tasbih-play-btn' + (tasbihAudioPresetIdx === presetIdx ? " is-playing" : "") + '" id="tasbih-play" aria-label="Taphachiisi sagalee">' +
            icon(tasbihAudioPresetIdx === presetIdx ? "pause" : "play", 18) +
          "</button>"
        : "") +
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
    if (preset.audio) {
      document.getElementById("tasbih-play").addEventListener("click", function () { toggleTasbihAudio(presetIdx); });
    }
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
        stopTasbihAudio();
        saveTasbih(i, 0);
        renderTasbihPanel(i, 0);
      });
    });
  }

  // ---------------- Sagalee (audio library) ----------------
  var sagaleeState = null;
  function pageSagalee() {
    document.title = "Sagalee — Hisnul Muslim";
    setTimeout(function () { bindSagaleeEvents(); pushAd(); }, 0);
    var items = CHAPTERS.map(function (c) {
      return (
        '<li class="glass sagalee-item animate-fade-in" data-chapter="' + c.num + '">' +
          '<div class="sagalee-row" data-action="sagalee-toggle" data-num="' + c.num + '" role="button" tabindex="0">' +
            '<span class="sagalee-play" aria-hidden="true">' + icon("play", 20) + "</span>" +
            '<span class="sagalee-text"><span class="om">' + esc(c.oromoTitle) + '</span><span class="ar font-arabic" lang="ar" dir="rtl">' + esc(c.arabicTitle) + "</span></span>" +
            '<span class="sagalee-num">#' + String(c.num).padStart(3, "0") + "</span>" +
          "</div>" +
          '<div class="seek-wrap" hidden>' +
            '<input class="seek-input" type="range" min="0" max="0" step="0.1" value="0">' +
            '<div class="seek-times"><span class="seek-current">0:00</span><span class="seek-remaining">0:00</span></div>' +
            '<div class="seek-controls">' +
              '<button class="skip-btn" data-action="sagalee-prev" aria-label="Kan dabre" hidden>' + icon("skipPrev", 16) + "</button>" +
              '<button class="skip-btn" data-action="sagalee-next" aria-label="Kan itti aanu" hidden>' + icon("skipNext", 16) + "</button>" +
            "</div>" +
          "</div>" +
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
      '<ul class="sagalee-list">' + items + "</ul>" +
      adSlotHTML(AD_SLOT_SAGALEE)
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

    function playSagaleeChapter(num) {
      if (sagaleeState) sagaleeState.destroy();
      var chapter = CHAPTERS.find(function (c) { return c.num === num; });
      var urls = urlsForChapter(num);
      sagaleeState = createAudioController(urls, function (st) { updateSagaleeUI(num, st); }, chapter ? repeatCountsForChapter(chapter) : null, chapter ? chapter.oromoTitle : null, function () {
        // This chapter's audio finished on its own — keep going into the
        // next one with audio instead of stopping, so a whole listening
        // session (e.g. while driving) plays straight through.
        var next = nextChapterWithAudio(num);
        if (next) playSagaleeChapter(next.num);
      });
      sagaleeState.currentChapter = num;
      sagaleeState.repeat = repeatOn;
      sagaleeState.play(0);
      var row = document.querySelector('.sagalee-item[data-chapter="' + num + '"]');
      if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function toggleSagalee(row) {
      var num = parseInt(row.getAttribute("data-num"), 10);
      if (sagaleeState && sagaleeState.currentChapter === num) {
        // Same chapter already loaded: pause if it's active (playing or
        // still buffering), otherwise this is a genuine resume tap.
        if (sagaleeState.playing || sagaleeState.loading) sagaleeState.pause();
        else sagaleeState.resume();
        return;
      }
      playSagaleeChapter(num);
    }
    document.querySelectorAll('[data-action="sagalee-toggle"]').forEach(function (row) {
      row.addEventListener("click", function () { toggleSagalee(row); });
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSagalee(row); }
      });
    });

    // Seek input and skip buttons are static markup (see pageSagalee), bound
    // once here rather than rebuilt with the rest of seek-wrap's innerHTML
    // on every progress tick — a full-innerHTML rebuild ~4x/second while
    // playing was replacing these elements out from under an in-flight tap,
    // making Play/Pause/Next presses land on a stale, about-to-be-removed
    // node and appear to silently do nothing.
    document.querySelectorAll(".sagalee-item").forEach(function (li) {
      var input = li.querySelector(".seek-input");
      input.addEventListener("input", function () { if (sagaleeState) sagaleeState.seek(parseFloat(input.value)); });
      li.querySelector('[data-action="sagalee-prev"]').addEventListener("click", function (e) {
        e.stopPropagation();
        if (sagaleeState) sagaleeState.previous();
      });
      li.querySelector('[data-action="sagalee-next"]').addEventListener("click", function (e) {
        e.stopPropagation();
        if (sagaleeState) sagaleeState.next();
      });
    });
  }
  function updateSagaleeUI(num, st) {
    document.querySelectorAll(".sagalee-item").forEach(function (li) {
      var liNum = parseInt(li.getAttribute("data-chapter"), 10);
      var isThis = liNum === num;
      var playBtn = li.querySelector(".sagalee-play");
      var seekWrap = li.querySelector(".seek-wrap");
      var errEl = li.querySelector(".audio-error");
      var prevBtn = li.querySelector('[data-action="sagalee-prev"]');
      var nextBtn = li.querySelector('[data-action="sagalee-next"]');
      if (!isThis) {
        playBtn.innerHTML = icon("play", 20);
        seekWrap.hidden = true;
        prevBtn.hidden = true; nextBtn.hidden = true;
        errEl.hidden = true;
        return;
      }
      var playing = st.playing;
      var loading = st.loading;
      playBtn.innerHTML = loading ? icon("volume2", 20) : playing ? icon("pause", 20) : icon("play", 20);
      var active = playing || loading;
      seekWrap.hidden = !active;
      var showSkip = active && st.urls.length > 1;
      prevBtn.hidden = !showSkip;
      nextBtn.hidden = !showSkip;
      if (active) {
        var input = seekWrap.querySelector(".seek-input");
        input.max = st.duration || 0;
        input.value = st.current;
        input.style.background = "linear-gradient(to right, var(--gold) " + st.progress + "%, color-mix(in oklab, var(--primary) 20%, transparent) " + st.progress + "%)";
        seekWrap.querySelector(".seek-current").textContent = fmtTime(st.current);
        seekWrap.querySelector(".seek-remaining").textContent = (st.urls.length > 1 ? (st.idx + 1) + "/" + st.urls.length + " · " : "") + fmtTime(st.duration);
      }
      errEl.hidden = !st.error;
      if (st.error) errEl.textContent = "Sagaleen argamuu dadhabe — interneeta kee mirkaneessi.";
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
  function bedtimeStatusText() {
    if (!window.RemindersAPI || !RemindersAPI.isBedtimeEnabled()) return "Yaadachiisni hirribaa cufaadha.";
    return "Banaadha — guyyuma sa'aatii " + RemindersAPI.bedtimeTime() + " tti beeksisa siif erga.";
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

  // ---------------- Offline audio download status ----------------
  // Purely a status readout — the actual downloading is the service
  // worker's job (see sw.js's precacheAllAudio, which starts automatically
  // on first launch). Reads the audio cache directly from the page side
  // rather than duplicating the service worker's file list, so this always
  // reflects exactly what the app itself needs to play — every track any
  // chapter currently resolves to.
  var AUDIO_CACHE_NAME = "hisnul-audio-v1"; // must match sw.js's AUDIO_CACHE_NAME
  function allAudioUrls() {
    var seen = {};
    var urls = [];
    CHAPTERS.forEach(function (c) {
      urlsForChapter(c.num).forEach(function (u) {
        if (!seen[u]) { seen[u] = true; urls.push(u); }
      });
    });
    return urls;
  }
  function refreshAudioDownloadStatus() {
    var textEl = document.getElementById("settings-audio-status-text");
    if (!textEl) return; // navigated away from Settings already
    if (!("caches" in window)) {
      textEl.textContent = "Bilbilli/browserichi kun ol kaa'uu sagalee offline hin deeggaru.";
      return;
    }
    var urls = allAudioUrls();
    caches.open(AUDIO_CACHE_NAME).then(function (cache) {
      return Promise.all(urls.map(function (u) { return cache.match(u).then(function (m) { return !!m; }); }));
    }).then(function (results) {
      var textEl2 = document.getElementById("settings-audio-status-text");
      var trackEl = document.getElementById("settings-audio-progress");
      var fillEl = document.getElementById("settings-audio-progress-fill");
      if (!textEl2 || !trackEl || !fillEl) return; // left Settings meanwhile
      var done = results.filter(Boolean).length;
      var total = urls.length;
      if (done >= total) {
        textEl2.textContent = "Sagaleen hundi (" + total + ") bilbila kee irratti jira — interneeta malees ni dhaggeeffatama.";
        trackEl.hidden = true;
        return;
      }
      var pct = total ? Math.round((done / total) * 100) : 0;
      textEl2.textContent = "Sagalee ol kaa'aa jira: " + done + "/" + total + " (" + pct + "%)";
      trackEl.hidden = false;
      fillEl.style.width = pct + "%";
      setTimeout(refreshAudioDownloadStatus, 3000);
    }).catch(function () {
      var textEl3 = document.getElementById("settings-audio-status-text");
      if (textEl3) textEl3.textContent = "Haala ol kaa'uu sagalee mirkaneessuu hin dandeenye.";
    });
  }

  function pageSettings() {
    document.title = "Qindaa'ina — Hisnul Muslim";
    var theme = loadTheme();
    var reminderOn = window.RemindersAPI && RemindersAPI.isEnabled();
    var bedtimeOn = window.RemindersAPI && RemindersAPI.isBedtimeEnabled();
    var bedtimeTime = window.RemindersAPI ? RemindersAPI.bedtimeTime() : "22:00";
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
          '<p>Kitaabni <a href="https://islamhouse.com" target="_blank" rel="noreferrer" class="link">islamhouse.com</a> irraa kan Afaan Oromootiin PDF hiikkamte irraa hojjatame.</p>' +
          '<p>Kan hiike: <strong>Gaalii Abbaaboor Abbaaguumaa</strong>. Gulaala: <strong>Ustaz Jamaal Muhammad Ahmad</strong>.</p>' +
          '<p>Audio immoo <a href="https://archive.org" target="_blank" rel="noreferrer" class="link">archive.org</a> irraahi.</p>' +
          '<p>App kan hojjate <strong>Feeysal Musxafaa</strong>ti.</p>' +
          '<p style="color:var(--muted-foreground);">Yaada yoo qabaattan email armaan gadii kanaan na qunnamaa.</p>' +
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
        '<div class="reminder-divider">' +
          '<p class="page-sub">Yeroo hirribaatti seentanitti (Zikriiwwan hirribaa) beeksisa siif erga — sa\'aatii ofii keessan filadhaa.</p>' +
          '<input type="time" id="settings-bedtime-time" class="bedtime-time-input" value="' + esc(bedtimeTime) + '">' +
          '<button class="font-reset" id="settings-bedtime-toggle" data-on="' + (bedtimeOn ? "1" : "0") + '" style="margin-top:0.75rem;">' +
            (bedtimeOn ? "Yaadachiisa hirribaa dhaamsi" : "Yaadachiisa hirribaa banii") +
          "</button>" +
          '<p class="reminder-status" id="settings-bedtime-status" style="margin-top:0.5rem;color:var(--muted-foreground);font-size:0.85rem;">' + esc(bedtimeStatusText()) + "</p>" +
        "</div>" +
      "</section>" +

      '<section class="glass settings-section" id="settings-audio-status">' +
        '<div class="settings-section-head">' + icon("download", 16) + "<span>Sagalee Offline</span></div>" +
        '<p class="page-sub" id="settings-audio-status-text" style="margin-top:0.5rem;">Sakatta\'aa jira…</p>' +
        '<div class="audio-progress-track" id="settings-audio-progress" hidden><div class="audio-progress-fill" id="settings-audio-progress-fill"></div></div>' +
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

    var bedtimeInput = document.getElementById("settings-bedtime-time");
    if (bedtimeInput && window.RemindersAPI) bedtimeInput.addEventListener("change", function () {
      if (!bedtimeInput.value) return;
      RemindersAPI.setBedtimeTime(bedtimeInput.value);
      var status = document.getElementById("settings-bedtime-status");
      if (status) status.textContent = bedtimeStatusText();
    });

    var bedtimeBtn = document.getElementById("settings-bedtime-toggle");
    if (bedtimeBtn && window.RemindersAPI) bedtimeBtn.addEventListener("click", async function () {
      var status = document.getElementById("settings-bedtime-status");
      if (bedtimeBtn.getAttribute("data-on") === "1") {
        RemindersAPI.disableBedtime();
        navigate(location.hash, true);
        return;
      }
      bedtimeBtn.disabled = true;
      var res = await RemindersAPI.enableBedtime();
      bedtimeBtn.disabled = false;
      if (res.ok) {
        navigate(location.hash, true);
      } else if (status) {
        status.textContent = reminderErrorText(res.reason);
      }
    });

    refreshAudioDownloadStatus();
  }

  // ---------------- Router ----------------
  function parseHash() {
    var hash = location.hash.replace(/^#/, "") || "/home";
    var qIdx = hash.indexOf("?");
    var query = "";
    if (qIdx !== -1) { query = decodeURIComponent(hash.slice(qIdx + 1)); hash = hash.slice(0, qIdx); }
    var parts = hash.split("/").filter(Boolean);
    return { parts: parts, query: query, hash: hash };
  }

  function navigate() {
    stopChapterAudio();
    stopTasbihAudio();
    if (sagaleeState) { sagaleeState.destroy(); sagaleeState = null; }
    if (homeState) { homeState.destroy(); homeState = null; }
    var r = parseHash();
    var html = "";
    if (r.parts[0] === "home") html = pageHome();
    else if (r.parts[0] === "categories" || r.parts.length === 0) html = pageCategories();
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
    // A new service worker taking over (after a deploy) doesn't retroactively
    // update the JS already running in this tab — someone who leaves the app
    // open across a deploy stays on old code indefinitely, silently drifting
    // out of sync with a fresh visit until they happen to fully reload.
    // Reload once, automatically, the moment the new worker takes control.
    var refreshingForNewWorker = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (refreshingForNewWorker) return;
      refreshingForNewWorker = true;
      location.reload();
    });
  }
})();
