/* ==========================================================================
   AOCAV — data layer
   Reads events from Firebase when it is set up, and falls back to the events
   bundled in assets/events.js whenever it is not (or when the network, the
   project or the rules say no). The public site must never break because of
   Firebase, so every path here resolves rather than rejects.
   Exposes window.AocavStore.
   ========================================================================== */
window.AocavStore = (function () {
  'use strict';

  // Pinned on purpose: an unpinned CDN URL can change under the site.
  var SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
  var COLLECTION = 'events';
  var CONTENT = 'content';
  var LINKS = 'links';
  var cfg = window.AOCAV_FIREBASE || {};
  var appPromise = null;
  var mods = {};

  function configured() {
    var need = ['apiKey', 'authDomain', 'projectId', 'appId'];
    return need.every(function (k) {
      var v = cfg[k];
      return typeof v === 'string' && v && v.indexOf('PASTE_') === -1;
    });
  }

  function mod(name) {
    if (!mods[name]) mods[name] = import(SDK + 'firebase-' + name + '.js');
    return mods[name];
  }

  function app() {
    if (!configured()) return Promise.reject(new Error('Firebase is not configured yet'));
    if (!appPromise) {
      appPromise = mod('app').then(function (m) {
        return m.getApps().length ? m.getApps()[0] : m.initializeApp(cfg);
      });
    }
    return appPromise;
  }

  // -> { fs: <firestore module>, db: <Firestore> }
  function db() {
    return Promise.all([app(), mod('firestore')]).then(function (r) {
      return { fs: r[1], db: r[1].getFirestore(r[0]) };
    });
  }

  function bundled() {
    return (window.AOCAV_EVENTS || []).slice();
  }

  /* ------------------------------------------------------------- read */
  // Always resolves: { events, source: 'firebase'|'bundled', error }
  function loadEvents(opts) {
    var includeDrafts = !!(opts && opts.includeDrafts);
    if (!configured()) {
      return Promise.resolve({ events: bundled(), source: 'bundled' });
    }
    return db().then(function (h) {
      var col = h.fs.collection(h.db, COLLECTION);
      // Drafts are fetched only for the admin; the security rules refuse them
      // to everyone else, so the public query has to filter server-side.
      return h.fs.getDocs(includeDrafts ? col : h.fs.query(col, h.fs.where('published', '==', true)));
    }).then(function (snap) {
      var list = [];
      snap.forEach(function (d) {
        var ev = d.data() || {};
        ev.id = ev.id || d.id;
        ev._docId = d.id;
        if (includeDrafts || ev.published !== false) list.push(ev);
      });
      // An empty collection almost always means "not seeded yet", not
      // "the community has no events" — show the bundled ones instead.
      if (!list.length && !includeDrafts) {
        return { events: bundled(), source: 'bundled', empty: true };
      }
      return { events: list, source: 'firebase' };
    }).catch(function (err) {
      if (window.console) console.warn('AOCAV: using the bundled events —', err && err.message);
      return { events: bundled(), source: 'bundled', error: err };
    });
  }

  /* --------------------------------------------------- content & links */
  function bundledContent() {
    var out = {};
    var src = window.AOCAV_CONTENT || {};
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
    return out;
  }

  // Always resolves. Firebase entries are merged over the bundled ones, so a
  // translation that has not been edited yet still shows.
  function loadContent() {
    var base = bundledContent();
    if (!configured()) return Promise.resolve({ content: base, source: 'bundled' });
    return db().then(function (h) {
      return h.fs.getDocs(h.fs.collection(h.db, CONTENT));
    }).then(function (snap) {
      snap.forEach(function (d) {
        var v = d.data() || {};
        base[d.id] = { en: v.en || '', om: v.om || '' };
      });
      return { content: base, source: 'firebase' };
    }).catch(function (err) {
      if (window.console) console.warn('AOCAV: using the bundled wording —', err && err.message);
      return { content: base, source: 'bundled', error: err };
    });
  }

  function saveContent(key, rec) {
    return db().then(function (h) {
      var doc = h.fs.doc(h.db, CONTENT, key);
      var clean = { en: (rec.en || '').trim(), om: (rec.om || '').trim() };
      if (!clean.en && !clean.om) return h.fs.deleteDoc(doc);
      clean.updatedAt = h.fs.serverTimestamp();
      return h.fs.setDoc(doc, clean);
    });
  }

  function bundledLinks() { return (window.AOCAV_LINKS || []).slice(); }

  function loadLinks(opts) {
    var includeDrafts = !!(opts && opts.includeDrafts);
    if (!configured()) return Promise.resolve({ links: bundledLinks(), source: 'bundled' });
    return db().then(function (h) {
      var col = h.fs.collection(h.db, LINKS);
      return h.fs.getDocs(includeDrafts ? col : h.fs.query(col, h.fs.where('published', '==', true)));
    }).then(function (snap) {
      var list = [];
      snap.forEach(function (d) {
        var v = d.data() || {};
        v.id = v.id || d.id;
        list.push(v);
      });
      if (!list.length && !includeDrafts) return { links: bundledLinks(), source: 'bundled', empty: true };
      return { links: list, source: 'firebase' };
    }).catch(function (err) {
      if (window.console) console.warn('AOCAV: using the bundled links —', err && err.message);
      return { links: bundledLinks(), source: 'bundled', error: err };
    });
  }

  var LINK_FIELDS = ['id', 'cat', 'title', 'titleOm', 'desc', 'descOm', 'url', 'phone', 'order', 'published'];

  function saveLink(link) {
    var data = {};
    LINK_FIELDS.forEach(function (f) { if (link[f] !== undefined) data[f] = link[f]; });
    data.id = link.id;
    data.published = link.published !== false;
    data.order = Number(link.order) || 0;
    return db().then(function (h) {
      data.updatedAt = h.fs.serverTimestamp();
      return h.fs.setDoc(h.fs.doc(h.db, LINKS, link.id), data).then(function () { return data; });
    });
  }

  function deleteLink(id) {
    return db().then(function (h) { return h.fs.deleteDoc(h.fs.doc(h.db, LINKS, id)); });
  }

  function seedLinks() {
    var list = bundledLinks();
    return db().then(function (h) {
      return Promise.all(list.map(function (l) {
        var data = {};
        LINK_FIELDS.forEach(function (f) { if (l[f] !== undefined) data[f] = l[f]; });
        data.id = l.id;
        data.published = l.published !== false;
        data.order = Number(l.order) || 0;
        data.updatedAt = h.fs.serverTimestamp();
        return h.fs.setDoc(h.fs.doc(h.db, LINKS, l.id), data, { merge: true });
      }));
    }).then(function () { return list.length; });
  }

  /* ------------------------------------------------------------ write */
  // These need a signed-in admin; the security rules are what enforce it.
  function saveEvent(ev) {
    var data = {};
    (window.AocavCards ? window.AocavCards.FIELDS : Object.keys(ev)).forEach(function (f) {
      if (ev[f] !== undefined) data[f] = ev[f];
    });
    data.id = ev.id;
    data.published = ev.published !== false;
    return db().then(function (h) {
      data.updatedAt = h.fs.serverTimestamp();
      return h.fs.setDoc(h.fs.doc(h.db, COLLECTION, ev.id), data, { merge: false }).then(function () { return data; });
    });
  }

  function deleteEvent(id) {
    return db().then(function (h) {
      return h.fs.deleteDoc(h.fs.doc(h.db, COLLECTION, id));
    });
  }

  // Clears `featured` on every event except `keepId`, so only one banner shows.
  function makeSoleFeatured(keepId) {
    return db().then(function (h) {
      return h.fs.getDocs(h.fs.collection(h.db, COLLECTION)).then(function (snap) {
        var jobs = [];
        snap.forEach(function (d) {
          if (d.id !== keepId && (d.data() || {}).featured) {
            jobs.push(h.fs.updateDoc(h.fs.doc(h.db, COLLECTION, d.id), { featured: false }));
          }
        });
        return Promise.all(jobs);
      });
    });
  }

  // First-run: copy assets/events.js into Firestore.
  function seedFromBundle() {
    var list = bundled();
    return db().then(function (h) {
      return Promise.all(list.map(function (ev) {
        var data = {};
        (window.AocavCards ? window.AocavCards.FIELDS : Object.keys(ev)).forEach(function (f) {
          if (ev[f] !== undefined) data[f] = ev[f];
        });
        data.id = ev.id;
        data.published = ev.published !== false;
        data.updatedAt = h.fs.serverTimestamp();
        return h.fs.setDoc(h.fs.doc(h.db, COLLECTION, ev.id), data, { merge: true });
      }));
    }).then(function () { return list.length; });
  }

  /* ----------------------------------------------------------- upload */
  // Returns the public download URL for a poster image.
  function uploadPoster(file, onProgress) {
    return Promise.all([app(), mod('storage')]).then(function (r) {
      var st = r[1], storage = st.getStorage(r[0]);
      var safe = file.name.replace(/[^\w.\-]+/g, '-').toLowerCase();
      var ref = st.ref(storage, 'posters/' + Date.now() + '-' + safe);
      var task = st.uploadBytesResumable(ref, file, { contentType: file.type });
      return new Promise(function (resolve, reject) {
        task.on('state_changed',
          function (s) { if (onProgress) onProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)); },
          reject,
          function () { st.getDownloadURL(ref).then(resolve, reject); });
      });
    });
  }

  return {
    SDK: SDK, COLLECTION: COLLECTION, CONTENT: CONTENT, LINKS: LINKS,
    LINK_FIELDS: LINK_FIELDS, config: cfg,
    configured: configured, mod: mod, app: app, db: db, bundled: bundled,
    loadEvents: loadEvents, saveEvent: saveEvent, deleteEvent: deleteEvent,
    makeSoleFeatured: makeSoleFeatured, seedFromBundle: seedFromBundle,
    uploadPoster: uploadPoster,
    bundledContent: bundledContent, loadContent: loadContent, saveContent: saveContent,
    bundledLinks: bundledLinks, loadLinks: loadLinks, saveLink: saveLink,
    deleteLink: deleteLink, seedLinks: seedLinks
  };
})();
