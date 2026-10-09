/* ==========================================================================
   AOCAV — shared event model, card renderer and calendar export.
   Used by the public pages (app.js) and by the admin preview (admin.js) so
   an event always looks the same in both places.
   Exposes window.AocavCards. No dependencies.
   ========================================================================== */
window.AocavCards = (function () {
  'use strict';

  var TZ = 'Australia/Melbourne';

  var ICON = {
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M14 6v12"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7 3.7C19 15.6 12 20 12 20Z"/></svg>'
  };

  /* ---------------------------------------------------------- utilities */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Strip any markup and decode entities, for plain-text uses such as the
  // .ics file and the search-engine data.
  // DOMParser is used rather than a detached div: assigning innerHTML to a
  // div still creates live elements, so `<img src=x onerror=...>` would run.
  // A DOMParser document has no browsing context, so nothing executes or loads.
  function plain(html) {
    var s = String(html == null ? '' : html);
    if (s.indexOf('<') === -1 && s.indexOf('&') === -1) return s.trim();
    try {
      return (new DOMParser().parseFromString(s, 'text/html').body.textContent || '').trim();
    } catch (e) {
      return s.replace(/<[^>]*>/g, '').trim();
    }
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
  // Wall-clock time in Melbourne -> the real UTC instant
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
    if (lang === 'om') {
      return OM_DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + OM_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    }
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtMonthShort(d) {
    return lang === 'om' ? OM_MONTHS_SHORT[d.getMonth()]
                         : d.toLocaleDateString('en-AU', { month: 'short' });
  }
  function fmtTime(d) {
    return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
      .replace(/\s?([ap])\.?m\.?/i, function (_, p) { return p.toLowerCase() + 'm'; });
  }
  function utcStamp(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function wallStamp(s) { return String(s).replace(/[-:]/g, '') + '00'; }

  // Anything reaching href or src: allow real links and relative paths only.
  function safeUrl(u) {
    var v = String(u == null ? '' : u).trim();
    if (!v || v.slice(0, 2) === '//') return '';
    if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
    if (/^[\w./?#=&%+~:,'!()\[\] -]+$/.test(v) && v.indexOf(':') === -1) return v;
    return '';
  }

  // ---------------------------------------------------------------- language
  var lang = 'en';
  function setLang(l) { lang = (l === 'om') ? 'om' : 'en'; }

  // Wording the renderer produces itself, rather than taking from an event.
  var UI = {
    en: { held:'Held', ongoing:'Ongoing', saveDate:'Save the date', upcoming:'Upcoming',
          ongoingProgram:'Ongoing program', register:'Register',
          addToCalendar:'Add to calendar', viewPoster:'View poster',
          untitled:'Untitled event', poster:'event poster', playFor:'Play the video for' },
    om: { held:'Darbeera', ongoing:'Itti fufaa', saveDate:'Guyyaa qabadhaa', upcoming:'Dhufaa jira',
          ongoingProgram:'Sagantaa itti fufaa', register:'Galmaa\u2019aa',
          addToCalendar:'Kaalendaritti dabalaa', viewPoster:'Poostara ilaalaa',
          untitled:'Taatee maqaa hin qabne', poster:'poostara taatee', playFor:'Viidiyoo kana taphachiisi:' }
  };
  function T(k) { return (UI[lang] && UI[lang][k]) || UI.en[k]; }

  // en-AU gives English weekday and month names, and there is no reliable
  // Afaan Oromoo locale in browsers, so the names are spelled out here.
  var OM_DAYS = ['Dilbata','Wiixata','Kibxata','Roobii','Kamisa','Jimaata','Sanbata'];
  var OM_MONTHS = ['Amajjii','Guraandhala','Bitootessa','Elba','Caamsaa','Waxabajjii',
                   'Adoolessa','Hagayya','Fuulbana','Onkoloolessa','Sadaasa','Muddee'];
  var OM_MONTHS_SHORT = ['Ama','Gur','Bit','Elb','Caa','Wax','Ado','Hag','Ful','Onk','Sad','Mud'];
  // Afaan Oromoo wording when the committee has written it, English otherwise.
  function L(ev, field) {
    if (lang === 'om') {
      var v = ev[field + 'Om'];
      if (v && String(v).trim()) return v;
    }
    return ev[field] || '';
  }

  // ------------------------------------------------------------------ video
  // Accepts any YouTube address a person is likely to paste.
  function ytId(url) {
    var u = String(url || '').trim();
    if (!u) return '';
    var m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(u) ? u : '';
  }

  var PLAY = '<svg viewBox="0 0 68 48" aria-hidden="true"><path d="M66.5 7.5a8.6 8.6 0 0 0-6-6C55.2 0 34 0 34 0S12.8 0 7.5 1.4a8.6 8.6 0 0 0-6 6A90 90 0 0 0 0 24a90 90 0 0 0 1.5 16.5 8.6 8.6 0 0 0 6 6C12.8 48 34 48 34 48s21.2 0 26.5-1.4a8.6 8.6 0 0 0 6-6A90 90 0 0 0 68 24a90 90 0 0 0-1.5-16.5Z" fill="#d61f2e"/><path d="M27 34 45 24 27 14Z" fill="#fff"/></svg>';

  // A still image with a play button: YouTube is only contacted once the
  // visitor actually asks to watch, so the page stays fast and private.
  function videoBlock(ev) {
    var id = ytId(ev.video);
    if (!id) return '';
    var label = esc(plain(L(ev, 'title')) || 'event video');
    return '<div class="ev-video">' +
      '<button type="button" class="yt-facade" data-yt="' + id + '" ' +
      'aria-label="' + esc(T('playFor')) + ' ' + label + '">' +
      '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" loading="lazy" decoding="async">' +
      '<span class="yt-play">' + PLAY + '</span></button></div>';
  }

  function photoList(ev) {
    return (ev.photos || []).map(safeUrl).filter(Boolean);
  }

  function galleryBlock(ev) {
    var pics = photoList(ev);
    if (!pics.length) return '';
    var label = esc(plain(L(ev, 'title')));
    return '<div class="ev-gallery">' + pics.map(function (src, i) {
      return '<button type="button" class="ev-thumb" data-zoom="' + esc(src) +
        '" data-zoom-alt="' + label + ' — photo ' + (i + 1) + '">' +
        '<img src="' + esc(src) + '" alt="' + label + ' — photo ' + (i + 1) + '" loading="lazy" decoding="async">' +
        '</button>';
    }).join('') + '</div>';
  }

  function slugify(s) {
    return plain(s).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'event';
  }

  /* --------------------------------------------------- the event model */
  // Adds the derived fields the renderer needs. Never mutates the input.
  function normalise(list) {
    return (list || []).map(function (ev) {
      var e = {};
      for (var k in ev) if (Object.prototype.hasOwnProperty.call(ev, k)) e[k] = ev[k];
      e.startDate = parseLocal(e.start);
      e.endDate = parseLocal(e.end);
      e.recurring = e.status === 'recurring' || (!e.startDate && !!e.when);
      var cutoff = e.endDate || e.startDate;
      e.past = !e.recurring && !!cutoff && cutoff.getTime() < Date.now();
      e.group = e.past ? 'past' : (e.recurring ? 'programs' : 'upcoming');
      return e;
    });
  }
  function sortUpcoming(a, b) { return (a.startDate ? a.startDate : 0) - (b.startDate ? b.startDate : 0); }

  // Full calendar order: upcoming first, then programs, then past (newest first)
  function sortAll(a, b) {
    var rank = function (e) { return e.past ? 2 : (e.recurring ? 1 : 0); };
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (a.startDate && b.startDate) return a.past ? b.startDate - a.startDate : a.startDate - b.startDate;
    return 0;
  }

  /* ------------------------------------------------------------ pieces */
  function metaList(ev, limited) {
    var rows = [];
    if (ev.recurring) {
      rows.push([ICON.repeat, esc(L(ev, 'when') || T('ongoingProgram'))]);
    } else if (ev.startDate) {
      rows.push([ICON.cal, fmtDate(ev.startDate)]);
      rows.push([ICON.clock, fmtTime(ev.startDate) + (ev.endDate ? ' – ' + fmtTime(ev.endDate) : '')]);
    }
    if (ev.venue) {
      rows.push([ICON.pin, esc(ev.venue) +
        (ev.address && !limited ? '<br><span style="opacity:.75">' + esc(ev.address) + '</span>' : '')]);
    }
    if (L(ev, 'cost') && !limited) rows.push([ICON.ticket, esc(L(ev, 'cost'))]);
    return '<ul class="ev-meta">' + rows.map(function (r) {
      return '<li>' + r[0] + '<span>' + r[1] + '</span></li>';
    }).join('') + '</ul>';
  }

  function chip(ev) {
    if (ev.past) return '<span class="ev-chip past">' + esc(T('held')) + '</span>';
    if (ev.recurring) return '<span class="ev-chip weekly">' + esc(T('ongoing')) + '</span>';
    if (ev.status === 'save-date') return '<span class="ev-chip save">' + esc(T('saveDate')) + '</span>';
    return '<span class="ev-chip">' + esc(T('upcoming')) + '</span>';
  }

  function dateBadge(ev) {
    if (!ev.startDate) {
      return '<div class="ev-date"><span class="d">' +
        ICON.repeat.replace('<svg', '<svg width="22" height="22"') + '</span></div>';
    }
    return '<div class="ev-date"><span class="d">' + ev.startDate.getDate() + '</span><span class="m">' +
      fmtMonthShort(ev.startDate) + '</span></div>';
  }

  function actions(ev, opts) {
    if (opts && opts.preview) return '';
    var out = [];
    if (ev.rsvp && !ev.past) {
      out.push('<a class="btn btn-primary btn-sm" href="' + esc(safeUrl(ev.rsvp)) + '">' + esc(L(ev, 'rsvpLabel') || T('register')) + '</a>');
    }
    if (!ev.past && !ev.recurring && ev.startDate) {
      out.push('<button class="btn btn-ghost btn-sm" type="button" data-ics="' + esc(ev.id) + '">' + ICON.cal + esc(T('addToCalendar')) + '</button>');
    }
    if (ev.flyer) {
      out.push('<button class="btn btn-ghost btn-sm" type="button" data-zoom="' + esc(safeUrl(ev.flyer)) +
        '" data-zoom-alt="' + esc(plain(L(ev, 'title'))) + ' ' + esc(T('poster')) + '">' + esc(T('viewPoster')) + '</button>');
    }
    return out.length ? '<div class="ev-actions">' + out.join('') + '</div>' : '';
  }

  function cardHTML(ev, opts) {
    var cls = ['ev'];
    if (ev.theme === 'grad') cls.push('is-grad');
    if (ev.theme === 'culture') cls.push('is-culture');
    if (ev.past) cls.push('is-past');
    if (!opts || !opts.preview) cls.push('reveal');
    return '<article class="' + cls.join(' ') + '" id="event-' + esc(ev.id) + '">' +
      '<div class="ev-top"><div class="ev-top-row">' + dateBadge(ev) + chip(ev) + '</div>' +
      '<h3 class="ev-title">' + esc(L(ev, 'title') || T('untitled')) + '</h3></div>' +
      '<div class="ev-body">' + metaList(ev, false) +
      '<p class="ev-desc">' + esc(L(ev, 'desc') || '') + '</p>' +
      videoBlock(ev) + galleryBlock(ev) + actions(ev, opts) + '</div></article>';
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

  function featureHTML(ev, opts) {
    var preview = !!(opts && opts.preview);
    var hl = (lang === 'om' && ev.highlightsOm && ev.highlightsOm.length) ? ev.highlightsOm : (ev.highlights || []);
    var list = hl.map(function (h) {
      return '<li>' + ICON.heart + '<span>' + esc(h) + '</span></li>';
    }).join('');
    return '<div class="feature' + (preview ? '' : ' reveal') + '" id="event-' + esc(ev.id) + '">' +
      '<div class="feature-body">' + chip(ev) +
      '<h3>' + esc(L(ev, 'title') || T('untitled')) + '</h3>' +
      '<p>' + esc(L(ev, 'desc') || '') + '</p>' + metaList(ev, false) +
      (list ? '<ul class="tick" style="margin-top:22px">' + list + '</ul>' : '') +
      (preview ? '' :
        '<div class="ev-actions" style="margin-top:28px">' +
        (ev.rsvp ? '<a class="btn btn-light" href="' + esc(safeUrl(ev.rsvp)) + '">' + esc(L(ev, 'rsvpLabel') || T('register')) + ICON.arrow + '</a>' : '') +
        (ev.startDate ? '<button class="btn btn-light" type="button" data-ics="' + esc(ev.id) + '">' + ICON.cal + esc(T('addToCalendar')) + '</button>' : '') +
        '</div>') +
      '</div><div class="feature-side">' + (videoBlock(ev) || capArt()) + '</div></div>';
  }

  /* ------------------------------------------------- calendar (.ics) */
  function icsText(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function buildICS(ev) {
    if (!ev || !ev.start) return null;
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AOCAV//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE', 'TZID:Australia/Melbourne',
      'BEGIN:STANDARD', 'DTSTART:19700405T030000', 'RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=1SU',
      'TZOFFSETFROM:+1100', 'TZOFFSETTO:+1000', 'TZNAME:AEST', 'END:STANDARD',
      'BEGIN:DAYLIGHT', 'DTSTART:19701004T020000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=1SU',
      'TZOFFSETFROM:+1000', 'TZOFFSETTO:+1100', 'TZNAME:AEDT', 'END:DAYLIGHT',
      'END:VTIMEZONE',
      'BEGIN:VEVENT', 'UID:' + ev.id + '@aocav.com', 'DTSTAMP:' + utcStamp(new Date()),
      'DTSTART;TZID=Australia/Melbourne:' + wallStamp(ev.start),
      'DTEND;TZID=Australia/Melbourne:' + wallStamp(ev.end || ev.start),
      'SUMMARY:' + icsText(plain(L(ev, 'title'))),
      'DESCRIPTION:' + icsText(plain(L(ev, 'desc')) + ' — Australian Oromo Community Association in Victoria.'),
      'LOCATION:' + icsText([ev.venue, ev.address].filter(Boolean).join(', ')),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function downloadICS(ev) {
    var ics = buildICS(ev);
    if (ics) download(ev.id + '.ics', ics, 'text/calendar;charset=utf-8');
  }

  /* --------------------------------------------- structured data (SEO) */
  function schemaFor(events) {
    return events.filter(function (e) { return !e.past && e.startDate; }).map(function (e) {
      var s = melbourneInstant(e.start), en = e.end ? melbourneInstant(e.end) : null;
      return {
        '@context': 'https://schema.org', '@type': 'Event',
        name: plain(L(e, 'title')),
        startDate: s ? s.toISOString() : undefined,
        endDate: en ? en.toISOString() : undefined,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        description: plain(L(e, 'desc')),
        image: e.flyer ? [new URL(e.flyer, location.href).href] : undefined,
        location: {
          '@type': 'Place', name: plain(e.venue || ''),
          address: {
            '@type': 'PostalAddress', streetAddress: plain(e.address || ''),
            addressRegion: 'VIC', addressCountry: 'AU'
          }
        },
        organizer: {
          '@type': 'Organization',
          name: 'Australian Oromo Community Association in Victoria',
          url: 'https://www.aocav.com/'
        }
      };
    });
  }

  /* ------------------------------------ serialise back to events.js */
  var FIELDS = ['id', 'title', 'titleOm', 'start', 'end', 'when', 'whenOm', 'status',
    'theme', 'category', 'featured', 'venue', 'address', 'cost', 'costOm',
    'desc', 'descOm', 'highlights', 'highlightsOm', 'flyer', 'photos', 'video',
    'funder', 'rsvp', 'rsvpLabel', 'rsvpLabelOm', 'published'];

  function toSeedFile(events) {
    var body = events.map(function (ev) {
      var lines = FIELDS.filter(function (f) {
        var v = ev[f];
        return v !== undefined && v !== null && v !== '' &&
          !(Array.isArray(v) && !v.length) && !(f === 'published' && v === true);
      }).map(function (f) {
        var v = ev[f];
        if (Array.isArray(v)) {
          return '    ' + f + ': [\n' + v.map(function (x) { return '      ' + JSON.stringify(x); }).join(',\n') + '\n    ]';
        }
        return '    ' + f + ': ' + JSON.stringify(v);
      });
      return '  {\n' + lines.join(',\n') + '\n  }';
    }).join(',\n\n');

    return '/* ==========================================================================\n' +
      '   AOCAV — Events data\n' +
      '   Exported from the admin page on ' + new Date().toLocaleString('en-AU') + '.\n' +
      '   This file is the fallback the site uses when Firebase is unavailable.\n' +
      '   ========================================================================== */\n\n' +
      'window.AOCAV_EVENTS = [\n\n' + body + '\n\n];\n';
  }

  return {
    TZ: TZ, ICON: ICON, FIELDS: FIELDS,
    esc: esc, plain: plain, slugify: slugify, safeUrl: safeUrl,
    setLang: setLang, L: L, T: T, ytId: ytId, videoBlock: videoBlock, galleryBlock: galleryBlock,
    parseLocal: parseLocal, melbourneInstant: melbourneInstant,
    fmtDate: fmtDate, fmtTime: fmtTime,
    normalise: normalise, sortUpcoming: sortUpcoming, sortAll: sortAll,
    cardHTML: cardHTML, featureHTML: featureHTML, chip: chip, metaList: metaList,
    buildICS: buildICS, downloadICS: downloadICS, download: download,
    schemaFor: schemaFor, toSeedFile: toSeedFile
  };
})();
