/* ==========================================================================
   AOCAV — admin console
   Sign in with Firebase Auth, then add, edit and remove the events that the
   public pages read. Card markup comes from cards.js so the live preview is
   the real thing, not an imitation.

   Security note: hiding this screen is convenience, not protection. What
   actually stops anyone writing to your events is firestore.rules.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.AocavCards;
  var Store = window.AocavStore;
  var Cms = window.AocavCms;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = {
    events: [],        // raw records, drafts included
    current: null,     // the record being edited
    isNew: true,
    tab: 'all',
    search: '',
    auth: null,        // the auth module
    user: null,
    dirty: false,
    // website text
    items: [],         // every editable phrase found across the pages
    content: {},       // saved overrides and translations
    edits: {},         // unsaved changes, by key
    cPage: 'all', cFind: '', cUntranslated: false,
    // links
    links: [], link: null, linkIsNew: true, linkSearch: ''
  };

  var PAGES = ['index', 'about', 'events', 'links', 'get-involved', 'contact'];
  var PAGE_NAMES = {
    global: 'Shared — menu & footer', index: 'Home', about: 'About',
    events: 'Events', links: 'Useful links', 'get-involved': 'Get Involved', contact: 'Contact'
  };

  /* --------------------------------------------------------------- UI bits */
  function screen(name) {
    $$('[data-screen]').forEach(function (el) {
      el.classList.toggle('hidden', el.getAttribute('data-screen') !== name);
    });
  }

  var TOAST_ICON = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.01"/></svg>'
  };
  function toast(msg, kind) {
    var host = $('[data-toasts]');
    if (!host) return;
    var el = document.createElement('div');
    el.className = 'toast' + (kind && kind !== 'ok' ? ' ' + kind : '');
    el.innerHTML = (TOAST_ICON[kind || 'ok'] || '') + '<span>' + C.esc(msg) + '</span>';
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, kind === 'err' ? 7000 : 3800);
  }

  // Firebase error codes are not written for volunteers.
  function humanError(err) {
    var code = (err && err.code) || '';
    var map = {
      'auth/invalid-email': 'That does not look like an email address.',
      'auth/invalid-credential': 'That email and password do not match. Check for typos, or reset your password.',
      'auth/wrong-password': 'That password is not right. Try again or reset it.',
      'auth/user-not-found': 'There is no account with that email. Ask whoever set up Firebase to add you.',
      'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
      'auth/network-request-failed': 'No connection to Firebase. Check your internet.',
      'auth/operation-not-allowed': 'Email sign-in is switched off in the Firebase console (Authentication → Sign-in method).',
      'permission-denied': 'Firebase refused that. Your account is probably not in the "admins" collection yet.',
      'unavailable': 'Could not reach Firebase. Check your internet and try again.',
      'storage/unauthorized': 'Firebase refused the upload. Check storage.rules has been published.',
      'storage/unknown': 'The upload failed. Make sure Storage is switched on in the Firebase console.'
    };
    return map[code] || (err && err.message) || 'Something went wrong.';
  }

  /* ---------------------------------------------------------------- model */
  function blank() {
    return {
      id: '', title: '', titleOm: '', desc: '', descOm: '', start: '', end: '', when: '', whenOm: '',
      status: 'confirmed', theme: '', category: 'community',
      featured: false, published: true,
      venue: '', address: '', cost: '',
      highlights: [], highlightsOm: [], flyer: '', photos: [], video: '',
      funder: '', rsvp: '', rsvpLabel: '', rsvpLabelOm: '', costOm: ''
    };
  }

  // "2026-12-06T13:00" <-> the value an <input type="datetime-local"> wants.
  function toInput(v) { return v ? String(v).slice(0, 16) : ''; }

  function readForm() {
    var f = $('[data-form="event"]');
    var get = function (n) { var el = f.elements[n]; return el ? el.value.trim() : ''; };
    var checked = function (n) { var el = f.elements[n]; return !!(el && el.checked); };
    var recurring = checked('isRecurring');

    var ev = {
      id: get('id'),
      title: get('title'),
      desc: get('desc'),
      status: recurring ? 'recurring' : (get('status') === 'recurring' ? 'confirmed' : get('status')),
      theme: get('theme'),
      category: get('category'),
      featured: checked('featured'),
      published: checked('published'),
      venue: get('venue'),
      address: get('address'),
      cost: get('cost'),
      flyer: get('flyer'),
      photos: (state.current && state.current.photos ? state.current.photos.slice() : []),
      video: get('video'),
      titleOm: get('titleOm'),
      descOm: get('descOm'),
      costOm: get('costOm'),
      rsvpLabelOm: get('rsvpLabelOm'),
      funder: get('funder'),
      rsvp: get('rsvp'),
      rsvpLabel: get('rsvpLabel'),
      highlights: get('highlights').split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
      highlightsOm: get('highlightsOm').split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
    };
    if (recurring) {
      ev.when = get('when');
      ev.whenOm = get('whenOm');
      ev.start = ''; ev.end = '';
    } else {
      ev.start = get('start'); ev.end = get('end'); ev.when = '';
    }
    if (!ev.id) ev.id = C.slugify(ev.title);
    return ev;
  }

  function writeForm(ev) {
    var f = $('[data-form="event"]');
    var set = function (n, v) { if (f.elements[n]) f.elements[n].value = v == null ? '' : v; };
    var check = function (n, v) { if (f.elements[n]) f.elements[n].checked = !!v; };

    set('title', ev.title); set('desc', ev.desc); set('id', ev.id);
    set('start', toInput(ev.start)); set('end', toInput(ev.end)); set('when', ev.when);
    set('status', ev.status === 'recurring' ? 'recurring' : (ev.status || 'confirmed'));
    set('venue', ev.venue); set('address', ev.address); set('cost', ev.cost);
    set('category', ev.category || 'community'); set('theme', ev.theme || '');
    set('flyer', ev.flyer); set('funder', ev.funder);
    set('video', ev.video);
    set('titleOm', ev.titleOm); set('descOm', ev.descOm);
    set('costOm', ev.costOm); set('rsvpLabelOm', ev.rsvpLabelOm);
    set('whenOm', ev.whenOm);
    set('rsvp', ev.rsvp); set('rsvpLabel', ev.rsvpLabel);
    set('highlights', (ev.highlights || []).join('\n'));
    set('highlightsOm', (ev.highlightsOm || []).join('\n'));
    check('featured', ev.featured);
    check('published', ev.published !== false);
    check('isRecurring', ev.status === 'recurring' || (!ev.start && !!ev.when));

    syncRecurring();
    refreshPoster();
    refreshPhotos();
    refreshPreview();
  }

  function syncRecurring() {
    var f = $('[data-form="event"]');
    var on = f.elements.isRecurring.checked;
    $('[data-when-once]').classList.toggle('hidden', on);
    $('[data-when-repeat]').classList.toggle('hidden', !on);
    $('[data-whenom-wrap]').classList.toggle('hidden', !on);
    if (on) f.elements.status.value = 'recurring';
    else if (f.elements.status.value === 'recurring') f.elements.status.value = 'confirmed';
  }

  function refreshPoster() {
    var src = C.safeUrl($('[data-form="event"]').elements.flyer.value.trim());
    var box = $('[data-poster-thumb]');
    box.textContent = src ? '' : 'No poster';
    if (!src) return;
    // Built as a node rather than interpolated into innerHTML: the address
    // comes from whatever was typed into the field.
    var img = document.createElement('img');
    img.alt = 'Poster preview';
    img.onerror = function () { box.textContent = 'Image not found'; };
    img.src = src;
    box.appendChild(img);
  }

  function showVideoNote() {
    var url = $('[data-form="event"]').elements.video.value.trim();
    var note = $('[data-video-note]');
    if (!url) { note.textContent = ''; return; }
    var id = C.ytId(url);
    note.textContent = id ? 'Video found \u2713  (' + id + ')'
                          : 'That does not look like a YouTube address \u2014 check it and try again.';
    note.style.color = id ? 'var(--leaf)' : 'var(--crimson)';
  }

  function refreshPhotos() {
    var strip = $('[data-photo-strip]');
    var pics = (state.current && state.current.photos) || [];
    strip.textContent = '';
    if (!pics.length) {
      var empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'No photos yet.';
      strip.appendChild(empty);
      return;
    }
    pics.forEach(function (src, i) {
      var cell = document.createElement('div');
      cell.className = 'photo-cell';
      var img = document.createElement('img');
      img.src = C.safeUrl(src); img.alt = 'Photo ' + (i + 1); img.loading = 'lazy';
      var del = document.createElement('button');
      del.type = 'button'; del.className = 'photo-del';
      del.title = 'Remove this photo'; del.setAttribute('aria-label', 'Remove photo ' + (i + 1));
      del.textContent = '\u00d7';
      del.addEventListener('click', function () {
        state.current.photos.splice(i, 1);
        state.dirty = true;
        refreshPhotos(); refreshPreview();
      });
      cell.appendChild(img); cell.appendChild(del);
      strip.appendChild(cell);
    });
  }

  function uploadPhotos(files) {
    if (!files || !files.length) return;
    var list = Array.prototype.slice.call(files).filter(function (f) {
      if (f.size > 8 * 1024 * 1024) { toast(f.name + ' is larger than 8 MB — please shrink it first.', 'warn'); return false; }
      return true;
    });
    if (!list.length) return;
    var bar = $('[data-photos-bar]'), fill = $('i', bar);
    bar.classList.remove('hidden');
    var done = 0;
    var next = function () {
      if (!list.length) {
        setTimeout(function () { bar.classList.add('hidden'); }, 600);
        toast(done + (done === 1 ? ' photo added.' : ' photos added.'), 'ok');
        return;
      }
      var f = list.shift();
      Store.uploadPoster(f, function (pct) { fill.style.width = pct + '%'; })
        .then(function (url) {
          if (!state.current.photos) state.current.photos = [];
          state.current.photos.push(url);
          done++; state.dirty = true;
          refreshPhotos(); refreshPreview();
        })
        .catch(function (err) { toast(humanError(err), 'err'); })
        .then(next);
    };
    next();
  }

  function refreshPreview() {
    var ev = C.normalise([readForm()])[0];
    var host = $('[data-preview]');
    host.innerHTML = ev.featured
      ? C.featureHTML(ev, { preview: true })
      : C.cardHTML(ev, { preview: true });
    $('[data-highlights-group]').classList.toggle('hidden', !ev.featured);
    $('[data-highlightsom-wrap]').classList.toggle('hidden', !ev.featured);
    $('[data-ed-draft]').classList.toggle('hidden', ev.published !== false);
  }

  /* ----------------------------------------------------------------- list */
  var STAR = '<span class="star" title="Banner event"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.9 6.3 6.8.8-5 4.6 1.3 6.8L12 17.3 6 20.5l1.3-6.8-5-4.6 6.8-.8Z"/></svg></span>';

  function listRow(ev) {
    var n = C.normalise([ev])[0];
    var cls = ['adm-item'];
    if (n.theme === 'grad') cls.push('grad');
    if (n.theme === 'culture') cls.push('culture');
    if (n.past) cls.push('is-past');

    var when = n.startDate
      ? '<b>' + n.startDate.getDate() + '</b><span>' + n.startDate.toLocaleDateString('en-AU', { month: 'short' }) + '</span>'
      : '<b>↻</b><span>wkly</span>';

    var sub = n.recurring ? (n.when || 'Ongoing')
      : (n.startDate ? C.fmtDate(n.startDate) : 'No date set');

    return '<li><button type="button" class="' + cls.join(' ') + '" data-pick="' + C.esc(ev.id) + '"' +
      (state.current && state.current.id === ev.id && !state.isNew ? ' aria-current="true"' : '') + '>' +
      '<span class="when">' + when + '</span>' +
      '<span class="t"><b>' + C.esc(ev.title || 'Untitled') + '</b><small>' + C.esc(sub) + '</small></span>' +
      '<span class="flags">' +
      (ev.featured ? STAR : '') +
      (ev.published === false ? '<span class="pill draft">Draft</span>' : '') +
      '</span></button></li>';
  }

  function visibleEvents() {
    var q = state.search.toLowerCase();
    return C.normalise(state.events).filter(function (n) {
      if (state.tab === 'draft') { if (n.published !== false) return false; }
      else if (state.tab !== 'all' && n.group !== state.tab) return false;
      if (!q) return true;
      return (C.plain(n.title) + ' ' + C.plain(n.desc) + ' ' + (n.venue || '')).toLowerCase().indexOf(q) !== -1;
    }).sort(C.sortAll);
  }

  function renderList() {
    var rows = visibleEvents();
    var byId = {};
    state.events.forEach(function (e) { byId[e.id] = e; });
    $('[data-list]').innerHTML = rows.map(function (n) { return listRow(byId[n.id] || n); }).join('');
    $('[data-list-empty]').classList.toggle('hidden', rows.length > 0);
  }

  /* -------------------------------------------------------------- editing */
  function edit(ev, isNew) {
    state.current = ev;
    state.isNew = !!isNew;
    state.dirty = false;
    $('[data-ed-title]').textContent = isNew ? 'New event' : 'Editing: ' + C.plain(ev.title || 'Untitled');
    $('[data-delete]').classList.toggle('hidden', !!isNew);
    $('[data-duplicate]').classList.toggle('hidden', !!isNew);
    writeForm(ev);
    showVideoNote();
    renderList();
  }

  function pick(id) {
    var ev = state.events.filter(function (e) { return e.id === id; })[0];
    if (ev) edit(JSON.parse(JSON.stringify(ev)), false);
  }

  function validate(ev) {
    if (!C.plain(ev.title)) return 'Give the event a name.';
    if (ev.status === 'recurring' && !ev.when) return 'Say how often it repeats, e.g. "Every Saturday, 10:00am – 1:00pm".';
    if (ev.status !== 'recurring' && !ev.start) return 'Choose a start date and time.';
    if (ev.end && ev.start && ev.end < ev.start) return 'The end time is before the start time.';
    if (!/^[a-z0-9-]+$/.test(ev.id)) return 'The web address can only use lowercase letters, numbers and dashes.';
    return null;
  }

  function save() {
    var ev = readForm();
    var problem = validate(ev);
    if (problem) { toast(problem, 'warn'); return; }

    // Renaming the web address means writing a new record; remove the old one.
    var oldId = (!state.isNew && state.current && state.current.id) || null;

    var btn = $('[data-save]');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    Store.saveEvent(ev)
      .then(function () { return ev.featured ? Store.makeSoleFeatured(ev.id) : null; })
      .then(function () { return (oldId && oldId !== ev.id) ? Store.deleteEvent(oldId) : null; })
      .then(reload)
      .then(function () {
        toast('Saved — the website is updated.', 'ok');
        pick(ev.id);
      })
      .catch(function (err) { toast(humanError(err), 'err'); })
      .then(function () { btn.disabled = false; btn.textContent = 'Save event'; });
  }

  function remove() {
    if (!state.current || state.isNew) return;
    var name = C.plain(state.current.title) || state.current.id;
    if (!window.confirm('Delete "' + name + '" from the website?\n\nThis cannot be undone.')) return;
    Store.deleteEvent(state.current.id)
      .then(reload)
      .then(function () {
        toast('Deleted.', 'ok');
        edit(blank(), true);
      })
      .catch(function (err) { toast(humanError(err), 'err'); });
  }

  function duplicate() {
    var ev = readForm();
    ev.id = (ev.id || 'event') + '-copy';
    ev.title = ev.title + ' (copy)';
    ev.featured = false;
    ev.published = false;
    edit(ev, true);
    toast('Copied — change the details and save.', 'ok');
  }

  /* ----------------------------------------------------------------- data */
  function reload() {
    return Store.loadEvents({ includeDrafts: true }).then(function (res) {
      state.events = res.source === 'firebase' ? res.events : [];
      $('[data-empty-warning]').classList.toggle('hidden', state.events.length > 0);
      renderList();
      return res;
    });
  }

  function seed() {
    var n = Store.bundled().length;
    if (!window.confirm('Copy the ' + n + ' events from assets/events.js into Firebase?\n\nExisting events with the same web address will be overwritten.')) return;
    Store.seedFromBundle()
      .then(reload)
      .then(function () { toast('Imported ' + n + ' events.', 'ok'); })
      .catch(function (err) { toast(humanError(err), 'err'); });
  }

  function exportSeed() {
    var list = state.events.length ? state.events : Store.bundled();
    var ordered = C.normalise(list).sort(C.sortAll).map(function (n) {
      var out = {};
      C.FIELDS.forEach(function (f) { if (n[f] !== undefined) out[f] = n[f]; });
      return out;
    });
    C.download('events.js', C.toSeedFile(ordered), 'text/javascript;charset=utf-8');
    toast('Downloaded. Replace assets/events.js with it to update the backup copy.', 'ok');
  }

  function upload(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast('That image is larger than 8 MB — please shrink it first.', 'warn'); return; }
    var bar = $('[data-upload-bar]'), fill = $('i', bar);
    bar.classList.remove('hidden');
    fill.style.width = '0%';
    Store.uploadPoster(file, function (pct) { fill.style.width = pct + '%'; })
      .then(function (url) {
        $('[data-form="event"]').elements.flyer.value = url;
        refreshPoster(); refreshPreview();
        toast('Poster uploaded.', 'ok');
      })
      .catch(function (err) { toast(humanError(err), 'err'); })
      .then(function () { setTimeout(function () { bar.classList.add('hidden'); }, 600); });
  }

  /* ------------------------------------------------------- website text */
  // Every page is fetched and read with the same code the website uses, so the
  // list here is exactly what a visitor sees — nothing is hand-maintained.
  function loadContentItems() {
    return Promise.all(PAGES.map(function (name) {
      return fetch(name + '.html', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (html) {
          if (!html) return [];
          var doc = new DOMParser().parseFromString(html, 'text/html');
          doc.__aocavPath = name + '.html';
          return Cms.collect(doc, name);
        })
        .catch(function () { return []; });
    })).then(function (lists) {
      var seen = {}, out = [];
      lists.forEach(function (list) {
        list.forEach(function (it) {
          if (seen[it.key]) return;
          seen[it.key] = 1;
          out.push({ key: it.key, page: it.page, scope: it.scope, tag: it.tag, text: it.text });
        });
      });
      state.items = out;
      return out;
    });
  }

  function contentValue(key, field) {
    if (state.edits[key] && state.edits[key][field] !== undefined) return state.edits[key][field];
    return (state.content[key] && state.content[key][field]) || '';
  }

  function visibleItems() {
    var q = state.cFind.toLowerCase();
    return state.items.filter(function (it) {
      if (state.cPage !== 'all' && it.page !== state.cPage) return false;
      if (state.cUntranslated && contentValue(it.key, 'om')) return false;
      if (!q) return true;
      return (it.text + ' ' + contentValue(it.key, 'en') + ' ' + contentValue(it.key, 'om'))
        .toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderContent() {
    var host = $('[data-content-list]');
    if (!host) return;
    var rows = visibleItems();
    var groups = {}, order = [];
    rows.forEach(function (it) {
      var g = it.page + ' › ' + it.scope;
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(it);
    });

    host.innerHTML = order.map(function (g) {
      return '<div class="content-group"><h3>' + C.esc(g.replace(/^(\w[\w-]*)/, function (m) {
        return PAGE_NAMES[m] || m;
      })) + '</h3>' + groups[g].map(function (it) {
        var en = contentValue(it.key, 'en'), om = contentValue(it.key, 'om');
        var changed = !!state.edits[it.key];
        return '<div class="content-row' + (changed ? ' is-dirty' : '') + '" data-row="' + C.esc(it.key) + '">' +
          '<p class="content-original"><span class="tagchip">' + C.esc(it.tag) + '</span>' + C.esc(it.text) + '</p>' +
          '<div class="content-fields">' +
          '<label><span>English</span><textarea rows="2" data-ck="' + C.esc(it.key) + '" data-cf="en" ' +
          'placeholder="Leave empty to keep the words above">' + C.esc(en) + '</textarea></label>' +
          '<label><span lang="om">Afaan Oromoo</span><textarea rows="2" lang="om" data-ck="' + C.esc(it.key) + '" data-cf="om" ' +
          'placeholder="Not translated yet">' + C.esc(om) + '</textarea></label>' +
          '</div></div>';
      }).join('') + '</div>';
    }).join('');

    $('[data-content-empty]').classList.toggle('hidden', rows.length > 0);

    var total = state.items.length;
    var done = state.items.filter(function (it) { return contentValue(it.key, 'om'); }).length;
    $('[data-content-count]').textContent = done + ' of ' + total + ' translated';
    var n = Object.keys(state.edits).length;
    $('[data-content-dirty]').textContent = n ? (n === 1 ? '1 unsaved change' : n + ' unsaved changes') : '';
  }

  function saveContent() {
    var keys = Object.keys(state.edits);
    if (!keys.length) { toast('Nothing has been changed yet.', 'warn'); return; }
    var btns = $$('[data-content-save]');
    btns.forEach(function (b) { b.disabled = true; b.textContent = 'Saving…'; });
    Promise.all(keys.map(function (k) {
      var rec = {
        en: contentValue(k, 'en'),
        om: contentValue(k, 'om')
      };
      return Store.saveContent(k, rec).then(function () {
        if (!rec.en && !rec.om) delete state.content[k];
        else state.content[k] = rec;
      });
    })).then(function () {
      state.edits = {};
      toast('Saved ' + keys.length + (keys.length === 1 ? ' change.' : ' changes.'), 'ok');
      renderContent();
    }).catch(function (err) {
      toast(humanError(err), 'err');
    }).then(function () {
      btns.forEach(function (b) { b.disabled = false; b.textContent = 'Save changes'; });
    });
  }

  function wireContent() {
    var sel = $('[data-content-page]');
    sel.innerHTML = '<option value="all">All pages</option>' +
      ['global'].concat(PAGES).map(function (p) {
        return '<option value="' + p + '">' + C.esc(PAGE_NAMES[p] || p) + '</option>';
      }).join('');
    sel.addEventListener('change', function () { state.cPage = sel.value; renderContent(); });

    $('[data-content-find]').addEventListener('input', function (e) {
      state.cFind = e.target.value.trim(); renderContent();
    });
    $('[data-content-untranslated]').addEventListener('change', function (e) {
      state.cUntranslated = e.target.checked; renderContent();
    });

    $('[data-content-list]').addEventListener('input', function (e) {
      var ta = e.target.closest('[data-ck]');
      if (!ta) return;
      var key = ta.getAttribute('data-ck'), field = ta.getAttribute('data-cf');
      var saved = (state.content[key] && state.content[key][field]) || '';
      if (!state.edits[key]) state.edits[key] = {};
      state.edits[key][field] = ta.value;
      // if it matches what is already stored, it is not a change after all
      var e2 = state.edits[key];
      var otherField = field === 'en' ? 'om' : 'en';
      if (e2[field] === saved && (e2[otherField] === undefined ||
          e2[otherField] === ((state.content[key] && state.content[key][otherField]) || ''))) {
        delete state.edits[key];
      }
      var row = ta.closest('.content-row');
      if (row) row.classList.toggle('is-dirty', !!state.edits[key]);
      var n = Object.keys(state.edits).length;
      $('[data-content-dirty]').textContent = n ? (n === 1 ? '1 unsaved change' : n + ' unsaved changes') : '';
      state.dirty = n > 0;
    });

    $$('[data-content-save]').forEach(function (b) { b.addEventListener('click', saveContent); });
  }

  /* --------------------------------------------------------------- links */
  function blankLink() {
    return { id: '', cat: (window.AOCAV_LINK_CATEGORIES || [{ id: 'government' }])[0].id,
             title: '', titleOm: '', desc: '', descOm: '', url: '', phone: '', order: 10, published: true };
  }

  function readLinkForm() {
    var f = $('[data-form="link"]');
    var g = function (n) { return f.elements[n] ? f.elements[n].value.trim() : ''; };
    var l = {
      id: g('id'), cat: g('cat'), title: g('title'), titleOm: g('titleOm'),
      desc: g('desc'), descOm: g('descOm'), url: g('url'), phone: g('phone'),
      order: Number(g('order')) || 0,
      published: !!(f.elements.published && f.elements.published.checked)
    };
    if (!l.id) l.id = C.slugify(l.title);
    return l;
  }

  function writeLinkForm(l) {
    var f = $('[data-form="link"]');
    var set = function (n, v) { if (f.elements[n]) f.elements[n].value = v == null ? '' : v; };
    set('id', l.id); set('cat', l.cat); set('title', l.title); set('titleOm', l.titleOm);
    set('desc', l.desc); set('descOm', l.descOm); set('url', l.url); set('phone', l.phone);
    set('order', l.order == null ? 10 : l.order);
    if (f.elements.published) f.elements.published.checked = l.published !== false;
  }

  function renderLinkList() {
    var q = state.linkSearch.toLowerCase();
    var cats = {};
    (window.AOCAV_LINK_CATEGORIES || []).forEach(function (c) { cats[c.id] = c.title; });
    var rows = state.links.filter(function (l) {
      if (!q) return true;
      return ((l.title || '') + ' ' + (l.desc || '') + ' ' + (l.url || '')).toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) {
      if (a.cat !== b.cat) return (a.cat || '').localeCompare(b.cat || '');
      return (Number(a.order) || 0) - (Number(b.order) || 0);
    });

    $('[data-link-list]').innerHTML = rows.map(function (l) {
      return '<li><button type="button" class="adm-item" data-link-pick="' + C.esc(l.id) + '"' +
        (state.link && state.link.id === l.id && !state.linkIsNew ? ' aria-current="true"' : '') + '>' +
        '<span class="when" style="font-size:.6rem; padding:8px 2px">' + C.esc((cats[l.cat] || l.cat || '?').slice(0, 7)) + '</span>' +
        '<span class="t"><b>' + C.esc(l.title || 'Untitled') + '</b><small>' +
        C.esc(l.url || l.phone || '') + '</small></span>' +
        '<span class="flags">' + (l.published === false ? '<span class="pill draft">Hidden</span>' : '') + '</span>' +
        '</button></li>';
    }).join('');
    $('[data-link-list-empty]').classList.toggle('hidden', rows.length > 0);
  }

  function editLink(l, isNew) {
    state.link = l; state.linkIsNew = !!isNew;
    $('[data-link-ed-title]').textContent = isNew ? 'New link' : 'Editing: ' + (l.title || 'Untitled');
    $('[data-link-delete]').classList.toggle('hidden', !!isNew);
    writeLinkForm(l);
    renderLinkList();
  }

  function saveLink() {
    var l = readLinkForm();
    if (!l.title) { toast('Give the link a name.', 'warn'); return; }
    if (!l.url && !l.phone) { toast('Add a web address or a phone number.', 'warn'); return; }
    if (l.url && !/^https?:\/\//i.test(l.url)) { toast('The web address should start with https://', 'warn'); return; }
    if (!/^[a-z0-9-]+$/.test(l.id)) { toast('The id can only use lowercase letters, numbers and dashes.', 'warn'); return; }
    var oldId = (!state.linkIsNew && state.link && state.link.id) || null;
    var btn = $('[data-link-save]');
    btn.disabled = true; btn.textContent = 'Saving…';
    Store.saveLink(l)
      .then(function () { return (oldId && oldId !== l.id) ? Store.deleteLink(oldId) : null; })
      .then(reloadLinks)
      .then(function () {
        toast('Link saved.', 'ok');
        var found = state.links.filter(function (x) { return x.id === l.id; })[0];
        if (found) editLink(JSON.parse(JSON.stringify(found)), false);
      })
      .catch(function (err) { toast(humanError(err), 'err'); })
      .then(function () { btn.disabled = false; btn.textContent = 'Save link'; });
  }

  function reloadLinks() {
    return Store.loadLinks({ includeDrafts: true }).then(function (res) {
      state.links = res.source === 'firebase' ? res.links : [];
      renderLinkList();
      return res;
    });
  }

  function wireLinks() {
    var sel = $('[data-link-cats]');
    sel.innerHTML = (window.AOCAV_LINK_CATEGORIES || []).map(function (c) {
      return '<option value="' + C.esc(c.id) + '">' + C.esc(c.title) + '</option>';
    }).join('');

    var f = $('[data-form="link"]');
    f.addEventListener('input', function (e) {
      state.dirty = true;
      if (e.target.name === 'title' && (state.linkIsNew || !f.elements.id.value)) {
        f.elements.id.value = C.slugify(f.elements.title.value);
      }
    });
    f.addEventListener('submit', function (e) { e.preventDefault(); saveLink(); });

    $('[data-link-save]').addEventListener('click', saveLink);
    $('[data-link-new]').addEventListener('click', function () { editLink(blankLink(), true); });
    $('[data-link-search-admin]').addEventListener('input', function (e) {
      state.linkSearch = e.target.value.trim(); renderLinkList();
    });
    $('[data-link-list]').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-link-pick]');
      if (!btn) return;
      var l = state.links.filter(function (x) { return x.id === btn.getAttribute('data-link-pick'); })[0];
      if (l) editLink(JSON.parse(JSON.stringify(l)), false);
    });
    $('[data-link-delete]').addEventListener('click', function () {
      if (!state.link || state.linkIsNew) return;
      if (!window.confirm('Delete "' + (state.link.title || state.link.id) + '" from the links page?')) return;
      Store.deleteLink(state.link.id).then(reloadLinks).then(function () {
        toast('Link deleted.', 'ok');
        editLink(blankLink(), true);
      }).catch(function (err) { toast(humanError(err), 'err'); });
    });
    $('[data-link-seed]').addEventListener('click', function () {
      var n = Store.bundledLinks().length;
      if (!window.confirm('Copy the ' + n + ' links from assets/links.js into Firebase?')) return;
      Store.seedLinks().then(reloadLinks).then(function () {
        toast('Imported ' + n + ' links.', 'ok');
      }).catch(function (err) { toast(humanError(err), 'err'); });
    });
  }

  /* ----------------------------------------------------------------- tabs */
  function wireTabs() {
    $$('[data-admtab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var name = b.getAttribute('data-admtab');
        $$('[data-admtab]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $$('[data-tab-panel]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-tab-panel') !== name;
        });
        if (name === 'content' && !state.items.length) {
          loadContentItems().then(renderContent);
        }
      });
    });
  }

  /* ----------------------------------------------------------------- auth */
  function startAuth() {
    return Promise.all([Store.app(), Store.mod('auth')]).then(function (r) {
      var mod = r[1];
      var auth = mod.getAuth(r[0]);
      state.auth = { mod: mod, auth: auth };
      return new Promise(function (resolve) {
        mod.onAuthStateChanged(auth, function (user) {
          state.user = user;
          if (user) {
            $('[data-user-email]').textContent = user.email || '';
            screen('app');
            edit(blank(), true);
            editLink(blankLink(), true);
            reload().catch(function (err) { toast(humanError(err), 'err'); });
            reloadLinks().catch(function (err) { toast(humanError(err), 'err'); });
            Store.loadContent().then(function (res) {
              state.content = res.content || {};
              if (state.items.length) renderContent();
            });
          } else {
            screen('login');
          }
          resolve();
        });
      });
    });
  }

  function wireAuth() {
    var form = $('[data-form="login"]');
    var msg = $('[data-login-msg]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('[data-login-btn]');
      btn.disabled = true; btn.textContent = 'Signing in…';
      msg.textContent = '';
      var a = state.auth;
      a.mod.signInWithEmailAndPassword(a.auth, form.elements.email.value.trim(), form.elements.password.value)
        .catch(function (err) { msg.textContent = humanError(err); })
        .then(function () { btn.disabled = false; btn.textContent = 'Sign in'; });
    });

    $('[data-reset-pass]').addEventListener('click', function () {
      var email = form.elements.email.value.trim();
      if (!email) { msg.textContent = 'Type your email address above first, then press this again.'; return; }
      var a = state.auth;
      a.mod.sendPasswordResetEmail(a.auth, email)
        .then(function () { msg.textContent = 'Sent. Check your inbox for a reset link.'; })
        .catch(function (err) { msg.textContent = humanError(err); });
    });

    $('[data-signout]').addEventListener('click', function () {
      if (state.dirty && !window.confirm('You have unsaved changes. Sign out anyway?')) return;
      state.auth.mod.signOut(state.auth.auth);
    });
  }

  /* ----------------------------------------------------------------- wire */
  function wireEditor() {
    var form = $('[data-form="event"]');

    form.addEventListener('input', function (e) {
      state.dirty = true;
      // Keep the web address in step with the title until it is edited by hand.
      if (e.target.name === 'title' && (state.isNew || !form.elements.id.value)) {
        form.elements.id.value = C.slugify(form.elements.title.value);
      }
      if (e.target.name === 'flyer') refreshPoster();
      if (e.target.name === 'video') showVideoNote();
      refreshPreview();
    });
    form.addEventListener('change', function (e) {
      state.dirty = true;
      if (e.target.name === 'isRecurring') syncRecurring();
      refreshPreview();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); save(); });

    $('[data-save]').addEventListener('click', save);
    $('[data-delete]').addEventListener('click', remove);
    $('[data-duplicate]').addEventListener('click', duplicate);
    $('[data-new]').addEventListener('click', function () {
      if (state.dirty && !window.confirm('Discard your unsaved changes?')) return;
      edit(blank(), true);
    });
    $('[data-seed]').addEventListener('click', seed);
    $('[data-export]').addEventListener('click', exportSeed);
    $('[data-upload]').addEventListener('change', function (e) { upload(e.target.files[0]); e.target.value = ''; });
    $('[data-photos-input]').addEventListener('change', function (e) { uploadPhotos(e.target.files); e.target.value = ''; });

    $('[data-list]').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-pick]');
      if (!btn) return;
      if (state.dirty && !window.confirm('Discard your unsaved changes?')) return;
      pick(btn.getAttribute('data-pick'));
    });

    $('[data-search]').addEventListener('input', function (e) {
      state.search = e.target.value.trim();
      renderList();
    });

    $$('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.tab = b.getAttribute('data-tab');
        $$('[data-tab]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderList();
      });
    });

    // Ctrl/Cmd+S saves, like every other editor.
    window.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !$('[data-screen="app"]').classList.contains('hidden')) {
        e.preventDefault(); save();
      }
    });

    window.addEventListener('beforeunload', function (e) {
      if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  /* ----------------------------------------------------------------- init */
  function init() {
    if (!Store.configured()) { screen('setup'); return; }
    wireEditor();
    wireTabs();
    wireContent();
    wireLinks();
    wireAuth();
    screen('login');
    startAuth().catch(function (err) {
      screen('login');
      $('[data-login-msg]').textContent =
        'Could not reach Firebase: ' + humanError(err) + ' Check the values in assets/firebase-config.js.';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
