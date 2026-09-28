(function () {
  "use strict";

  var LS_SETTINGS = "edu3aa:settings";
  var LS_KNOWN = "edu3aa:known";

  var DEFAULT_SETTINGS = {
    showTranslit: true,
    showTranslation: true,
    lang: "en",
    arabicFont: "amiri",
    borderTheme: "gold",
    printSize: "flashcard",
    drawing: false,
    fontScale: 1
  };

  var state = {
    data: null,
    settings: loadSettings(),
    known: loadKnown(),
    route: { view: "home", cat: null, chapter: null, dua: null },
    memorize: { queue: [], pos: 0, revealed: false, shuffle: true, scope: "" }
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
    else renderHome();
    window.scrollTo(0, 0);
  }

  function applySettingsToDom() {
    var s = state.settings;
    var root = document.documentElement;
    root.setAttribute("data-arabic-font", s.arabicFont);
    root.setAttribute("data-border-theme", s.borderTheme);
    root.setAttribute("data-print-size", s.printSize);
    root.setAttribute("data-drawing", s.drawing ? "on" : "off");
    root.style.setProperty("--font-scale", s.fontScale);
    var elLang = document.getElementById("optLang");
    var elTranslit = document.getElementById("optTranslit");
    var elTranslation = document.getElementById("optTranslation");
    var elFont = document.getElementById("optArabicFont");
    var elTheme = document.getElementById("optBorderTheme");
    var elSize = document.getElementById("optPrintSize");
    var elDrawing = document.getElementById("optDrawing");
    var elScale = document.getElementById("optFontScale");
    if (elLang) elLang.value = s.lang;
    if (elTranslit) elTranslit.checked = s.showTranslit;
    if (elTranslation) elTranslation.checked = s.showTranslation;
    if (elFont) elFont.value = s.arabicFont;
    if (elTheme) elTheme.value = s.borderTheme;
    if (elSize) elSize.value = s.printSize;
    if (elDrawing) elDrawing.checked = s.drawing;
    if (elScale) elScale.value = s.fontScale;
  }

  function crumbs(list) {
    return '<nav class="crumbs">' + list.map(function (c, i) {
      return i < list.length - 1
        ? '<a href="' + c.href + '">' + esc(c.label) + "</a>"
        : '<span aria-current="page">' + esc(c.label) + "</span>";
    }).join('<span class="crumb-sep">/</span>') + "</nav>";
  }

  function renderHome() {
    var cats = state.data.categories;
    var html = "";
    html += '<div class="hero">';
    html += '<p class="eyebrow">Diin Islaam</p>';
    html += '<h1><span class="arabic" dir="rtl" lang="ar">أذكار المسلم اليومية</span></h1>';
    html += '<h2>Everyday Du’a — Memorize, Print &amp; Stick on the Wall</h2>';
    html += '<p class="lead">All ' + state.data.meta.duaCount + ' supplications from <em>Hisnul Muslim</em> (Fortress of the Muslim), '
      + 'organized by everyday moment. Add transliteration, a translation, and choose a language — '
      + 'then print a flashcard deck, a wall poster, or start a memorize session.</p>';
    html += '<form class="search-row" id="searchForm">'
      + '<input type="search" id="searchInput" placeholder="Search — e.g. ‘sleep’, ‘travel’, ‘rain’…" aria-label="Search du’as">'
      + '<button class="btn btn-primary" type="submit">Search</button>'
      + "</form>";
    html += '<div class="hero-actions">'
      + '<a class="btn btn-ghost" href="#/memorize/all">🧠 Memorize mode</a>'
      + '<button class="btn btn-ghost" type="button" id="openSettingsHero">🎨 Print &amp; language settings</button>'
      + "</div>";
    html += "</div>";

    html += '<div class="cat-grid">';
    cats.forEach(function (c) {
      var chapters = chaptersInCategory(c.key);
      var duaCount = chapters.reduce(function (n, ch) { return n + ch.duas.length; }, 0);
      html += '<a class="cat-card" href="#/c/' + c.key + '">'
        + '<span class="cat-icon" aria-hidden="true">' + c.icon + "</span>"
        + '<span class="cat-label">' + esc(c.label) + "</span>"
        + '<span class="cat-count">' + chapters.length + " topics · " + duaCount + " du’as</span>"
        + "</a>";
    });
    html += "</div>";
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

  function duaCardHTML(chapter, dua) {
    var s = state.settings;
    var transText = dua.translation ? dua.translation[s.lang] : null;
    var fallback = !transText && s.lang !== "en" ? dua.translation.en : null;
    var known = state.known.has(dua.id);
    var repeatBadge = dua.repeat > 1 ? '<span class="badge-repeat">🔁 ×' + dua.repeat + "</span>" : "";
    var html = '<article class="dua-card" data-dua-id="' + dua.id + '" data-chapter-id="' + chapter.id + '">';
    html += '<header class="dua-card-head">'
      + '<span class="dua-card-chapter">' + esc(chapter.title) + "</span>"
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
    } else if (scope && scope.indexOf("ch") === 0) {
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
    var meta = categoryMeta(item.chapter.category);
    var s = state.settings;
    var transText = item.dua.translation[s.lang] || item.dua.translation.en || "";
    var known = state.known.has(item.dua.id);
    var html = crumbs([{ href: "#/", label: "Home" }, { label: "Memorize" }]);
    html += '<div class="memorize-wrap">';
    html += '<div class="memorize-progress">Card ' + (m.pos + 1) + " of " + m.queue.length
      + ' · <span class="muted">' + (meta ? meta.icon + " " + esc(meta.label) : "") + "</span>"
      + '<label class="shuffle-toggle"><input type="checkbox" id="shuffleToggle" ' + (m.shuffle ? "checked" : "") + '> Shuffle</label>'
      + "</div>";
    html += '<div class="memorize-prompt">' + esc(item.chapter.title) + "</div>";
    html += '<div class="memorize-card' + (m.revealed ? " is-revealed" : "") + '" id="memCard" data-dua-id="' + item.dua.id + '">';
    html += '<p class="dua-arabic arabic" dir="rtl" lang="ar">' + esc(item.dua.arabic || "") + "</p>";
    html += '<div class="memorize-back">';
    if (s.showTranslit && item.dua.transliteration) html += '<p class="dua-translit">' + esc(item.dua.transliteration) + "</p>";
    if (s.showTranslation && transText) html += '<p class="dua-translation">' + esc(transText) + "</p>";
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
    area.innerHTML = pairs.map(function (p) { return printCardHTML(p.chapter, p.dua); }).join("");
  }
  function printCardHTML(chapter, dua) {
    var s = state.settings;
    var transText = dua.translation[s.lang] || dua.translation.en || "";
    var repeatBadge = dua.repeat > 1 ? '<span class="badge-repeat">🔁 ×' + dua.repeat + "</span>" : "";
    var html = '<div class="print-card">';
    html += '<div class="print-card-inner">';
    html += '<div class="print-corners"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span></div>';
    html += '<header class="dua-card-head"><span class="dua-card-chapter">' + esc(chapter.title) + "</span>" + repeatBadge + "</header>";
    if (dua.arabic) html += '<p class="dua-arabic arabic" dir="rtl" lang="ar">' + esc(dua.arabic) + "</p>";
    if (dua.note) html += '<p class="dua-note">📖 ' + esc(dua.note) + "</p>";
    if (s.showTranslit && dua.transliteration) html += '<p class="dua-translit">' + esc(dua.transliteration) + "</p>";
    if (s.showTranslation && transText) html += '<p class="dua-translation">' + esc(transText) + "</p>";
    html += '<div class="drawing-box" aria-hidden="true"><span class="drawing-label">✏️ Draw a picture</span></div>';
    html += '<footer class="dua-card-foot"><span class="dua-source">Hisnul Muslim · Ch. ' + chapter.id + " · diinislaam.com/everyday-du3aa</span></footer>";
    html += "</div></div>";
    return html;
  }
  function printDua(id) {
    var found = findDua(id);
    if (!found) return;
    buildPrintCards([{ chapter: found.chapter, dua: found.dua }]);
    window.print();
  }
  function printChapter(id) {
    var ch = findChapter(id);
    if (!ch) return;
    buildPrintCards(ch.duas.map(function (d) { return { chapter: ch, dua: d }; }));
    window.print();
  }
  function printCategory(key) {
    var pairs = [];
    chaptersInCategory(key).forEach(function (ch) {
      ch.duas.forEach(function (d) { pairs.push({ chapter: ch, dua: d }); });
    });
    buildPrintCards(pairs);
    window.print();
  }

  // ---------------- Settings panel ----------------
  function openSettings() { document.getElementById("settingsOverlay").classList.remove("is-hidden"); }
  function closeSettings() { document.getElementById("settingsOverlay").classList.add("is-hidden"); }

  function bindChrome() {
    document.getElementById("settingsBtn").addEventListener("click", openSettings);
    document.getElementById("settingsClose").addEventListener("click", closeSettings);
    document.getElementById("settingsOverlay").addEventListener("click", function (e) {
      if (e.target.id === "settingsOverlay") closeSettings();
    });
    document.getElementById("optLang").addEventListener("change", function (e) {
      state.settings.lang = e.target.value; saveSettings(); render();
    });
    document.getElementById("optTranslit").addEventListener("change", function (e) {
      state.settings.showTranslit = e.target.checked; saveSettings(); render();
    });
    document.getElementById("optTranslation").addEventListener("change", function (e) {
      state.settings.showTranslation = e.target.checked; saveSettings(); render();
    });
    document.getElementById("optArabicFont").addEventListener("change", function (e) {
      state.settings.arabicFont = e.target.value; saveSettings(); applySettingsToDom();
    });
    document.getElementById("optBorderTheme").addEventListener("change", function (e) {
      state.settings.borderTheme = e.target.value; saveSettings(); applySettingsToDom();
    });
    document.getElementById("optPrintSize").addEventListener("change", function (e) {
      state.settings.printSize = e.target.value; saveSettings(); applySettingsToDom();
    });
    document.getElementById("optDrawing").addEventListener("change", function (e) {
      state.settings.drawing = e.target.checked; saveSettings(); applySettingsToDom();
    });
    document.getElementById("optFontScale").addEventListener("input", function (e) {
      state.settings.fontScale = Number(e.target.value); saveSettings(); applySettingsToDom();
    });
    document.getElementById("resetMemorize").addEventListener("click", function () {
      if (confirm("Clear all ‘memorized’ marks on this device?")) {
        state.known = new Set(); saveKnown(); render();
      }
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
