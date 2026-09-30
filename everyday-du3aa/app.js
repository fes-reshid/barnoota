(function () {
  "use strict";

  var LS_SETTINGS = "edu3aa:settings";
  var LS_KNOWN = "edu3aa:known";
  var LS_OVERRIDES = "edu3aa:overrides";

  var DEFAULT_SETTINGS = {
    showTranslit: true,
    showTranslation: true,
    showBenefit: true,
    lang: "en",
    arabicFont: "amiri",
    borderTheme: "playful",
    printSize: "flashcard",
    orientation: "portrait",
    drawing: false,
    fontScale: 1
  };

  var state = {
    data: null,
    settings: loadSettings(),
    known: loadKnown(),
    overrides: loadOverrides(),
    route: { view: "home", cat: null, chapter: null, dua: null },
    memorize: { queue: [], pos: 0, revealed: false, shuffle: true, scope: "" },
    printPreview: { pairs: [] }
  };

  function loadSettings() {
    try {
      var raw = localStorage.getItem(LS_SETTINGS);
      if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_SETTINGS, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }
  function saveSettings() {
    try { localStorage.setItem(LS_SETTINGS, JSON.stringify(state.settings)); } catch (e) {}
  }
  function loadKnown() {
    try {
      var raw = localStorage.getItem(LS_KNOWN);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) { return new Set(); }
  }
  function saveKnown() {
    try { localStorage.setItem(LS_KNOWN, JSON.stringify(Array.from(state.known))); } catch (e) {}
  }
  function loadOverrides() {
    try {
      var raw = localStorage.getItem(LS_OVERRIDES);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveOverrides() {
    try { localStorage.setItem(LS_OVERRIDES, JSON.stringify(state.overrides)); } catch (e) {}
  }
  function effectiveDua(dua) {
    var o = state.overrides[dua.id];
    if (!o || !Object.keys(o).length) return dua;
    var merged = Object.assign({}, dua, o);
    if (o.translation) merged.translation = Object.assign({}, dua.translation, o.translation);
    return merged;
  }
  function setOverrideField(duaId, field, lang, value) {
    var o = state.overrides[duaId] || (state.overrides[duaId] = {});
    if (field === "translation") {
      o.translation = o.translation || {};
      o.translation[lang] = value;
    } else {
      o[field] = value;
    }
    saveOverrides();
  }
  function clearOverride(duaId) {
    delete state.overrides[duaId];
    saveOverrides();
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function findChapter(id) {
    return state.data.chapters.find(function (c) { return c.id === id; });
  }
  function findDua(id) {
    for (var i = 0; i < state.data.chapters.length; i++) {
      var ch = state.data.chapters[i];
      for (var j = 0; j < ch.duas.length; j++) {
        if (ch.duas[j].id === id) return { chapter: ch, dua: ch.duas[j] };
      }
    }
    return null;
  }
  function chaptersInCategory(key) {
    return state.data.chapters.filter(function (c) { return c.category === key; });
  }
  function categoryMeta(key) {
    return state.data.categories.find(function (c) { return c.key === key; });
  }

  // ---------------- Routing ----------------
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("?")[0].split("/").filter(Boolean);
    var qs = new URLSearchParams((h.split("?")[1] || ""));
    if (qs.get("lang")) state.settings.lang = qs.get("lang");
    if (qs.get("translit")) state.settings.showTranslit = qs.get("translit") === "1";
    if (qs.get("translation")) state.settings.showTranslation = qs.get("translation") === "1";

    if (parts[0] === "c" && parts[1]) return { view: "category", cat: parts[1] };
    if (parts[0] === "ch" && parts[1]) return { view: "chapter", chapter: Number(parts[1]) };
    if (parts[0] === "dua" && parts[1]) return { view: "dua", dua: Number(parts[1]) };
    if (parts[0] === "memorize") return { view: "memorize", cat: parts[1] || "all" };
    if (parts[0] === "search" && parts[1]) return { view: "search", q: decodeURIComponent(parts[1]) };
    if (parts[0] === "kids") return { view: "kids" };
    return { view: "home" };
  }
  function go(hash) { location.hash = hash; }
  window.addEventListener("hashchange", function () { state.route = parseHash(); render(); });

  // ---------------- Rendering ----------------
  var mount = null;

  function render() {
    if (!state.data) return;
    applySettingsToDom();
    var r = state.route;
    if (r.view === "category") renderCategory(r.cat);
    else if (r.view === "chapter") renderChapter(r.chapter);
    else if (r.view === "dua") renderSingleDua(r.dua);
    else if (r.view === "memorize") renderMemorize(r.cat);
    else if (r.view === "search") renderSearch(r.q);
    else if (r.view === "kids") renderKids();
    else renderHome();
    window.scrollTo(0, 0);
  }

  function applySettingsToDom() {
    var s = state.settings;
    var root = document.documentElement;
    root.setAttribute("data-arabic-font", s.arabicFont);
    root.setAttribute("data-border-theme", s.borderTheme);
    root.setAttribute("data-print-size", s.printSize);
    root.setAttribute("data-orientation", s.orientation);
    root.setAttribute("data-drawing", s.drawing ? "on" : "off");
    root.style.setProperty("--font-scale", s.fontScale);
    var pageStyle = document.getElementById("pageSizeStyle");
    if (pageStyle) pageStyle.textContent = "@page{ size: A4 " + (s.orientation === "landscape" ? "landscape" : "portrait") + "; }";
    // The main settings panel ("optX" ids) and the print preview's toolbar
    // ("ppOptX" ids) are two separate control sets mirroring the same state.
    ["opt", "ppOpt"].forEach(function (p) {
      setVal(p + "Lang", s.lang);
      setChecked(p + "Translit", s.showTranslit);
      setChecked(p + "Translation", s.showTranslation);
      setChecked(p + "Benefit", s.showBenefit);
      setVal(p + "ArabicFont", s.arabicFont);
      setVal(p + "BorderTheme", s.borderTheme);
      setVal(p + "PrintSize", s.printSize);
      setVal(p + "Orientation", s.orientation);
      setChecked(p + "Drawing", s.drawing);
      setVal(p + "FontScale", s.fontScale);
    });
  }
  function setVal(id, v) { var el = document.getElementById(id); if (el) el.value = v; }
  function setChecked(id, v) { var el = document.getElementById(id); if (el) el.checked = v; }

  function crumbs(list) {
    return '<nav class="crumbs">' + list.map(function (c, i) {
      return i < list.length - 1
        ? '<a href="' + c.href + '">' + esc(c.label) + "</a>"
        : '<span aria-current="page">' + esc(c.label) + "</span>";
    }).join('<span class="crumb-sep">/</span>') + "</nav>";
  }

  // Cosmetic-only grouping of the data categories into "chapters" for the
  // home page's journey layout, mirroring My Salah Adventure's home screen.
  var HOME_CHAPTERS = [
    { title: "Everyday Routine", hint: "Wake, sleep, wash and eat with a du’a", keys: ["wake", "sleep", "purify", "home", "food"] },
    { title: "Prayer & Protection", hint: "Remembrance, hardship and refuge", keys: ["salah", "distress", "remembrance"] },
    { title: "Life’s Big Moments", hint: "Children, marriage, sickness and Ḥajj", keys: ["children", "marriage", "sickness", "hajj"] },
    { title: "Out in the World", hint: "Travel, weather, people and feelings", keys: ["travel", "nature", "social", "speech", "feelings"] }
  ];
  var TINTS = ["#d4f4df", "#dbf3fc", "#ffefce", "#e4e5ff", "#ffdfdc", "#dbf4ec", "#fae9ce", "#e8dcfa", "#dbf0ff", "#ffe1e4", "#daf4df", "#fde2c8"];

  function renderHome() {
    var cats = state.data.categories;
    var total = state.data.meta.duaCount;
    var known = state.known.size;
    var pct = total ? Math.round((known / total) * 100) : 0;
    var html = "";

    html += '<section class="home-hero">';
    html += '<div class="hero-copy">';
    html += '<span class="eyebrow">DIIN ISLAAM · EVERYDAY DU’A</span>';
    html += '<h1>Everyday Du’a Adventure<span dir="rtl" lang="ar">أذكار المسلم اليومية</span></h1>';
    html += '<p>All ' + total + ' du’as from <em>Hisnul Muslim</em>, one everyday moment at a time. '
      + 'Add transliteration and a translation, memorize with flip-cards, then print a flashcard deck, a wall poster '
      + 'or even a certificate — with your own edits and choice of border.</p>';
    html += '<a class="primary" href="#/kids">' + (known ? "Continue my journey" : "Start the journey") + " →</a>";
    html += "</div>";
    html += '<div class="hero-stage"><div class="hero-arch"></div><div class="hero-emoji" aria-hidden="true">🤲</div>'
      + '<span class="hero-spark a">✦</span><span class="hero-spark b">✧</span></div>';
    html += "</section>";

    html += '<section class="progress-panel" aria-label="Memorize progress">'
      + '<div class="progress-ring" style="--progress:' + pct + '%"><strong>' + pct + "%</strong></div>"
      + "<div><h2>" + (known === 0 ? "Your memorize journey starts here" : known >= total ? "Every du’a memorized — masha’Allah!" : "Your journey continues") + "</h2>"
      + "<p>" + known + " of " + total + " du’as marked memorized" + (known < total ? " · keep going" : "") + ".</p></div>"
      + '<div class="star-count">✅ ' + known + "</div>"
      + "</section>";

    html += '<form class="search-row" id="searchForm">'
      + '<input type="search" id="searchInput" placeholder="Search — e.g. ‘sleep’, ‘travel’, ‘rain’…" aria-label="Search du’as">'
      + '<button class="btn btn-primary" type="submit">Search</button>'
      + "</form>";

    html += '<div class="kids-strip">';
    html += '<div class="kids-strip-head"><h2>👶 Kids’ Daily Essentials</h2><a href="#/kids">See all &amp; print →</a></div>';
    html += '<div class="kids-tiles">';
    state.data.kidsEssentials.forEach(function (k) {
      html += '<a class="kids-tile" href="#/dua/' + k.id + '">'
        + '<span class="kids-tile-icon" aria-hidden="true">' + k.icon + "</span>"
        + '<span class="kids-tile-label">' + esc(k.label) + "</span>"
        + "</a>";
    });
    html += "</div></div>";

    html += '<div class="journey-title"><span class="eyebrow">CHOOSE A TOPIC</span><h2>Browse every du’a</h2>'
      + "<p>Tap any topic to explore its du’as, memorize them, or print a set.</p></div>";

    var tintIndex = 0;
    HOME_CHAPTERS.forEach(function (chap, ci) {
      html += '<section class="chapter"><div class="chapter-heading"><span>Chapter ' + (ci + 1) + " · " + esc(chap.title) + "</span><small>" + esc(chap.hint) + "</small></div>";
      html += '<div class="journey-grid">';
      chap.keys.forEach(function (key) {
        var c = cats.find(function (cc) { return cc.key === key; });
        if (!c) return;
        var chapters = chaptersInCategory(c.key);
        var duaCount = chapters.reduce(function (n, ch) { return n + ch.duas.length; }, 0);
        var tint = TINTS[tintIndex % TINTS.length]; tintIndex++;
        html += '<a class="journey-card" href="#/c/' + c.key + '" style="--tint:' + tint + '">'
          + '<div class="journey-art">' + c.icon + "</div>"
          + '<h3>' + esc(c.label) + "</h3>"
          + '<div class="journey-footer"><span>' + chapters.length + " topics</span><b>" + duaCount + " du’as</b></div>"
          + "</a>";
      });
      html += "</div></section>";
    });

    html += '<div class="home-note"><span>🎨</span><p>'
      + '<button type="button" class="link-btn" id="openSettingsHero">Open print &amp; language settings</button> to change the Arabic font, '
      + "card border (including a bold Certificate style), print size and orientation — or edit any du’a’s text right "
      + "before you print it.</p></div>";

    mount.innerHTML = html;
    bindHomeEvents();
  }

  function bindHomeEvents() {
    var f = document.getElementById("searchForm");
    if (f) f.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = document.getElementById("searchInput").value.trim();
      if (q) go("#/search/" + encodeURIComponent(q));
    });
    var btn = document.getElementById("openSettingsHero");
    if (btn) btn.addEventListener("click", openSettings);
  }

  function renderSearch(q) {
    var needle = (q || "").toLowerCase();
    var hits = [];
    state.data.chapters.forEach(function (ch) {
      var chapterHit = ch.title.toLowerCase().indexOf(needle) !== -1;
      ch.duas.forEach(function (d) {
        var hay = (d.translation.en || "") + " " + (d.translation.om || "") + " " + (d.transliteration || "");
        if (chapterHit || hay.toLowerCase().indexOf(needle) !== -1) {
          hits.push({ chapter: ch, dua: d });
        }
      });
    });
    var html = crumbs([{ href: "#/", label: "Home" }, { label: "Search: “" + q + "”" }]);
    html += "<h1>" + hits.length + " result" + (hits.length === 1 ? "" : "s") + ' for “' + esc(q) + '”</h1>';
    if (!hits.length) html += '<p class="muted">Try another word, or <a href="#/">browse by topic</a>.</p>';
    html += '<div class="dua-list">' + hits.map(function (h) { return duaCardHTML(h.chapter, h.dua); }).join("") + "</div>";
    mount.innerHTML = html;
    bindCardEvents();
  }

  function renderCategory(key) {
    var meta = categoryMeta(key);
    if (!meta) { go("#/"); return; }
    var chapters = chaptersInCategory(key);
    var html = crumbs([{ href: "#/", label: "Home" }, { label: meta.label }]);
    html += '<h1>' + meta.icon + " " + esc(meta.label) + "</h1>";
    html += '<div class="cat-actions"><a class="btn btn-ghost" href="#/memorize/' + key + '">🧠 Memorize this topic</a>'
      + '<button class="btn btn-ghost" type="button" data-print-cat="' + key + '">🖨️ Print whole topic</button></div>';
    html += '<div class="chapter-grid">';
    chapters.forEach(function (ch) {
      html += '<a class="chapter-card" href="#/ch/' + ch.id + '">'
        + '<span class="chapter-num">' + ch.id + "</span>"
        + '<span class="chapter-title">' + esc(ch.title) + "</span>"
        + '<span class="chapter-count">' + ch.duas.length + (ch.duas.length === 1 ? " du’a" : " du’as") + "</span>"
        + "</a>";
    });
    html += "</div>";
    mount.innerHTML = html;
    var printBtn = mount.querySelector("[data-print-cat]");
    if (printBtn) printBtn.addEventListener("click", function () { printCategory(key); });
  }

  function renderChapter(id) {
    var ch = findChapter(id);
    if (!ch) { go("#/"); return; }
    var meta = categoryMeta(ch.category);
    var html = crumbs([
      { href: "#/", label: "Home" },
      { href: "#/c/" + ch.category, label: meta ? meta.label : "Topics" },
      { label: ch.title }
    ]);
    html += '<h1>' + esc(ch.title) + "</h1>";
    html += '<div class="cat-actions">'
      + '<a class="btn btn-ghost" href="#/memorize/ch' + ch.id + '">🧠 Memorize this</a>'
      + '<button class="btn btn-ghost" type="button" id="printChapterBtn">🖨️ Print this topic</button>'
      + '<button class="btn btn-ghost" type="button" id="shareChapterBtn">🔗 Share</button>'
      + "</div>";
    html += '<div class="dua-list">' + ch.duas.map(function (d) { return duaCardHTML(ch, d); }).join("") + "</div>";
    mount.innerHTML = html;
    bindCardEvents();
    document.getElementById("printChapterBtn").addEventListener("click", function () { printChapter(ch.id); });
    document.getElementById("shareChapterBtn").addEventListener("click", function () {
      shareLink(ch.title, location.origin + location.pathname + "#/ch/" + ch.id);
    });
  }

  function renderSingleDua(id) {
    var found = findDua(id);
    if (!found) { go("#/"); return; }
    var meta = categoryMeta(found.chapter.category);
    var html = crumbs([
      { href: "#/", label: "Home" },
      { href: "#/c/" + found.chapter.category, label: meta ? meta.label : "Topics" },
      { href: "#/ch/" + found.chapter.id, label: found.chapter.title },
      { label: "Du’a" }
    ]);
    html += '<div class="single-wrap"><div class="dua-list">' + duaCardHTML(found.chapter, found.dua) + "</div></div>";
    mount.innerHTML = html;
    bindCardEvents();
  }

  function renderKids() {
    var items = state.data.kidsEssentials.map(function (k) {
      var found = findDua(k.id);
      return { k: k, chapter: found.chapter, dua: found.dua };
    });
    var html = crumbs([{ href: "#/", label: "Home" }, { label: "Kids’ Daily Essentials" }]);
    html += "<h1>👶 Kids’ Daily Essentials</h1>";
    html += '<p class="lead" style="margin:0 0 18px;text-align:left;max-width:none;">Nine short du’as for a child’s day, in order — '
      + 'waking up, morning &amp; evening, before and after eating, the toilet, leaving and entering the house, and before sleeping. '
      + 'Print the whole set as a flashcard deck or as one poster per du’a.</p>';
    html += '<div class="cat-actions">'
      + '<a class="btn btn-ghost" href="#/memorize/kids">🧠 Memorize this set</a>'
      + '<button class="btn btn-ghost" type="button" id="printKidsBtn">🖨️ Print this set</button>'
      + "</div>";
    html += '<div class="dua-list">' + items.map(function (it, i) {
      return '<div class="kids-step"><span class="kids-step-num">' + (i + 1) + "</span>" + duaCardHTML(it.chapter, it.dua, it.k.label) + "</div>";
    }).join("") + "</div>";
    mount.innerHTML = html;
    bindCardEvents();
    document.getElementById("printKidsBtn").addEventListener("click", printKidsSet);
  }

  function duaCardHTML(chapter, rawDua, overrideLabel) {
    var s = state.settings;
    var dua = effectiveDua(rawDua);
    var edited = state.overrides[rawDua.id] && Object.keys(state.overrides[rawDua.id]).length;
    var transText = dua.translation ? dua.translation[s.lang] : null;
    var fallback = !transText && s.lang !== "en" ? dua.translation.en : null;
    var known = state.known.has(dua.id);
    var repeatBadge = dua.repeat > 1 ? '<span class="badge-repeat">🔁 ×' + dua.repeat + "</span>" : "";
    var html = '<article class="dua-card" data-dua-id="' + dua.id + '" data-chapter-id="' + chapter.id + '">';
    html += '<header class="dua-card-head">'
      + '<span class="dua-card-chapter">' + esc(overrideLabel || chapter.title) + "</span>"
      + (edited ? '<span class="edited-badge" title="You’ve edited this du’a’s text">✏️ edited</span>' : "")
      + repeatBadge
      + "</header>";
    if (dua.arabic) {
      html += '<p class="dua-arabic arabic" dir="rtl" lang="ar">' + esc(dua.arabic) + "</p>";
    }
    if (dua.note) {
      html += '<p class="dua-note">📖 ' + esc(dua.note) + "</p>";
    }
    html += '<div class="dua-translit-wrap"' + (s.showTranslit && dua.transliteration ? "" : ' style="display:none"') + '>'
      + '<p class="dua-translit">' + esc(dua.transliteration || "") + "</p></div>";
    var showT = s.showTranslation && (transText || fallback);
    html += '<div class="dua-translation-wrap"' + (showT ? "" : ' style="display:none"') + '>'
      + '<p class="dua-translation">' + esc(transText || fallback || "") + "</p>"
      + (fallback ? '<p class="dua-lang-note">Not yet translated to ' + esc(langLabel(s.lang)) + " — showing English.</p>" : "")
      + "</div>";
    if (dua.benefit && s.showBenefit) {
      html += '<p class="dua-benefit">💡 <strong>Why we say this:</strong> ' + esc(dua.benefit) + "</p>";
    }
    html += '<div class="drawing-box" aria-hidden="true"><span class="drawing-label">✏️ Draw a picture</span></div>';
    html += '<footer class="dua-card-foot">'
      + '<span class="dua-source">Hisnul Muslim · Ch. ' + chapter.id + "</span>"
      + '<span class="dua-actions">'
      + '<button type="button" class="icon-btn" data-act="known" title="Mark as memorized" aria-pressed="' + known + '">' + (known ? "✅" : "⚪") + "</button>"
      + '<button type="button" class="icon-btn" data-act="print" title="Print this card">🖨️</button>'
      + '<button type="button" class="icon-btn" data-act="share" title="Share this card">🔗</button>'
      + "</span></footer>";
    html += "</article>";
    return html;
  }

  function langLabel(code) {
    return code === "om" ? "Afaan Oromoo" : code === "en" ? "English" : code;
  }

  function bindCardEvents() {
    mount.querySelectorAll(".dua-card").forEach(function (card) {
      var duaId = Number(card.getAttribute("data-dua-id"));
      card.querySelectorAll("[data-act]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var act = btn.getAttribute("data-act");
          if (act === "known") {
            if (state.known.has(duaId)) state.known.delete(duaId); else state.known.add(duaId);
            saveKnown();
            btn.textContent = state.known.has(duaId) ? "✅" : "⚪";
            btn.setAttribute("aria-pressed", state.known.has(duaId));
          } else if (act === "print") {
            printDua(duaId);
          } else if (act === "share") {
            shareLink("Du’a — Everyday Du’a", location.origin + location.pathname + "#/dua/" + duaId);
          }
        });
      });
    });
  }

  // ---------------- Memorize mode ----------------
  function renderMemorize(scope) {
    var pool = [];
    if (scope === "all") {
      state.data.chapters.forEach(function (ch) { ch.duas.forEach(function (d) { pool.push({ chapter: ch, dua: d }); }); });
    } else if (scope === "kids") {
      state.data.kidsEssentials.forEach(function (k) {
        var found = findDua(k.id);
        if (found) pool.push({ chapter: found.chapter, dua: found.dua, label: k.label });
      });
    } else if (scope && /^ch\d+$/.test(scope)) {
      var ch = findChapter(Number(scope.slice(2)));
      if (ch) ch.duas.forEach(function (d) { pool.push({ chapter: ch, dua: d }); });
    } else {
      chaptersInCategory(scope).forEach(function (ch) { ch.duas.forEach(function (d) { pool.push({ chapter: ch, dua: d }); }); });
    }
    if (!pool.length) { go("#/"); return; }
    if (state.memorize.scope !== scope) {
      state.memorize.scope = scope;
      state.memorize.queue = pool;
      if (state.memorize.shuffle) shuffle(state.memorize.queue);
      state.memorize.pos = 0;
      state.memorize.revealed = false;
    }
    renderMemorizeCard();
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
  }

  function renderMemorizeCard() {
    var m = state.memorize;
    var item = m.queue[m.pos];
    var dua = effectiveDua(item.dua);
    var meta = categoryMeta(item.chapter.category);
    var s = state.settings;
    var transText = dua.translation[s.lang] || dua.translation.en || "";
    var known = state.known.has(item.dua.id);
    var html = crumbs([{ href: "#/", label: "Home" }, { label: "Memorize" }]);
    html += '<div class="memorize-wrap">';
    html += '<div class="memorize-progress">Card ' + (m.pos + 1) + " of " + m.queue.length
      + ' · <span class="muted">' + (meta ? meta.icon + " " + esc(meta.label) : "") + "</span>"
      + '<label class="shuffle-toggle"><input type="checkbox" id="shuffleToggle" ' + (m.shuffle ? "checked" : "") + '> Shuffle</label>'
      + "</div>";
    html += '<div class="memorize-prompt">' + esc(item.label || item.chapter.title) + "</div>";
    html += '<div class="memorize-card' + (m.revealed ? " is-revealed" : "") + '" id="memCard" data-dua-id="' + item.dua.id + '">';
    html += '<p class="dua-arabic arabic" dir="rtl" lang="ar">' + esc(dua.arabic || "") + "</p>";
    html += '<div class="memorize-back">';
    if (s.showTranslit && dua.transliteration) html += '<p class="dua-translit">' + esc(dua.transliteration) + "</p>";
    if (s.showTranslation && transText) html += '<p class="dua-translation">' + esc(transText) + "</p>";
    if (s.showBenefit && dua.benefit) html += '<p class="dua-benefit">💡 ' + esc(dua.benefit) + "</p>";
    html += "</div>";
    html += '<p class="memorize-hint">' + (m.revealed ? "Tap card to hide again" : "Tap card to reveal") + "</p>";
    html += "</div>";
    html += '<div class="memorize-actions">'
      + '<button class="btn btn-ghost" type="button" id="memPrev" ' + (m.pos === 0 ? "disabled" : "") + '>← Back</button>'
      + '<button class="btn btn-ghost" type="button" id="memStillLearning">😕 Still learning</button>'
      + '<button class="btn btn-primary" type="button" id="memKnowIt">' + (known ? "✅ Memorized" : "I know this ✓") + "</button>"
      + '<button class="btn btn-ghost" type="button" id="memNext">Next →</button>'
      + "</div>";
    html += '<p class="memorize-stats muted">' + state.known.size + ' du’a' + (state.known.size === 1 ? "" : "s") + " marked memorized so far.</p>";
    html += "</div>";
    mount.innerHTML = html;

    document.getElementById("memCard").addEventListener("click", function () {
      m.revealed = !m.revealed;
      renderMemorizeCard();
    });
    document.getElementById("shuffleToggle").addEventListener("change", function (e) {
      m.shuffle = e.target.checked;
      if (m.shuffle) { shuffle(m.queue); m.pos = 0; m.revealed = false; renderMemorizeCard(); }
    });
    document.getElementById("memPrev").addEventListener("click", function () {
      if (m.pos > 0) { m.pos--; m.revealed = false; renderMemorizeCard(); }
    });
    document.getElementById("memNext").addEventListener("click", function () { advanceMemorize(); });
    document.getElementById("memStillLearning").addEventListener("click", function () {
      state.known.delete(item.dua.id); saveKnown(); advanceMemorize();
    });
    document.getElementById("memKnowIt").addEventListener("click", function () {
      state.known.add(item.dua.id); saveKnown(); advanceMemorize();
    });
  }

  function advanceMemorize() {
    var m = state.memorize;
    if (m.pos < m.queue.length - 1) { m.pos++; m.revealed = false; renderMemorizeCard(); }
    else {
      mount.innerHTML = crumbs([{ href: "#/", label: "Home" }, { label: "Memorize" }])
        + '<div class="memorize-done"><h1>🎉 Session complete</h1>'
        + '<p>You went through all ' + m.queue.length + ' du’as in this set.</p>'
        + '<div class="hero-actions"><a class="btn btn-primary" href="#/">Back to topics</a> '
        + '<button class="btn btn-ghost" type="button" id="memAgain">Go again</button></div></div>';
      document.getElementById("memAgain").addEventListener("click", function () {
        m.pos = 0; m.revealed = false;
        if (m.shuffle) shuffle(m.queue);
        renderMemorizeCard();
      });
    }
  }

  // ---------------- Share ----------------
  function shareLink(title, url) {
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied to clipboard"); });
    } else {
      window.prompt("Copy this link:", url);
    }
  }
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  // ---------------- Print ----------------
  function buildPrintCards(pairs) {
    var area = document.getElementById("printArea");
    area.innerHTML = pairs.map(function (p) { return printCardHTML(p.chapter, p.dua, p.label); }).join("");
  }
  // editIndex is null for a real print card, or the pair's index in
  // state.printPreview.pairs when rendering it inside the editable preview.
  function printCardHTML(chapter, rawDua, overrideLabel, editIndex) {
    var s = state.settings;
    var dua = effectiveDua(rawDua);
    var editable = editIndex != null;
    var transText = dua.translation[s.lang] || dua.translation.en || "";
    var repeatBadge = dua.repeat > 1 ? '<span class="badge-repeat">🔁 ×' + dua.repeat + "</span>" : "";
    function editAttrs(field, extra) {
      if (!editable) return "";
      return ' contenteditable="true" data-pp-field="' + field + '" data-pp-index="' + editIndex + '"'
        + (extra || "") + ' title="Click to edit — saved on this device only"';
    }
    var editClass = editable ? " pp-editable" : "";
    var html = '<div class="print-card">';
    html += '<div class="print-card-inner">';
    html += '<div class="print-corners"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span></div>';
    html += '<div class="print-seal" aria-hidden="true"><span>۞</span></div>';
    html += '<header class="dua-card-head"><span class="dua-card-chapter">' + esc(overrideLabel || chapter.title) + "</span>" + repeatBadge + "</header>";
    if (dua.arabic || editable) {
      html += '<p class="dua-arabic arabic' + editClass + '" dir="rtl" lang="ar"' + editAttrs("arabic") + ">" + esc(dua.arabic || "") + "</p>";
    }
    if (dua.note) html += '<p class="dua-note">📖 ' + esc(dua.note) + "</p>";
    if (s.showTranslit && (dua.transliteration || editable)) {
      html += '<p class="dua-translit' + editClass + '"' + editAttrs("transliteration") + ">" + esc(dua.transliteration || "") + "</p>";
    }
    if (s.showTranslation && (transText || editable)) {
      html += '<p class="dua-translation' + editClass + '"' + editAttrs("translation", ' data-pp-lang="' + s.lang + '"') + ">" + esc(transText) + "</p>";
    }
    if (s.showBenefit && (dua.benefit || editable)) {
      html += '<p class="dua-benefit">💡 <strong>Why we say this:</strong> <span' + (editable ? ' class="pp-editable"' : "") + editAttrs("benefit") + ">" + esc(dua.benefit || "") + "</span></p>";
    }
    html += '<div class="drawing-box" aria-hidden="true"><span class="drawing-label">✏️ Draw a picture</span></div>';
    html += '<footer class="dua-card-foot"><span class="dua-source">Hisnul Muslim · Ch. ' + chapter.id + " · diinislaam.com/everyday-du3aa</span></footer>";
    html += "</div></div>";
    return html;
  }
  function printDua(id) {
    var found = findDua(id);
    if (!found) return;
    openPrintPreview([{ chapter: found.chapter, dua: found.dua }]);
  }
  function printChapter(id) {
    var ch = findChapter(id);
    if (!ch) return;
    openPrintPreview(ch.duas.map(function (d) { return { chapter: ch, dua: d }; }));
  }
  function printCategory(key) {
    var pairs = [];
    chaptersInCategory(key).forEach(function (ch) {
      ch.duas.forEach(function (d) { pairs.push({ chapter: ch, dua: d }); });
    });
    openPrintPreview(pairs);
  }
  function printKidsSet() {
    var pairs = state.data.kidsEssentials.map(function (k) {
      var found = findDua(k.id);
      return { chapter: found.chapter, dua: found.dua, label: k.label };
    });
    openPrintPreview(pairs);
  }

  // ---------------- Print preview (select, edit, then print) ----------------
  function openPrintPreview(pairs) {
    state.printPreview.pairs = pairs.map(function (p) { return { chapter: p.chapter, dua: p.dua, label: p.label, checked: true }; });
    document.getElementById("printPreviewOverlay").classList.remove("is-hidden");
    applySettingsToDom();
    renderPrintPreviewList();
  }
  function closePrintPreview() {
    document.getElementById("printPreviewOverlay").classList.add("is-hidden");
    render();
  }

  function renderPrintPreviewList() {
    var list = document.getElementById("ppCardList");
    list.innerHTML = state.printPreview.pairs.map(function (pair, i) {
      var edited = state.overrides[pair.dua.id] && Object.keys(state.overrides[pair.dua.id]).length;
      var html = '<div class="pp-card-wrap">';
      html += '<div class="pp-card-tools">'
        + '<label class="pp-check"><input type="checkbox" data-pp-check="' + i + '" ' + (pair.checked ? "checked" : "") + '> Include in print</label>'
        + (edited ? '<button type="button" class="pp-reset" data-pp-reset="' + i + '">↺ Reset edits</button>' : "")
        + "</div>";
      html += printCardHTML(pair.chapter, pair.dua, pair.label, i);
      html += "</div>";
      return html;
    }).join("");
    updatePrintButtonCount();
    bindPrintPreviewCardEvents();
  }
  function updatePrintButtonCount() {
    var count = state.printPreview.pairs.filter(function (p) { return p.checked; }).length;
    document.getElementById("ppPrintBtn").textContent = "🖨️ Print " + count + (count === 1 ? " card" : " cards");
    document.getElementById("ppPrintBtn").disabled = count === 0;
  }

  function bindPrintPreviewCardEvents() {
    var list = document.getElementById("ppCardList");
    list.querySelectorAll("[data-pp-check]").forEach(function (el) {
      el.addEventListener("change", function () {
        var i = Number(el.getAttribute("data-pp-check"));
        state.printPreview.pairs[i].checked = el.checked;
        updatePrintButtonCount();
      });
    });
    list.querySelectorAll("[data-pp-reset]").forEach(function (el) {
      el.addEventListener("click", function () {
        var i = Number(el.getAttribute("data-pp-reset"));
        clearOverride(state.printPreview.pairs[i].dua.id);
        renderPrintPreviewList();
      });
    });
    list.querySelectorAll("[data-pp-field]").forEach(function (el) {
      el.addEventListener("blur", function () {
        var i = Number(el.getAttribute("data-pp-index"));
        var field = el.getAttribute("data-pp-field");
        var lang = el.getAttribute("data-pp-lang");
        var duaId = state.printPreview.pairs[i].dua.id;
        var text = el.textContent.trim();
        setOverrideField(duaId, field, lang, text);
        // Deferred so the browser finishes any in-progress focus change
        // (e.g. tabbing to the next editable field) before we rebuild the DOM.
        setTimeout(renderPrintPreviewList, 0);
      });
    });
  }

  function doPrintFromPreview() {
    var chosen = state.printPreview.pairs.filter(function (p) { return p.checked; });
    if (!chosen.length) return;
    buildPrintCards(chosen);
    window.print();
  }

  // ---------------- Settings panel ----------------
  function openSettings() { document.getElementById("settingsOverlay").classList.remove("is-hidden"); }
  function closeSettings() { document.getElementById("settingsOverlay").classList.add("is-hidden"); }

  // Each entry: settings key, control id suffix ("optLang" -> "optLang"/"ppOptLang"),
  // whether it's a checkbox, and whether changing it needs a full re-render
  // (affects visible text/layout) or just applySettingsToDom (visual-only).
  var SETTINGS_CONTROLS = [
    { key: "lang", suffix: "Lang", checkbox: false, textish: true },
    { key: "showTranslit", suffix: "Translit", checkbox: true, textish: true },
    { key: "showTranslation", suffix: "Translation", checkbox: true, textish: true },
    { key: "showBenefit", suffix: "Benefit", checkbox: true, textish: true },
    { key: "arabicFont", suffix: "ArabicFont", checkbox: false, textish: false },
    { key: "borderTheme", suffix: "BorderTheme", checkbox: false, textish: false },
    { key: "printSize", suffix: "PrintSize", checkbox: false, textish: false },
    { key: "orientation", suffix: "Orientation", checkbox: false, textish: false },
    { key: "drawing", suffix: "Drawing", checkbox: true, textish: false },
    { key: "fontScale", suffix: "FontScale", checkbox: false, textish: false, numeric: true }
  ];

  function bindSettingsControls(idPrefix, afterChange) {
    SETTINGS_CONTROLS.forEach(function (c) {
      var el = document.getElementById(idPrefix + c.suffix);
      if (!el) return;
      el.addEventListener(c.numeric ? "input" : "change", function (e) {
        var value = c.checkbox ? e.target.checked : (c.numeric ? Number(e.target.value) : e.target.value);
        state.settings[c.key] = value;
        // The certificate border is designed as a one-per-page landscape
        // piece, like an actual certificate, so picking it pulls those in too.
        if (c.key === "borderTheme" && value === "certificate") {
          state.settings.printSize = "poster";
          state.settings.orientation = "landscape";
        }
        saveSettings();
        afterChange(c.textish);
      });
    });
  }

  function bindChrome() {
    document.getElementById("settingsBtn").addEventListener("click", openSettings);
    document.getElementById("settingsClose").addEventListener("click", closeSettings);
    document.getElementById("settingsOverlay").addEventListener("click", function (e) {
      if (e.target.id === "settingsOverlay") closeSettings();
    });
    bindSettingsControls("opt", function (textish) {
      if (textish) render(); else applySettingsToDom();
    });
    bindSettingsControls("ppOpt", function () {
      applySettingsToDom();
      renderPrintPreviewList();
    });
    document.getElementById("resetMemorize").addEventListener("click", function () {
      if (confirm("Clear all ‘memorized’ marks on this device?")) {
        state.known = new Set(); saveKnown(); render();
      }
    });

    document.getElementById("ppClose").addEventListener("click", closePrintPreview);
    document.getElementById("ppCancel").addEventListener("click", closePrintPreview);
    document.getElementById("ppPrintBtn").addEventListener("click", doPrintFromPreview);
    document.getElementById("ppResetAll").addEventListener("click", function () {
      if (!confirm("Clear your edits on every du’a in this set?")) return;
      state.printPreview.pairs.forEach(function (p) { clearOverride(p.dua.id); });
      renderPrintPreviewList();
    });

    var menuBtn = document.getElementById("menuBtn");
    var mainNav = document.getElementById("mainNav");
    if (menuBtn) menuBtn.addEventListener("click", function () {
      var open = mainNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
  }

  // ---------------- Boot ----------------
  fetch("data/duas.json").then(function (r) { return r.json(); }).then(function (data) {
    state.data = data;
    mount = document.getElementById("app");
    bindChrome();
    applySettingsToDom();
    state.route = parseHash();
    render();
  }).catch(function (err) {
    document.getElementById("app").innerHTML = '<p class="muted">Could not load the du’a data. Please refresh the page.</p>';
    console.error(err);
  });
})();
