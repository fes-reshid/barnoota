/* ==========================================================================
   AOCAV — editable content and language switching
   --------------------------------------------------------------------------
   Every visible piece of copy on the site is found automatically: no special
   markup is needed in the HTML. Each piece gets a stable key, and the admin
   page can store an English replacement and an Afaan Oromoo translation for
   it. If no translation exists, the English in the HTML is what shows.

   Only TEXT NODES are ever written. Icons, bold tags and links inside an
   element are left exactly as they are, and nothing can inject markup.

   Exposes window.AocavCms.
   ========================================================================== */
window.AocavCms = (function () {
  'use strict';

  var LANGS = { en: 'English', om: 'Afaan Oromoo' };
  var STORE_KEY = 'aocav.lang';

  // Elements that can hold a line of copy.
  var SEL = 'h1,h2,h3,h4,h5,p,li,a,button,span,b,strong,em,dt,dd,label,legend,' +
            'figcaption,small,blockquote,th,td,summary';

  // Regions that are generated, decorative or not translatable copy.
  var SKIP = '[data-events],[data-links],.lightbox,[data-cms-ignore],.visually-hidden,' +
             '.marquee,[data-year],script,style,svg,.toast-host,[data-preview],.lang-switch';

  /* ------------------------------------------------------------- helpers */
  function pageIdOf(doc) {
    var path = (doc && doc.__aocavPath) ||
      (doc.location ? doc.location.pathname : '') || '';
    var file = path.split('/').pop() || 'index.html';
    return file.replace(/\.html?$/, '') || 'index';
  }

  // The text this element owns directly — not its children's.
  function ownTextNodes(el) {
    var out = [];
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) out.push(n);
    }
    return out;
  }

  function ownText(el) {
    return ownTextNodes(el).map(function (n) { return n.nodeValue; }).join('').replace(/\s+/g, ' ').trim();
  }

  /* --------------------------------------------------------------- keys */
  // A key is built from the words themselves, not from a position, so adding
  // a menu item or moving a section does not shuffle everyone's translations.
  //   page__scope__some-words-from-the-text
  // Changing the English in the HTML does make a new key: that is deliberate,
  // because the old translation may no longer be right.
  function slugKey(text) {
    return String(text).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'text';
  }

  function collect(doc, pageId) {
    pageId = pageId || pageIdOf(doc);
    var root = doc.body || doc;
    if (!root || !root.querySelectorAll) return [];

    var sections = Array.prototype.slice.call(root.querySelectorAll('section'));
    var seen = {};
    var items = [];
    var isCopy = function (t) { return /[A-Za-z\u00C0-\u024F]/.test(t); };

    Array.prototype.forEach.call(root.querySelectorAll(SEL), function (el) {
      if (el.closest(SKIP)) return;
      var nodes = ownTextNodes(el).filter(function (n) { return isCopy(n.nodeValue); });
      if (!nodes.length) return;

      var page = pageId, scope;
      if (el.closest('.site-footer')) { page = 'global'; scope = 'footer'; }
      else if (el.closest('.site-header')) { page = 'global'; scope = 'nav'; }
      else {
        var sec = el.closest('section');
        scope = sec ? (sec.id || ('s' + sections.indexOf(sec))) : 'main';
      }

      var tag = el.tagName.toLowerCase();

      nodes.forEach(function (node) {
        var text = node.nodeValue.replace(/\s+/g, ' ').trim();
        var key = page + '__' + scope + '__' + slugKey(text);
        // two identical phrases in one section: number them
        seen[key] = (seen[key] || 0) + 1;
        if (seen[key] > 1) key += '__' + seen[key];

        items.push({
          key: key, page: page, scope: scope, tag: tag,
          text: text, node: node, el: el
        });
      });
    });

    return items;
  }

  /* ------------------------------------------------------------- applying */
  // Only the text node is written — icons, bold tags and links are untouched,
  // and no markup can be injected because innerHTML is never used.
  function setText(node, value) {
    if (!node) return;
    var lead = /^\s*/.exec(node.nodeValue)[0];
    var tail = /\s*$/.exec(node.nodeValue)[0];
    node.nodeValue = lead + value + tail;
  }

  /* ---------------------------------------------------------- language */
  function getLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q && LANGS[q]) { localStorage.setItem(STORE_KEY, q); return q; }
      var saved = localStorage.getItem(STORE_KEY);
      if (saved && LANGS[saved]) return saved;
    } catch (e) { /* private mode */ }
    return 'en';
  }

  function setLang(lang) {
    if (!LANGS[lang]) lang = 'en';
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* ignore */ }
    document.documentElement.lang = lang === 'om' ? 'om' : 'en';
    return lang;
  }

  /* ------------------------------------------------------------- render */
  // content: { key: { en, om } }
  var items = null;        // collected ONCE, before anything is translated
  var originals = null;    // the wording the HTML itself shipped with

  function apply(content, lang) {
    content = content || {};

    // Keys are built from the English words on the page. The moment a
    // translation is written, those words are gone — so collecting again
    // would produce keys made of Afaan Oromoo, match nothing, and leave the
    // page stuck in whatever language it happened to be in. Collect once,
    // keep the node references, and reuse them for every later switch.
    if (!items) {
      items = collect(document);
      originals = {};
      items.forEach(function (it) { originals[it.key] = it.text; });
    }

    items.forEach(function (it) {
      if (!it.node || !it.node.parentNode) return;
      var rec = content[it.key] || {};
      var value = (lang === 'om' && rec.om) ? rec.om : (rec.en || originals[it.key]);
      if (value === undefined || value === null) return;
      var showing = it.node.nodeValue.replace(/\s+/g, ' ').trim();
      if (value !== showing) setText(it.node, value);
    });

    document.documentElement.lang = lang === 'om' ? 'om' : 'en';
    document.documentElement.setAttribute('data-lang', lang);
  }

  /* -------------------------------------------------------- the switcher */
  function mountSwitcher(onChange) {
    var hosts = document.querySelectorAll('[data-lang-switch]');
    if (!hosts.length) return;
    var lang = getLang();
    Array.prototype.forEach.call(hosts, function (host) {
      host.innerHTML = '';
      Object.keys(LANGS).forEach(function (code) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lang-btn';
        b.textContent = code === 'om' ? 'AFO' : 'ENG';
        b.title = LANGS[code];
        b.setAttribute('aria-pressed', String(code === lang));
        b.setAttribute('lang', code === 'om' ? 'om' : 'en');
        b.addEventListener('click', function () {
          lang = setLang(code);
          document.querySelectorAll('.lang-btn').forEach(function (x) {
            x.setAttribute('aria-pressed', String(x.textContent === (code === 'om' ? 'AFO' : 'ENG')));
          });
          if (onChange) onChange(lang);
        });
        host.appendChild(b);
      });
    });
  }

  return {
    LANGS: LANGS,
    collect: collect, apply: apply, slugKey: slugKey, setText: setText, ownText: ownText,
    getLang: getLang, setLang: setLang, mountSwitcher: mountSwitcher,
    pageIdOf: pageIdOf
  };
})();
