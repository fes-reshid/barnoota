/* ==========================================================================
   AOCAV — site behaviour
   Header, mobile nav, scroll reveal, counters, event rendering, filters,
   lightbox, calendar export, back-to-top.
   Event markup and the date logic live in cards.js; where the events come
   from lives in store.js. No build step, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.AocavCards;
  var Store = window.AocavStore;
  var Cms = window.AocavCms;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var EVENTS = [];
  var LINKS = [];
  var CONTENT = {};
  var LANG = 'en';

  /* -------------------------------------------------------------- header */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 24);
      var top = $('.totop');
      if (top) top.classList.toggle('show', window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var toggle = $('.nav-toggle'), nav = $('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open && window.innerWidth <= 1200 ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) toggle.click();
    });
  }

  /* --------------------------------------------------------- back to top */
  var totop = $('.totop');
  if (totop) {
    totop.innerHTML = C.ICON.up;
    totop.addEventListener('click', function () {
      var reduce = 'matchMedia' in window && matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------- scroll reveal */
  function observeReveals(scope) {
    var items = $$('.reveal:not(.in)', scope || document);
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        setTimeout(function () { el.classList.add('in'); }, +(el.getAttribute('data-delay') || 0));
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ counters */
  function startCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    var reduce = 'matchMedia' in window && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = target + suffix; return; }
      var t0 = null, dur = 1500;
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------------------- render */
  function render() {
    var featured = EVENTS.filter(function (e) { return e.featured && !e.past; })[0];

    var fHost = $('[data-events="featured"]');
    if (fHost && featured) fHost.innerHTML = C.featureHTML(featured);

    var uHost = $('[data-events="upcoming"]');
    if (uHost) {
      var limit = +(uHost.getAttribute('data-limit') || 3);
      var list = EVENTS.filter(function (e) {
        return !e.past && !e.recurring && (!featured || e.id !== featured.id);
      }).sort(C.sortUpcoming).slice(0, limit);
      uHost.innerHTML = list.map(function (e) { return C.cardHTML(e); }).join('') ||
        '<p class="sec-sub">New dates are being planned — please check back soon.</p>';
    }

    var pHost = $('[data-events="programs"]');
    if (pHost) {
      pHost.innerHTML = EVENTS.filter(function (e) { return e.recurring; })
        .map(function (e) { return C.cardHTML(e); }).join('');
    }

    var aHost = $('[data-events="all"]');
    if (aHost) {
      aHost.innerHTML = EVENTS.slice().sort(C.sortAll).map(function (e) {
        return C.cardHTML(e).replace('<article class="',
          '<article data-group="' + C.esc(e.group) + '" data-cat="' + C.esc(e.category || '') + '" class="');
      }).join('');
    }

    // Hand-written "Add to calendar" buttons (the Elders Voices spotlight) must
    // not sit there doing nothing if that event is later removed.
    var ids = EVENTS.map(function (e) { return e.id; });
    $$('[data-ics]').forEach(function (btn) {
      if (ids.indexOf(btn.getAttribute('data-ics')) === -1) btn.hidden = true;
    });

    injectSchema();
    observeReveals();
  }

  /* -------------------------------------------------------------- links */
  function linkCard(l) {
    var title = (LANG === 'om' && l.titleOm) ? l.titleOm : (l.title || '');
    var desc = (LANG === 'om' && l.descOm) ? l.descOm : (l.desc || '');
    var url = C.safeUrl(l.url);
    var bits = [];
    if (l.phone) {
      bits.push('<a class="btn btn-red btn-sm" href="tel:' + C.esc(String(l.phone).replace(/[^\d+]/g, '')) + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.2 2 2 0 0 1 5 3Z"/></svg>' +
        C.esc(l.phone) + '</a>');
    }
    if (url) {
      bits.push('<a class="btn btn-ghost btn-sm" href="' + C.esc(url) + '" target="_blank" rel="noopener noreferrer">' +
        'Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></a>');
    }
    var host = '';
    if (url && /^https?:/i.test(url)) {
      try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { host = ''; }
    }
    return '<article class="link-card reveal">' +
      '<h3>' + C.esc(title) + '</h3>' +
      (host ? '<span class="link-host">' + C.esc(host) + '</span>' : '') +
      '<p>' + C.esc(desc) + '</p>' +
      (bits.length ? '<div class="link-actions">' + bits.join('') + '</div>' : '') +
      '</article>';
  }

  function renderLinks() {
    var host = $('[data-links]');
    if (!host) return;
    var cats = window.AOCAV_LINK_CATEGORIES || [];
    var q = ($('[data-link-search]') || {}).value || '';
    q = q.trim().toLowerCase();

    var html = cats.map(function (cat) {
      var rows = LINKS
        .filter(function (l) { return l.cat === cat.id && l.published !== false; })
        .filter(function (l) {
          if (!q) return true;
          return [l.title, l.titleOm, l.desc, l.descOm, l.url, l.phone]
            .join(' ').toLowerCase().indexOf(q) !== -1;
        })
        .sort(function (a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
      if (!rows.length) return '';
      var heading = (LANG === 'om' && cat.titleOm) ? cat.titleOm : cat.title;
      return '<section class="link-group" id="links-' + C.esc(cat.id) + '">' +
        '<h2 class="link-group-head">' + C.esc(heading) + '</h2>' +
        '<div class="link-grid">' + rows.map(linkCard).join('') + '</div></section>';
    }).join('');

    host.innerHTML = html || '<p class="sec-sub center">Nothing matches that search.</p>';

    var jump = $('[data-link-jump]');
    if (jump && !jump.childElementCount) {
      jump.innerHTML = cats.map(function (cat) {
        return '<a class="chip" href="#links-' + C.esc(cat.id) + '">' +
          C.esc((LANG === 'om' && cat.titleOm) ? cat.titleOm : cat.title) + '</a>';
      }).join('');
    }
    observeReveals(host);
  }

  /* ------------------------------------------------------------ filters */
  function wireFilters() {
    var bar = $('[data-filters]');
    var host = $('[data-events="all"]');
    if (!bar || !host) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      $$('button', bar).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var f = btn.getAttribute('data-filter');
      var shown = 0;
      $$('article', host).forEach(function (card) {
        var ok = f === 'all' || card.getAttribute('data-group') === f || card.getAttribute('data-cat') === f;
        card.hidden = !ok;
        if (ok) shown++;
      });
      var empty = $('[data-empty]');
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* -------------------------------------------- structured data for search */
  function injectSchema() {
    var data = C.schemaFor(EVENTS);
    if (!data.length) return;
    var old = document.getElementById('aocav-event-schema');
    if (old) old.remove();
    var tag = document.createElement('script');
    tag.id = 'aocav-event-schema';
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(data);
    document.head.appendChild(tag);
  }

  /* ------------------------------------------------------------ lightbox */
  var lb = $('.lightbox');
  function openLightbox(src, alt) {
    if (!lb) return;
    var img = $('img', lb);
    img.src = src; img.alt = alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    var c = $('.close', lb); if (c) c.focus();
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.closest('.close')) closeLightbox();
    });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

  /* ------------------------------------------------- delegated behaviour */
  document.addEventListener('click', function (e) {
    var ics = e.target.closest('[data-ics]');
    if (ics) {
      var id = ics.getAttribute('data-ics');
      var ev = EVENTS.filter(function (x) { return x.id === id; })[0];
      if (ev) C.downloadICS(ev);
      return;
    }
    var yt = e.target.closest('[data-yt]');
    if (yt) {
      // Only now does the browser talk to YouTube.
      var id = yt.getAttribute('data-yt');
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      frame.title = yt.getAttribute('aria-label') || 'Video';
      frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('loading', 'lazy');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      yt.replaceWith(frame);
      return;
    }
    var zoom = e.target.closest('[data-zoom]');
    if (zoom) {
      e.preventDefault();
      openLightbox(zoom.getAttribute('data-zoom'), zoom.getAttribute('data-zoom-alt'));
    }
  });

  /* --------------------------------------------------------------- forms */
  // Static hosting has no mail server, so enquiry forms open the visitor's
  // email client with everything already filled in.
  $$('form[data-mailto]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = form.getAttribute('data-mailto');
      var fd = new FormData(form);
      var subject = form.getAttribute('data-subject') || 'Website enquiry';
      var body = [];
      fd.forEach(function (v, k) {
        if (String(v).trim()) body.push(k.replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }) + ': ' + v);
      });
      body.push('', 'Sent from aocav.com');
      var pick = fd.get('subject');
      if (pick) subject += ' — ' + pick;
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body.join('\n'));
      var note = form.querySelector('[data-sent]');
      if (note) note.hidden = false;
    });
  });

  /* ---------------------------------------------------------------- init */
  function applyLanguage(lang) {
    LANG = lang;
    C.setLang(lang);
    Cms.apply(CONTENT, lang);
    render();
    renderLinks();
  }

  function init() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    wireFilters();
    startCounters();

    LANG = Cms.getLang();
    C.setLang(LANG);

    var search = $('[data-link-search]');
    if (search) search.addEventListener('input', renderLinks);

    // Paint from the bundled copies first so the page is never empty or
    // untranslated, then refresh from Firebase if it is connected.
    CONTENT = Store.bundledContent();
    EVENTS = C.normalise(Store.bundled());
    LINKS = Store.bundledLinks();
    Cms.apply(CONTENT, LANG);
    render();
    renderLinks();
    Cms.mountSwitcher(applyLanguage);
    observeReveals();

    if (!Store.configured()) return;

    Store.loadContent().then(function (res) {
      if (res.source !== 'firebase') return;
      CONTENT = res.content;
      Cms.apply(CONTENT, LANG);
    });
    Store.loadEvents().then(function (res) {
      if (res.source !== 'firebase') return;
      EVENTS = C.normalise(res.events);
      render();
    });
    if ($('[data-links]')) {
      Store.loadLinks().then(function (res) {
        if (res.source !== 'firebase') return;
        LINKS = res.links;
        renderLinks();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
