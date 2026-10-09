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
    dirty: false
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
      id: '', title: '', desc: '', start: '', end: '', when: '',
      status: 'confirmed', theme: '', category: 'community',
      featured: false, published: true,
      venue: '', address: '', cost: '',
      highlights: [], flyer: '', funder: '', rsvp: '', rsvpLabel: ''
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
      funder: get('funder'),
      rsvp: get('rsvp'),
      rsvpLabel: get('rsvpLabel'),
      highlights: get('highlights').split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
    };
    if (recurring) {
      ev.when = get('when');
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
    set('rsvp', ev.rsvp); set('rsvpLabel', ev.rsvpLabel);
    set('highlights', (ev.highlights || []).join('\n'));
    check('featured', ev.featured);
    check('published', ev.published !== false);
    check('isRecurring', ev.status === 'recurring' || (!ev.start && !!ev.when));

    syncRecurring();
    refreshPoster();
    refreshPreview();
  }

  function syncRecurring() {
    var f = $('[data-form="event"]');
    var on = f.elements.isRecurring.checked;
    $('[data-when-once]').classList.toggle('hidden', on);
    $('[data-when-repeat]').classList.toggle('hidden', !on);
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

  function refreshPreview() {
    var ev = C.normalise([readForm()])[0];
    var host = $('[data-preview]');
    host.innerHTML = ev.featured
      ? C.featureHTML(ev, { preview: true })
      : C.cardHTML(ev, { preview: true });
    $('[data-highlights-group]').classList.toggle('hidden', !ev.featured);
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
            reload().catch(function (err) { toast(humanError(err), 'err'); });
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
