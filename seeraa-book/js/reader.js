/* ============================================================
   SEERAA QUEST — book reader engine
   Renders a book object (window.SEERAA_BOOK) as turnable pages.
   ============================================================ */
(function(){
  'use strict';

  var BOOK = window.SEERAA_BOOK;
  if(!BOOK){ document.body.innerHTML = '<p style="padding:2rem">Book data did not load.</p>'; return; }

  var esc = function(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  };
  /* a tiny, closed markup set for emphasis inside written lines */
  var rich = function(s){
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/__(.+?)__/g, '<em>$1</em>');
  };

  /* ---------- flatten the book into a linear page list ---------- */
  var PAGES = [];
  BOOK.chapters.forEach(function(ch, ci){
    PAGES.push({ t:'plate', ch:ci, data:ch });
    (ch.pages || []).forEach(function(pg){
      PAGES.push({ t:pg.t, ch:ci, data:pg });
    });
  });

  var KEY = 'seeraa-book-' + BOOK.id + '-page';
  var idx = 0;

  /* ---------- renderers ---------- */

  function artBox(art, cls, anchor){
    var scene = art && art[0] ? art[0] : 'desert';
    var palette = art && art[1] ? art[1] : 'night';
    var seed = art && art[2];
    return '<div class="' + (cls || 'art') + '">' + window.ART.scene(scene, palette, seed, anchor) + '</div>';
  }

  function renderPlate(ch, n){
    var tone = ch.plate || '';
    return '<section class="page">'
      + '<div class="plate ' + tone + '">'
      +   window.ART.knot('#ffffff', 0.55)
      +   '<div class="vignette"></div>'
      +   '<div class="plate-inner">'
      +     '<p class="chno">Chapter ' + roman(n) + '</p>'
      +     '<h1 class="chname">' + esc(ch.title) + '</h1>'
      +     (ch.sub ? '<div class="chrule"></div><p class="chsub">' + rich(ch.sub) + '</p>' : '')
      +   '</div>'
      + '</div></section>';
  }

  function renderSplash(p){
    return '<section class="page"><div class="splash">'
      + artBox(p.art)
      + '<div class="fade"></div>'
      + '<div class="words">'
      +   (p.h ? '<h2>' + esc(p.h) + '</h2>' : '')
      +   (p.p ? '<p>' + rich(p.p) + '</p>' : '')
      + '</div></div></section>';
  }

  function renderPanelItems(items){
    return (items || []).map(function(it){
      if(it.cap != null){
        return '<div class="cap' + (it.night ? ' night' : '') + '">' + rich(it.cap) + '</div>';
      }
      var cls = 'bub'
        + (it.r ? ' r' : '')
        + (it.kind === 'shout' ? ' shout' : '')
        + (it.kind === 'think' ? ' think' : '');
      return '<div class="' + cls + '">'
        + (it.who ? '<span class="who">' + esc(it.who) + '</span>' : '')
        + rich(it.say) + '</div>';
    }).join('');
  }

  function renderSfx(list){
    return (list || []).map(function(f){
      var style = 'left:' + (f.x || '50%') + ';top:' + (f.y || '40%') + ';'
        + 'transform:rotate(' + (f.rot == null ? -8 : f.rot) + 'deg);';
      return '<span class="sfx ' + (f.c || 'mid') + '" style="' + style + '">' + esc(f.w) + '</span>';
    }).join('');
  }

  function renderComic(p){
    var panels = (p.panels || []).map(function(pn){
      var wide = /\bshort\b/.test(pn.cls || '');
      return '<div class="panel ' + (pn.cls || '') + '">'
        + artBox(pn.art, null, wide ? 'mid' : null)
        + renderSfx(pn.sfx)
        + '<div class="layer">' + renderPanelItems(pn.items) + '</div>'
        + '</div>';
    }).join('');
    return '<section class="page"><div class="comic l-' + (p.layout || 'stack') + '">' + panels + '</div></section>';
  }

  function renderProse(p){
    var body = (p.body || []).map(function(para, i){
      return '<p' + (i === 0 && p.drop !== false ? ' class="dropcap"' : '') + '>' + rich(para) + '</p>';
    }).join('');
    return '<section class="page"><div class="sheet">'
      + '<p class="kicker">' + esc(p.kicker || 'The Story') + '</p>'
      + (p.h ? '<h2>' + esc(p.h) + '</h2>' : '')
      + body
      + (p.ar ? '<p class="ar">' + esc(p.ar) + '</p>' : '')
      + (p.arT ? '<p style="text-align:center;font-style:italic;margin-top:-.4rem">' + rich(p.arT) + '</p>' : '')
      + '</div></section>';
  }

  function renderFact(p){
    return '<section class="page"><div class="sheet">'
      + '<p class="kicker">Did You Know</p>'
      + (p.h ? '<h2>' + esc(p.h) + '</h2>' : '')
      + (p.facts || []).map(function(f){
          return '<div class="fact" style="margin-bottom:1rem"><h3>' + esc(f.k) + '</h3><p>' + rich(f.v) + '</p></div>';
        }).join('')
      + (p.after ? '<p>' + rich(p.after) + '</p>' : '')
      + '</div></section>';
  }

  function renderReflect(p){
    return '<section class="page"><div class="sheet">'
      + '<p class="kicker">Pause and Think</p>'
      + '<h2>' + esc(p.h || 'What did you notice?') + '</h2>'
      + '<ul class="qlist">'
      +   (p.qs || []).map(function(q){
            return '<li>' + rich(q) + '<span class="lines"></span></li>';
          }).join('')
      + '</ul>'
      + (p.ponder ? '<div class="ponder"><b>Something to carry with you</b>' + rich(p.ponder) + '</div>' : '')
      + '</div></section>';
  }

  function renderDraw(p){
    return '<section class="page"><div class="sheet">'
      + '<p class="kicker">Your Turn to Draw</p>'
      + '<h2>' + esc(p.h || 'Draw this scene') + '</h2>'
      + (p.prompt ? '<p>' + rich(p.prompt) + '</p>' : '')
      + '<div class="drawbox">'
      +   '<span class="corner tl"></span><span class="corner tr"></span>'
      +   '<span class="corner bl"></span><span class="corner br"></span>'
      +   '<span class="ghost">' + esc(p.ghost || 'your panel') + '</span>'
      + '</div>'
      + (p.tips && p.tips.length
          ? '<ul class="tiplist">' + p.tips.map(function(t){ return '<li>' + rich(t) + '</li>'; }).join('') + '</ul>'
          : '')
      + (p.bank && p.bank.length
          ? '<div class="bank">' + p.bank.map(function(w){ return '<span>' + esc(w) + '</span>'; }).join('') + '</div>'
          : '')
      + '</div></section>';
  }

  function renderCliff(p){
    return '<section class="page"><div class="cliff">'
      + window.ART.knot('#ffffff', 0.4)
      + '<div class="inner">'
      +   '<p class="eyebrow">' + esc(p.eyebrow || 'And then…') + '</p>'
      +   '<p>' + rich(p.line) + '</p>'
      +   (p.next ? '<p class="next">' + rich(p.next) + '</p>' : '')
      + '</div></div></section>';
  }

  var RENDER = {
    plate:   function(e){ return renderPlate(e.data, e.ch + 1); },
    splash:  function(e){ return renderSplash(e.data); },
    comic:   function(e){ return renderComic(e.data); },
    prose:   function(e){ return renderProse(e.data); },
    fact:    function(e){ return renderFact(e.data); },
    reflect: function(e){ return renderReflect(e.data); },
    draw:    function(e){ return renderDraw(e.data); },
    cliff:   function(e){ return renderCliff(e.data); }
  };

  function roman(n){
    var map = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']], out = '';
    map.forEach(function(m){ while(n >= m[0]){ out += m[1]; n -= m[0]; } });
    return out;
  }

  /* ---------- paint ---------- */
  var stage  = document.getElementById('stage');
  var railIn = document.querySelector('.rail i');
  var posEl  = document.getElementById('pos');
  var prevEl = document.getElementById('prev');
  var nextEl = document.getElementById('next');

  function paint(){
    var entry = PAGES[idx];
    stage.innerHTML = (RENDER[entry.t] || RENDER.prose)(entry);
    railIn.style.width = ((idx + 1) / PAGES.length * 100).toFixed(2) + '%';
    posEl.innerHTML = 'Chapter <b>' + (entry.ch + 1) + '</b> of ' + BOOK.chapters.length
      + ' &nbsp;·&nbsp; page <b>' + (idx + 1) + '</b> / ' + PAGES.length;
    prevEl.disabled = idx === 0;
    nextEl.disabled = idx === PAGES.length - 1;
    try{ localStorage.setItem(KEY, String(idx)); }catch(e){}
    var u = new URL(location.href);
    u.searchParams.set('p', idx + 1);
    history.replaceState(null, '', u);
    window.scrollTo({ top:0, behavior:'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }

  function go(n){
    n = Math.max(0, Math.min(PAGES.length - 1, n));
    if(n === idx) return;
    document.body.classList.add('turning');
    setTimeout(function(){
      idx = n;
      document.body.classList.remove('turning');
      paint();
    }, 180);
  }

  /* ---------- contents ---------- */
  function buildToc(){
    var list = document.getElementById('toclist');
    list.innerHTML = BOOK.chapters.map(function(ch, i){
      var at = PAGES.findIndex(function(p){ return p.t === 'plate' && p.ch === i; });
      return '<li><button data-go="' + at + '">'
        + '<span class="n">' + roman(i + 1) + '</span>'
        + '<span class="t">' + esc(ch.title) + '</span>'
        + '<span class="tick"></span></button></li>';
    }).join('');
    list.addEventListener('click', function(ev){
      var b = ev.target.closest('button[data-go]');
      if(!b) return;
      closeDrawer();
      go(parseInt(b.dataset.go, 10));
    });
  }

  var drawer = document.getElementById('drawer');
  function openDrawer(){
    drawer.classList.add('open');
    var cur = PAGES[idx].ch;
    drawer.querySelectorAll('#toclist button').forEach(function(b, i){
      b.classList.toggle('done', i <= cur);
      b.querySelector('.tick').textContent = i < cur ? '✓' : (i === cur ? '▸' : '');
    });
  }
  function closeDrawer(){ drawer.classList.remove('open'); }

  /* ---------- wiring ---------- */
  prevEl.addEventListener('click', function(){ go(idx - 1); });
  nextEl.addEventListener('click', function(){ go(idx + 1); });
  document.getElementById('toc').addEventListener('click', openDrawer);
  drawer.addEventListener('click', function(e){ if(e.target === drawer) closeDrawer(); });
  document.getElementById('closedrawer').addEventListener('click', closeDrawer);

  document.addEventListener('keydown', function(e){
    if(e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' '){ e.preventDefault(); go(idx + 1); }
    else if(e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); go(idx - 1); }
    else if(e.key === 'Escape'){ closeDrawer(); }
    else if(e.key === 'Home'){ go(0); }
    else if(e.key === 'End'){ go(PAGES.length - 1); }
  });

  /* swipe */
  var tx = 0, ty = 0;
  stage.addEventListener('touchstart', function(e){
    tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
  }, { passive:true });
  stage.addEventListener('touchend', function(e){
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if(Math.abs(dx) > 62 && Math.abs(dx) > Math.abs(dy) * 1.6){ go(idx + (dx < 0 ? 1 : -1)); }
  }, { passive:true });

  /* print the whole book */
  document.getElementById('printall').addEventListener('click', function(){
    stage.innerHTML = PAGES.map(function(e){ return (RENDER[e.t] || RENDER.prose)(e); }).join('');
    setTimeout(function(){
      window.print();
      setTimeout(paint, 400);
    }, 350);
  });

  /* ---------- boot ---------- */
  document.title = BOOK.title + ' — Seeraa Quest';
  document.getElementById('bt').innerHTML =
    esc(BOOK.title) + '<small>Book ' + BOOK.id + ' · ' + esc(BOOK.range) + '</small>';

  var qp = parseInt(new URLSearchParams(location.search).get('p'), 10);
  if(qp && qp >= 1 && qp <= PAGES.length){ idx = qp - 1; }
  else { try{ var s = parseInt(localStorage.getItem(KEY), 10); if(s >= 0 && s < PAGES.length) idx = s; }catch(e){} }

  buildToc();
  paint();
})();
