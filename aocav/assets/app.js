/* ==========================================================================
   AOCAV — site behaviour
   Header, mobile nav, scroll reveal, counters, event rendering,
   filters, lightbox, calendar export, back-to-top.
   No build step, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TZ = 'Australia/Melbourne';

  /* ---------------------------------------------------------------- icons */
  var ICON = {
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M14 6v12"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7 3.7C19 15.6 12 20 12 20Z"/></svg>'
  };

  /* ------------------------------------------------------------ utilities */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Event copy is authored with entities like &amp; — decode for plain-text use.
  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html == null ? '' : html);
    return (d.textContent || '').trim();
  }
  function parseLocal(s) {
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(s);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  }
  function tzOffsetMinutes(date) {
    try {
      var p = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).formatToParts(date).reduce(function (a, x) { a[x.type] = x.value; return a; }, {});
      var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
      return (asUTC - date.getTime()) / 60000;
    } catch (e) { return 600; }
  }
  // Wall-clock time in Melbourne -> real UTC instant
  function melbourneInstant(wall) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(wall || '');
    if (!m) return null;
    var naive = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    var off = tzOffsetMinutes(naive);
    var real = new Date(naive.getTime() - off * 60000);
    var off2 = tzOffsetMinutes(real);
    if (off2 !== off) real = new Date(naive.getTime() - off2 * 60000);
    return real;
  }
  function fmtDate(d) {
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtTime(d) {
    return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
      .replace(/\s?([ap])\.?m\.?/i, function (_, p) { return p.toLowerCase() + 'm'; });
  }
  function utcStamp(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function wallStamp(s) { return String(s).replace(/[-:]/g, '') + '00'; }

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
      document.body.style.overflow = open && window.innerWidth <= 980 ? 'hidden' : '';
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
    totop.innerHTML = ICON.up;
    totop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'matchMedia' in window && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
        var delay = +(el.getAttribute('data-delay') || 0);
        setTimeout(function () { el.classList.add('in'); }, delay);
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
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
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

  /* -------------------------------------------------------------- events */
  var EVENTS = (window.AOCAV_EVENTS || []).map(function (ev) {
    var e = {};
    for (var k in ev) if (Object.prototype.hasOwnProperty.call(ev, k)) e[k] = ev[k];
    e.startDate = parseLocal(e.start);
    e.endDate = parseLocal(e.end);
    e.recurring = e.status === 'recurring' || (!e.startDate && !!e.when);
    var cutoff = e.endDate || e.startDate;
    e.past = !e.recurring && !!cutoff && cutoff.getTime() < Date.now();
    return e;
  });

  function sortUpcoming(a, b) { return (a.startDate ? a.startDate : 0) - (b.startDate ? b.startDate : 0); }

  function metaList(ev, limited) {
    var rows = [];
    if (ev.recurring) {
      rows.push([ICON.repeat, esc(ev.when || 'Ongoing program')]);
    } else if (ev.startDate) {
      rows.push([ICON.cal, fmtDate(ev.startDate)]);
      var t = fmtTime(ev.startDate) + (ev.endDate ? ' – ' + fmtTime(ev.endDate) : '');
      rows.push([ICON.clock, t]);
    }
    if (ev.venue) rows.push([ICON.pin, esc(ev.venue) + (ev.address && !limited ? '<br><span style="opacity:.75">' + esc(ev.address) + '</span>' : '')]);
    if (ev.cost && !limited) rows.push([ICON.ticket, esc(ev.cost)]);
    return '<ul class="ev-meta">' + rows.map(function (r) {
      return '<li>' + r[0] + '<span>' + r[1] + '</span></li>';
    }).join('') + '</ul>';
  }

  function chip(ev) {
    if (ev.past) return '<span class="ev-chip past">Held</span>';
    if (ev.recurring) return '<span class="ev-chip weekly">Ongoing</span>';
    if (ev.status === 'save-date') return '<span class="ev-chip save">Save the date</span>';
    return '<span class="ev-chip">Upcoming</span>';
  }

  function dateBadge(ev) {
    if (!ev.startDate) {
      return '<div class="ev-date"><span class="d">' + ICON.repeat.replace('<svg', '<svg width="22" height="22"') + '</span></div>';
    }
    return '<div class="ev-date"><span class="d">' + ev.startDate.getDate() + '</span><span class="m">' +
      ev.startDate.toLocaleDateString('en-AU', { month: 'short' }) + '</span></div>';
  }

  function actions(ev) {
    var out = [];
    if (ev.rsvp && !ev.past) {
      out.push('<a class="btn btn-primary btn-sm" href="' + esc(ev.rsvp) + '">' + esc(ev.rsvpLabel || 'Register') + '</a>');
    }
    if (!ev.past && !ev.recurring && ev.startDate) {
      out.push('<button class="btn btn-ghost btn-sm" type="button" data-ics="' + esc(ev.id) + '">' + ICON.cal + 'Add to calendar</button>');
    }
    if (ev.flyer) {
      out.push('<button class="btn btn-ghost btn-sm" type="button" data-zoom="' + esc(ev.flyer) + '" data-zoom-alt="' + esc(plain(ev.title)) + ' event poster">View poster</button>');
    }
    return out.length ? '<div class="ev-actions">' + out.join('') + '</div>' : '';
  }

  function cardHTML(ev) {
    var cls = ['ev'];
    if (ev.theme === 'grad') cls.push('is-grad');
    if (ev.theme === 'culture') cls.push('is-culture');
    if (ev.past) cls.push('is-past');
    return '<article class="' + cls.join(' ') + ' reveal" id="event-' + esc(ev.id) + '">' +
      '<div class="ev-top"><div class="ev-top-row">' + dateBadge(ev) + chip(ev) + '</div>' +
      '<h3 class="ev-title">' + ev.title + '</h3></div>' +
      '<div class="ev-body">' + metaList(ev, false) +
      '<p class="ev-desc">' + ev.desc + '</p>' + actions(ev) + '</div></article>';
  }

  function featureHTML(ev) {
    var list = (ev.highlights || []).map(function (h) {
      return '<li>' + ICON.heart + '<span>' + esc(h) + '</span></li>';
    }).join('');
    return '<div class="feature reveal" id="event-' + esc(ev.id) + '">' +
      '<div class="feature-body">' + chip(ev).replace('ev-chip', 'ev-chip') +
      '<h3>' + ev.title + '</h3>' +
      '<p>' + ev.desc + '</p>' + metaList(ev, false) +
      (list ? '<ul class="tick" style="margin-top:22px">' + list + '</ul>' : '') +
      '<div class="ev-actions" style="margin-top:28px">' +
      (ev.rsvp ? '<a class="btn btn-light" href="' + esc(ev.rsvp) + '">' + esc(ev.rsvpLabel || 'Register') + ICON.arrow + '</a>' : '') +
      (ev.startDate ? '<button class="btn btn-light" type="button" data-ics="' + esc(ev.id) + '">' + ICON.cal + 'Add to calendar</button>' : '') +
      '</div></div>' +
      '<div class="feature-side">' + capArt() + '</div></div>';
  }

  function capArt() {
    return '<svg class="cap-art" viewBox="0 0 220 180" role="img" aria-label="Graduation cap illustration">' +
      '<defs><linearGradient id="capg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#1b1b1b"/><stop offset="1" stop-color="#000"/></linearGradient>' +
      '<linearGradient id="goldg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f3d87a"/><stop offset="1" stop-color="#c9a227"/></linearGradient></defs>' +
      '<path d="M110 22 206 62l-96 40L14 62Z" fill="url(#capg)" stroke="#f3d87a" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M52 78v38c0 14 26 24 58 24s58-10 58-24V78l-58 24Z" fill="url(#capg)" stroke="#f3d87a" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M196 66v44" stroke="url(#goldg)" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="196" cy="64" r="6" fill="url(#goldg)"/>' +
      '<path d="M188 110h16l-4 26c0 5-8 5-8 0Z" fill="url(#goldg)"/>' +
      '<g opacity=".9" fill="#f3d87a"><circle cx="30" cy="30" r="3"/><circle cx="188" cy="152" r="3.4"/><circle cx="42" cy="150" r="2.4"/></g>' +
      '</svg>';
  }

  /* ICS download */
  function downloadICS(ev) {
    if (!ev || !ev.start) return;
    var uid = ev.id + '@aocav.com';
    var now = utcStamp(new Date());
    var endWall = ev.end || ev.start;
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AOCAV//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE', 'TZID:Australia/Melbourne',
      'BEGIN:STANDARD', 'DTSTART:19700405T030000', 'RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=1SU',
      'TZOFFSETFROM:+1100', 'TZOFFSETTO:+1000', 'TZNAME:AEST', 'END:STANDARD',
      'BEGIN:DAYLIGHT', 'DTSTART:19701004T020000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=1SU',
      'TZOFFSETFROM:+1000', 'TZOFFSETTO:+1100', 'TZNAME:AEDT', 'END:DAYLIGHT',
      'END:VTIMEZONE',
      'BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + now,
      'DTSTART;TZID=Australia/Melbourne:' + wallStamp(ev.start),
      'DTEND;TZID=Australia/Melbourne:' + wallStamp(endWall),
      'SUMMARY:' + icsText(plain(ev.title)),
      'DESCRIPTION:' + icsText(plain(ev.desc) + ' — Australian Oromo Community Association in Victoria.'),
      'LOCATION:' + icsText([ev.venue, ev.address].filter(Boolean).join(', ')),
      'END:VEVENT', 'END:VCALENDAR'
    ];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = ev.id + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function icsText(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  /* render targets */
  function render() {
    var featured = EVENTS.filter(function (e) { return e.featured && !e.past; })[0];

    var fHost = $('[data-events="featured"]');
    if (fHost && featured) fHost.innerHTML = featureHTML(featured);

    var uHost = $('[data-events="upcoming"]');
    if (uHost) {
      var limit = +(uHost.getAttribute('data-limit') || 3);
      var list = EVENTS.filter(function (e) {
        return !e.past && !e.recurring && (!featured || e.id !== featured.id);
      }).sort(sortUpcoming).slice(0, limit);
      uHost.innerHTML = list.map(cardHTML).join('') ||
        '<p class="sec-sub">New dates are being planned — please check back soon.</p>';
    }

    var pHost = $('[data-events="programs"]');
    if (pHost) {
      pHost.innerHTML = EVENTS.filter(function (e) { return e.recurring; }).map(cardHTML).join('');
    }

    var aHost = $('[data-events="all"]');
    if (aHost) {
      var all = EVENTS.slice().sort(function (a, b) {
        var rank = function (e) { return e.past ? 2 : (e.recurring ? 1 : 0); };
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        if (a.startDate && b.startDate) return a.past ? b.startDate - a.startDate : a.startDate - b.startDate;
        return 0;
      });
      aHost.innerHTML = all.map(function (e) {
        var group = e.past ? 'past' : (e.recurring ? 'programs' : 'upcoming');
        return cardHTML(e).replace('<article class="', '<article data-group="' + group + '" data-cat="' + esc(e.category || '') + '" class="');
      }).join('');
    }

    injectSchema();
    observeReveals();
  }

  /* filters (events page) */
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

  /* structured data for search engines */
  function injectSchema() {
    var items = EVENTS.filter(function (e) { return !e.past && e.startDate; });
    if (!items.length) return;
    var data = items.map(function (e) {
      var s = melbourneInstant(e.start), en = e.end ? melbourneInstant(e.end) : null;
      return {
        '@context': 'https://schema.org', '@type': 'Event',
        name: plain(e.title),
        startDate: s ? s.toISOString() : undefined,
        endDate: en ? en.toISOString() : undefined,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        description: plain(e.desc),
        location: {
          '@type': 'Place', name: plain(e.venue || ''),
          address: { '@type': 'PostalAddress', streetAddress: plain(e.address || ''), addressRegion: 'VIC', addressCountry: 'AU' }
        },
        organizer: { '@type': 'Organization', name: 'Australian Oromo Community Association in Victoria', url: 'https://www.aocav.com/' }
      };
    });
    var tag = document.createElement('script');
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
      downloadICS(EVENTS.filter(function (x) { return x.id === id; })[0]);
      return;
    }
    var zoom = e.target.closest('[data-zoom]');
    if (zoom) {
      e.preventDefault();
      openLightbox(zoom.getAttribute('data-zoom'), zoom.getAttribute('data-zoom-alt'));
    }
  });

  /* -------------------------------------------------------------- forms */
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
  function init() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    render();
    wireFilters();
    observeReveals();
    startCounters();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
