(function () {
  'use strict';

  var STORAGE = {
    favorites: 'hisnul.favorites',
    fontScale: 'hisnul.fontScale',
    theme: 'hisnul.theme',
    showArabic: 'hisnul.showArabic',
    showTranslation: 'hisnul.showTranslation'
  };

  var state = {
    favorites: loadJSON(STORAGE.favorites, []),
    fontScale: parseFloat(localStorage.getItem(STORAGE.fontScale)) || 1,
    theme: localStorage.getItem(STORAGE.theme) || 'parchment',
    showArabic: localStorage.getItem(STORAGE.showArabic) !== '0',
    showTranslation: localStorage.getItem(STORAGE.showTranslation) !== '0',
    activeTab: 'home',
    currentChapter: null
  };

  function loadJSON(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return Array.isArray(v) ? v : fallback;
    } catch (e) { return fallback; }
  }
  function saveFavorites() {
    localStorage.setItem(STORAGE.favorites, JSON.stringify(state.favorites));
  }
  function duaKey(chapterNumber, dua) {
    return chapterNumber + ':' + dua.number;
  }
  function isFavorite(key) {
    return state.favorites.indexOf(key) !== -1;
  }
  function toggleFavorite(key) {
    var idx = state.favorites.indexOf(key);
    if (idx === -1) state.favorites.push(key);
    else state.favorites.splice(idx, 1);
    saveFavorites();
  }

  // ---------- DOM refs ----------
  var el = {
    backBtn: document.getElementById('backBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    topTitle: document.getElementById('topTitle'),
    topSubtitle: document.getElementById('topSubtitle'),
    screens: {
      home: document.getElementById('screenHome'),
      chapter: document.getElementById('screenChapter'),
      favorites: document.getElementById('screenFavorites'),
      intro: document.getElementById('screenIntro')
    },
    chapterList: document.getElementById('chapterList'),
    chapCount: document.getElementById('chapCount'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    chapterListWrap: document.getElementById('chapterListWrap'),
    chapterAr: document.getElementById('chapterAr'),
    chapterOm: document.getElementById('chapterOm'),
    duaList: document.getElementById('duaList'),
    favList: document.getElementById('favList'),
    favEmpty: document.getElementById('favEmpty'),
    introBody: document.getElementById('introBody'),
    introBtn: document.getElementById('introBtn'),
    navBtns: Array.prototype.slice.call(document.querySelectorAll('.nav-btn, .qbtn[data-tab]')),
    settingsPanel: document.getElementById('settingsPanel'),
    settingsClose: document.getElementById('settingsClose'),
    fontMinus: document.getElementById('fontMinus'),
    fontPlus: document.getElementById('fontPlus'),
    fontReadout: document.getElementById('fontReadout'),
    swatches: Array.prototype.slice.call(document.querySelectorAll('.swatch')),
    arabicToggle: document.getElementById('arabicToggle'),
    translationToggle: document.getElementById('translationToggle')
  };

  // ---------- Rendering helpers ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    var escaped = escapeHtml(text);
    var q = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp('(' + q + ')', 'ig'), '<mark>$1</mark>');
  }

  function duaCardHTML(chapter, dua, opts) {
    opts = opts || {};
    var key = duaKey(chapter.number, dua);
    var fav = isFavorite(key);
    var q = opts.query || '';
    var showChapterTag = !!opts.showChapterTag;

    var html = '<div class="dua-card" data-key="' + key + '">';
    if (showChapterTag) {
      html += '<span class="dua-chapter-tag" data-goto="' + chapter.number + '">' +
        escapeHtml(chapter.number + '. ' + chapter.title_om) + '</span>';
    }
    html += '<div class="dua-card-top">';
    html += '<span class="dua-index">Du\'aa\'ii ' + dua.number + '</span>';
    html += '<button class="star-btn' + (fav ? ' active' : '') + '" data-fav="' + key + '" aria-label="Filadhu">' +
      '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 17.3 6.2 21l1.5-6.6L2.5 9.6l6.7-.6L12 2.7l2.8 6.3 6.7.6-5.2 4.8L18 21z"/></svg>' +
      '</button>';
    html += '</div>';
    if (state.showArabic && dua.arabic) {
      html += '<div class="dua-arabic" lang="ar">' + escapeHtml(dua.arabic) + '</div>';
    }
    if (state.showTranslation && dua.translation) {
      html += '<div class="dua-translation">' + highlight(dua.translation, q) + '</div>';
    }
    if (dua.references && dua.references.length) {
      html += '<div class="dua-refs">';
      dua.references.forEach(function (ref) {
        html += '<span class="dua-ref">' + escapeHtml(ref) + '</span>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function bindDuaListEvents(container) {
    container.querySelectorAll('.star-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-fav');
        toggleFavorite(key);
        btn.classList.toggle('active');
        if (state.activeTab === 'favorites') renderFavorites();
      });
    });
    container.querySelectorAll('.dua-chapter-tag').forEach(function (tag) {
      tag.addEventListener('click', function () {
        var num = parseInt(tag.getAttribute('data-goto'), 10);
        openChapter(num);
      });
    });
  }

  // ---------- Screens ----------
  function showScreen(name) {
    Object.keys(el.screens).forEach(function (k) {
      el.screens[k].hidden = (k !== name);
    });
    el.backBtn.hidden = (name === 'home' || name === 'favorites');
    var titles = {
      home: ['Hisnul Muslim', 'حصن المسلم'],
      chapter: [null, null],
      favorites: ['Filatamaa', '★'],
      intro: ['Seensa', '']
    };
    if (name !== 'chapter') {
      el.topTitle.textContent = titles[name][0];
      el.topSubtitle.textContent = titles[name][1];
    }
    state.activeTab = name;
    el.navBtns.forEach(function (b) {
      if (b.classList.contains('nav-btn')) {
        b.classList.toggle('active', b.getAttribute('data-tab') === name ||
          (name === 'chapter' && b.getAttribute('data-tab') === 'home'));
      }
    });
    window.scrollTo(0, 0);
  }

  function renderChapterList() {
    var html = '';
    HISNUL_DATA.chapters.forEach(function (c) {
      html += '<div class="chapter-item" data-chapter="' + c.number + '">' +
        '<span class="chapter-num">' + c.number + '</span>' +
        '<div class="chapter-text">' +
          '<div class="chapter-om">' + escapeHtml(c.title_om) + '</div>' +
          '<div class="chapter-ar" lang="ar">' + escapeHtml(c.title_ar) + '</div>' +
        '</div>' +
        '<span class="chapter-chevron"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8.5 4.5 16 12l-7.5 7.5-1.4-1.4L13.2 12 7.1 5.9z"/></svg></span>' +
      '</div>';
    });
    el.chapterList.innerHTML = html;
    el.chapCount.textContent = HISNUL_DATA.chapters.length;
    el.chapterList.querySelectorAll('.chapter-item').forEach(function (item) {
      item.addEventListener('click', function () {
        openChapter(parseInt(item.getAttribute('data-chapter'), 10));
      });
    });
  }

  function openChapter(number) {
    var chapter = HISNUL_DATA.chapters.filter(function (c) { return c.number === number; })[0];
    if (!chapter) return;
    state.currentChapter = chapter;
    el.chapterAr.textContent = chapter.title_ar;
    el.chapterOm.textContent = chapter.number + '. ' + chapter.title_om;
    var html = '';
    chapter.duas.forEach(function (d) {
      html += duaCardHTML(chapter, d);
    });
    el.duaList.innerHTML = html || '<p class="empty-note">Boqonnaa kana keessatti du\'aa\'iin hin argamne.</p>';
    bindDuaListEvents(el.duaList);
    el.topTitle.textContent = chapter.number + '. ' + chapter.title_om;
    el.topSubtitle.textContent = chapter.title_ar;
    showScreen('chapter');
  }

  function renderFavorites() {
    if (!state.favorites.length) {
      el.favList.innerHTML = '';
      el.favEmpty.hidden = false;
      return;
    }
    el.favEmpty.hidden = true;
    var html = '';
    state.favorites.forEach(function (key) {
      var parts = key.split(':');
      var chapNum = parseInt(parts[0], 10);
      var duaNum = parseInt(parts[1], 10);
      var chapter = HISNUL_DATA.chapters.filter(function (c) { return c.number === chapNum; })[0];
      if (!chapter) return;
      var dua = chapter.duas.filter(function (d) { return d.number === duaNum; })[0];
      if (!dua) return;
      html += duaCardHTML(chapter, dua, { showChapterTag: true });
    });
    el.favList.innerHTML = html;
    bindDuaListEvents(el.favList);
  }

  function renderIntro() {
    var html = '';
    if (HISNUL_DATA.intro_ar && HISNUL_DATA.intro_ar.length) {
      HISNUL_DATA.intro_ar.forEach(function (p) {
        html += '<div class="intro-p-ar" lang="ar">' + escapeHtml(p) + '</div>';
      });
    }
    if (HISNUL_DATA.intro_om && HISNUL_DATA.intro_om.length) {
      HISNUL_DATA.intro_om.forEach(function (p) {
        html += '<div class="intro-p-om">' + escapeHtml(p) + '</div>';
      });
    }
    el.introBody.innerHTML = html;
  }

  // ---------- Search ----------
  var searchTimer = null;
  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 120);
  }
  function runSearch() {
    var q = el.searchInput.value.trim();
    if (!q) {
      el.searchResults.hidden = true;
      el.chapterListWrap.hidden = false;
      return;
    }
    el.chapterListWrap.hidden = true;
    el.searchResults.hidden = false;
    var qLower = q.toLowerCase();
    var results = [];
    HISNUL_DATA.chapters.forEach(function (c) {
      var chapterMatches = c.title_om.toLowerCase().indexOf(qLower) !== -1 ||
        c.title_ar.indexOf(q) !== -1;
      c.duas.forEach(function (d) {
        var hit = chapterMatches ||
          (d.translation && d.translation.toLowerCase().indexOf(qLower) !== -1) ||
          (d.arabic && d.arabic.indexOf(q) !== -1) ||
          (d.references || []).some(function (r) { return r.toLowerCase().indexOf(qLower) !== -1; });
        if (hit) results.push({ chapter: c, dua: d });
      });
    });
    if (!results.length) {
      el.searchResults.innerHTML = '<p class="result-empty">"' + escapeHtml(q) + '" jedhu wanti argame hin jiru.</p>';
      return;
    }
    var html = '';
    results.slice(0, 60).forEach(function (r) {
      html += duaCardHTML(r.chapter, r.dua, { showChapterTag: true, query: q });
    });
    el.searchResults.innerHTML = html;
    bindDuaListEvents(el.searchResults);
  }

  // ---------- Settings ----------
  function applyFontScale() {
    document.documentElement.style.setProperty('--scale', state.fontScale.toFixed(2));
    el.fontReadout.textContent = Math.round(state.fontScale * 100) + '%';
    localStorage.setItem(STORAGE.fontScale, state.fontScale);
  }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem(STORAGE.theme, state.theme);
    el.swatches.forEach(function (s) {
      s.classList.toggle('active', s.getAttribute('data-theme') === state.theme);
    });
  }
  function applyToggles() {
    el.arabicToggle.checked = state.showArabic;
    el.translationToggle.checked = state.showTranslation;
    localStorage.setItem(STORAGE.showArabic, state.showArabic ? '1' : '0');
    localStorage.setItem(STORAGE.showTranslation, state.showTranslation ? '1' : '0');
  }

  function rerenderCurrentContent() {
    if (state.currentChapter) openChapter(state.currentChapter.number);
    if (state.activeTab === 'favorites') renderFavorites();
    if (el.searchInput.value.trim()) runSearch();
  }

  // ---------- Events ----------
  el.backBtn.addEventListener('click', function () {
    el.searchInput.value = '';
    el.searchResults.hidden = true;
    el.chapterListWrap.hidden = false;
    showScreen('home');
  });

  el.settingsBtn.addEventListener('click', function () { el.settingsPanel.hidden = false; });
  el.settingsClose.addEventListener('click', function () { el.settingsPanel.hidden = true; });
  el.settingsPanel.addEventListener('click', function (e) {
    if (e.target === el.settingsPanel) el.settingsPanel.hidden = true;
  });

  el.fontMinus.addEventListener('click', function () {
    state.fontScale = Math.max(0.8, +(state.fontScale - 0.1).toFixed(2));
    applyFontScale();
  });
  el.fontPlus.addEventListener('click', function () {
    state.fontScale = Math.min(1.6, +(state.fontScale + 0.1).toFixed(2));
    applyFontScale();
  });

  el.swatches.forEach(function (s) {
    s.addEventListener('click', function () {
      state.theme = s.getAttribute('data-theme');
      applyTheme();
    });
  });

  el.arabicToggle.addEventListener('change', function () {
    state.showArabic = el.arabicToggle.checked;
    applyToggles();
    rerenderCurrentContent();
  });
  el.translationToggle.addEventListener('change', function () {
    state.showTranslation = el.translationToggle.checked;
    applyToggles();
    rerenderCurrentContent();
  });

  el.searchInput.addEventListener('input', onSearchInput);

  el.introBtn.addEventListener('click', function () { showScreen('intro'); });

  el.navBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = btn.getAttribute('data-tab');
      if (tab === 'home') {
        el.searchInput.value = '';
        el.searchResults.hidden = true;
        el.chapterListWrap.hidden = false;
        showScreen('home');
      } else if (tab === 'search') {
        showScreen('home');
        setTimeout(function () { el.searchInput.focus(); }, 50);
      } else if (tab === 'favorites') {
        renderFavorites();
        showScreen('favorites');
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !el.settingsPanel.hidden) el.settingsPanel.hidden = true;
  });

  // ---------- Init ----------
  function init() {
    applyFontScale();
    applyTheme();
    applyToggles();
    renderChapterList();
    renderIntro();
    showScreen('home');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
  }

  init();
})();
