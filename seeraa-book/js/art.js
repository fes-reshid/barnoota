/* ============================================================
   SEERAA QUEST — scene art library
   Flat-colour, layered SVG scenes in a graphic-novel register.
   No faces are drawn for the Prophet (peace be upon him) or his
   Companions: the storytelling is carried by light, silhouette
   and landscape.
   ============================================================ */
(function(global){
  'use strict';

  /* ---------- palettes ---------- */
  var PAL = {
    night:  { a:'#2a1a6e', b:'#140c38', c:'#0a0620', far:'#2b1b72', mid:'#1b1049', near:'#0c0726',
              orb:'#ffeab8', glow:'#9a7bff', pop:'#ff3ea5', warm:'#f5b331', ground:'#050312' },
    deep:   { a:'#3a2399', b:'#1b1046', c:'#0b0725', far:'#4628ad', mid:'#26165f', near:'#120b2e',
              orb:'#ffd981', glow:'#ff86c9', pop:'#ff3ea5', warm:'#ffd981', ground:'#06031a' },
    dawn:   { a:'#ffb27a', b:'#e0659b', c:'#5b2a7a', far:'#b4588c', mid:'#6e3271', near:'#39184f',
              orb:'#fff3c4', glow:'#ffd981', pop:'#ff3ea5', warm:'#f5b331', ground:'#190824' },
    dusk:   { a:'#f5b331', b:'#c0486b', c:'#3a1f67', far:'#8e3a6e', mid:'#56255e', near:'#2b1342',
              orb:'#fff0b8', glow:'#ffbd6b', pop:'#ff3ea5', warm:'#ffd981', ground:'#140720' },
    day:    { a:'#9ddcf2', b:'#cdeaf6', c:'#f1e3bd', far:'#b9d5c0', mid:'#8aac85', near:'#5e8f55',
              orb:'#fff6cf', glow:'#ffe79a', pop:'#e4467f', warm:'#f5b331', ground:'#23381f' },
    sand:   { a:'#f7dfae', b:'#edc784', c:'#d9a55c', far:'#e8c88a', mid:'#cd9a53', near:'#a9763a',
              orb:'#fff8dd', glow:'#ffe2a0', pop:'#b03a5e', warm:'#e08b2c', ground:'#4a2a10' },
    storm:  { a:'#4d5878', b:'#2d3450', c:'#171b2e', far:'#3b445f', mid:'#262c42', near:'#141828',
              orb:'#c9d6e8', glow:'#8fa4c7', pop:'#ff3ea5', warm:'#d8b05a', ground:'#070910' },
    sacred: { a:'#1f1358', b:'#120a36', c:'#070418', far:'#2b1a74', mid:'#180e45', near:'#0a0624',
              orb:'#ffe9a8', glow:'#ffd981', pop:'#ffd981', warm:'#f5b331', ground:'#03010c' },
    sea:    { a:'#9fd9ea', b:'#4f9ec4', c:'#1d4f74', far:'#2e7fa8', mid:'#1d5c85', near:'#123d5c',
              orb:'#fff4cd', glow:'#bfe9f7', pop:'#f5b331', warm:'#f5b331', ground:'#041a2c' },
    blood:  { a:'#c9674a', b:'#8e2f46', c:'#3d122c', far:'#9b3448', mid:'#5f1c33', near:'#330f24',
              orb:'#ffd0a0', glow:'#ff9a6b', pop:'#ffd981', warm:'#f5b331', ground:'#17040e' }
  };

  function pal(name){ return PAL[name] || PAL.night; }

  /* deterministic pseudo-random so a scene looks the same every visit */
  function rng(seed){
    var s = seed || 1;
    return function(){ s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  /* ---------- shared pieces ---------- */

  function defs(p, id){
    return ''
      + '<defs>'
      + '<linearGradient id="sky'+id+'" x1="0" y1="0" x2="0" y2="1">'
      +   '<stop offset="0%" stop-color="'+p.a+'"/>'
      +   '<stop offset="52%" stop-color="'+p.b+'"/>'
      +   '<stop offset="100%" stop-color="'+p.c+'"/>'
      + '</linearGradient>'
      + '<radialGradient id="orb'+id+'" cx="50%" cy="50%" r="50%">'
      +   '<stop offset="0%" stop-color="'+p.orb+'" stop-opacity="1"/>'
      +   '<stop offset="45%" stop-color="'+p.glow+'" stop-opacity=".55"/>'
      +   '<stop offset="100%" stop-color="'+p.glow+'" stop-opacity="0"/>'
      + '</radialGradient>'
      + '<linearGradient id="haze'+id+'" x1="0" y1="0" x2="0" y2="1">'
      +   '<stop offset="0%" stop-color="'+p.glow+'" stop-opacity=".30"/>'
      +   '<stop offset="100%" stop-color="'+p.glow+'" stop-opacity="0"/>'
      + '</linearGradient>'
      + '<filter id="grain'+id+'" x="0" y="0" width="100%" height="100%">'
      +   '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>'
      +   '<feColorMatrix type="saturate" values="0"/>'
      + '</filter>'
      + '<radialGradient id="vig'+id+'" cx="50%" cy="46%" r="72%">'
      +   '<stop offset="55%" stop-color="#000" stop-opacity="0"/>'
      +   '<stop offset="100%" stop-color="#000" stop-opacity=".55"/>'
      + '</radialGradient>'
      + '</defs>';
  }

  function sky(id){ return '<rect width="800" height="600" fill="url(#sky'+id+')"/>'; }

  function orb(id, x, y, r){
    return '<circle cx="'+x+'" cy="'+y+'" r="'+(r*3.1)+'" fill="url(#orb'+id+')"/>'
         + '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#fff" opacity=".93"/>';
  }

  function crescent(id, x, y, r, p){
    return '<circle cx="'+x+'" cy="'+y+'" r="'+(r*3.4)+'" fill="url(#orb'+id+')" opacity=".7"/>'
         + '<path d="M '+x+' '+(y-r)+' a '+r+' '+r+' 0 1 0 0 '+(2*r)
         +     ' a '+(r*0.78)+' '+(r*0.98)+' 0 1 1 0 '+(-2*r)+' Z" fill="'+p.orb+'"/>';
  }

  function stars(id, p, seed, n, ymax){
    var r = rng(seed || 7), s = '', i, x, y, rad, o;
    n = n || 60; ymax = ymax || 330;
    for(i=0;i<n;i++){
      x = r()*800; y = r()*ymax; rad = r()*1.6+0.5; o = r()*0.65+0.25;
      s += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rad.toFixed(2)+'" fill="#fff" opacity="'+o.toFixed(2)+'"/>';
    }
    /* a few four-point sparkles */
    for(i=0;i<5;i++){
      x = r()*760+20; y = r()*(ymax*0.8)+10; rad = r()*7+5;
      s += '<path d="M '+x+' '+(y-rad)+' L '+(x+rad*0.22)+' '+(y-rad*0.22)+' L '+(x+rad)+' '+y
         + ' L '+(x+rad*0.22)+' '+(y+rad*0.22)+' L '+x+' '+(y+rad)
         + ' L '+(x-rad*0.22)+' '+(y+rad*0.22)+' L '+(x-rad)+' '+y
         + ' L '+(x-rad*0.22)+' '+(y-rad*0.22)+' Z" fill="'+p.warm+'" opacity=".8"/>';
    }
    return s;
  }

  function dunes(p, baseY, seed){
    var r = rng(seed||3), s='', layers=[
      {y:baseY-70, f:p.far,  o:1},
      {y:baseY-30, f:p.mid,  o:1},
      {y:baseY+14, f:p.near, o:1}
    ], i, L, d, x, amp;
    for(i=0;i<layers.length;i++){
      L = layers[i]; amp = 34 - i*7;
      d = 'M -20 600 L -20 '+L.y+' ';
      for(x=0;x<=840;x+=105){
        d += 'Q '+(x+52)+' '+(L.y - amp - r()*34)+' '+(x+105)+' '+(L.y + (r()*20-10))+' ';
      }
      d += 'L 820 600 Z';
      s += '<path d="'+d+'" fill="'+L.f+'"/>';
    }
    return s;
  }

  function ridge(p, baseY, seed, fill, jag){
    var r = rng(seed||11), d='M -20 600 L -20 '+baseY+' ', x, y;
    jag = jag || 70;
    for(x=0;x<=840;x+=58){
      y = baseY - r()*jag;
      d += 'L '+x+' '+y.toFixed(0)+' ';
    }
    d += 'L 820 600 Z';
    return '<path d="'+d+'" fill="'+(fill||p.mid)+'"/>';
  }

  function grain(id){
    return '<rect width="800" height="600" filter="url(#grain'+id+')" opacity=".11" style="mix-blend-mode:overlay"/>';
  }
  function vignette(id){
    return '<rect width="800" height="600" fill="url(#vig'+id+')"/>';
  }

  /* --- silhouette building blocks (no faces, ever) --- */

  function camel(x, y, s, fill){
    s = s || 1;
    return '<g transform="translate('+x+','+y+') scale('+s+')" fill="'+fill+'">'
      + '<path d="M -34 0 L -31 -22 L -24 -34 Q -12 -46 2 -41 Q 10 -52 20 -41 Q 32 -44 36 -31 '
      +   'L 40 -16 L 44 0 L 38 0 L 35 -13 L 24 -16 L 14 -14 L 10 0 L 4 0 L 7 -14 L -6 -16 '
      +   'L -17 -12 L -20 0 Z"/>'
      + '<path d="M 36 -31 Q 46 -36 50 -48 L 56 -56 L 60 -50 L 53 -42 Q 50 -32 44 -27 Z"/>'
      + '</g>';
  }

  function person(x, y, s, fill, pose){
    /* a robed, faceless figure — always in silhouette */
    s = s || 1;
    var arms = pose === 'raise'
      ? '<path d="M -9 -30 L -17 -48 L -13 -50 L -5 -33 Z"/><path d="M 9 -30 L 17 -48 L 13 -50 L 5 -33 Z"/>'
      : pose === 'point'
      ? '<path d="M 8 -30 L 26 -36 L 27 -32 L 9 -25 Z"/>'
      : '';
    return '<g transform="translate('+x+','+y+') scale('+s+')" fill="'+fill+'">'
      + '<path d="M -13 0 Q -14 -22 -8 -34 Q -10 -44 0 -45 Q 10 -44 8 -34 Q 14 -22 13 0 Z"/>'
      + '<path d="M 0 -45 q -9 -1 -9 -9 q 0 -10 9 -10 q 9 0 9 10 q 0 8 -9 9 Z"/>'
      + arms
      + '</g>';
  }

  function crowd(y, n, fill, seed, s){
    var r = rng(seed||5), out='', i, x;
    for(i=0;i<n;i++){
      x = (i+0.5)*(800/n) + (r()*34-17);
      out += person(x, y + r()*10, (s||0.9)*(0.82+r()*0.4), fill);
    }
    return out;
  }

  function palm(x, y, s, fill){
    s = s || 1;
    var i, out = '<g transform="translate('+x+','+y+') scale('+s+')" fill="'+fill+'">'
      + '<path d="M -4 0 Q -2 -34 -6 -62 L 2 -62 Q 4 -34 4 0 Z"/>';
    for(i=0;i<7;i++){
      var a = -160 + i*27;
      out += '<path transform="rotate('+a+' 0 -62)" d="M 0 -62 Q 24 -70 46 -58 Q 24 -62 0 -56 Z"/>';
    }
    return out + '</g>';
  }

  function kaabaShape(x, y, w, h, fill, band){
    return '<g>'
      + '<rect x="'+(x-w/2)+'" y="'+(y-h)+'" width="'+w+'" height="'+h+'" fill="'+fill+'" rx="2"/>'
      + '<rect x="'+(x-w/2)+'" y="'+(y-h*0.62)+'" width="'+w+'" height="'+(h*0.1)+'" fill="'+band+'" opacity=".9"/>'
      + '<rect x="'+(x-w/2)+'" y="'+(y-h)+'" width="'+w+'" height="'+(h*0.05)+'" fill="'+band+'" opacity=".55"/>'
      + '</g>';
  }

  function arches(y, n, w, h, fill){
    var out='', i, x, step = 800/n;
    for(i=0;i<n;i++){
      x = i*step + step/2;
      out += '<path d="M '+(x-w/2)+' '+y+' L '+(x-w/2)+' '+(y-h*0.55)
           + ' Q '+x+' '+(y-h*1.12)+' '+(x+w/2)+' '+(y-h*0.55)
           + ' L '+(x+w/2)+' '+y+' Z" fill="'+fill+'"/>';
    }
    return out;
  }

  function dome(x, y, r, fill, finial){
    return '<g fill="'+fill+'">'
      + '<path d="M '+(x-r)+' '+y+' Q '+(x-r)+' '+(y-r*1.42)+' '+x+' '+(y-r*1.5)
      +   ' Q '+(x+r)+' '+(y-r*1.42)+' '+(x+r)+' '+y+' Z"/>'
      + (finial ? '<path d="M '+(x-2.5)+' '+(y-r*1.5)+' L '+(x-2.5)+' '+(y-r*1.78)+' L '+(x+2.5)+' '+(y-r*1.78)+' L '+(x+2.5)+' '+(y-r*1.5)+' Z"/>' : '')
      + '</g>';
  }

  function houses(y, seed, fill, scale){
    var r = rng(seed||9), out='', x=-20, w, h;
    scale = scale || 1;
    while(x < 820){
      w = (34 + r()*58) * scale;
      h = (26 + r()*62) * scale;
      out += '<rect x="'+x.toFixed(0)+'" y="'+(y-h).toFixed(0)+'" width="'+w.toFixed(0)+'" height="'+(h+40).toFixed(0)+'" fill="'+fill+'"/>';
      if(r() > 0.62){
        out += '<rect x="'+(x+w*0.2).toFixed(0)+'" y="'+(y-h-7).toFixed(0)+'" width="'+(w*0.6).toFixed(0)+'" height="7" fill="'+fill+'"/>';
      }
      x += w + 3;
    }
    return out;
  }

  function rays(id, x, y, p, n, len, op){
    var out='', i, a;
    n = n||14; len = len||520;
    for(i=0;i<n;i++){
      a = (360/n)*i;
      out += '<path transform="rotate('+a+' '+x+' '+y+')" d="M '+x+' '+y+' L '+(x-15)+' '+(y-len)+' L '+(x+15)+' '+(y-len)+' Z" fill="'+p.warm+'" opacity="'+(op||0.16)+'"/>';
    }
    return out;
  }

  function birds(seed, p, n){
    var r = rng(seed||21), out='', i, x, y, s;
    n = n || 9;
    for(i=0;i<n;i++){
      x = r()*760+20; y = r()*210+30; s = r()*0.7+0.6;
      out += '<path transform="translate('+x.toFixed(0)+','+y.toFixed(0)+') scale('+s.toFixed(2)+')" d="M -11 0 Q -5 -7 0 -1 Q 5 -7 11 0 Q 5 -3 0 2 Q -5 -3 -11 0 Z" fill="'+p.near+'" opacity=".75"/>';
    }
    return out;
  }

  function rainfall(seed, n, op){
    var r = rng(seed||33), out='', i, x, y, l;
    n = n||90;
    for(i=0;i<n;i++){
      x = r()*860-30; y = r()*520; l = r()*22+12;
      out += '<line x1="'+x.toFixed(0)+'" y1="'+y.toFixed(0)+'" x2="'+(x-7).toFixed(0)+'" y2="'+(y+l).toFixed(0)+'" stroke="#dff3ff" stroke-width="1.4" opacity="'+(op||0.4)+'"/>';
    }
    return out;
  }

  function banners(y, p, n, seed){
    var r = rng(seed||41), out='', i, x, h;
    n = n||7;
    for(i=0;i<n;i++){
      x = (i+0.5)*(800/n) + (r()*30-15);
      h = 70 + r()*40;
      out += '<rect x="'+(x-1.5)+'" y="'+(y-h)+'" width="3" height="'+h+'" fill="'+p.near+'"/>'
           + '<path d="M '+(x+1)+' '+(y-h)+' L '+(x+34)+' '+(y-h+11)+' L '+(x+1)+' '+(y-h+23)+' Z" fill="'+(i%2?p.pop:p.warm)+'" opacity=".92"/>';
    }
    return out;
  }

  /* ---------- scenes ---------- */
  var SCENES = {

    desert: function(p,id,sd){
      return sky(id) + (p===PAL.night||p===PAL.sacred||p===PAL.deep ? stars(id,p,sd,70) : '')
        + orb(id, 620, 150, 34)
        + dunes(p, 430, sd)
        + camel(150, 468, 1.1, p.ground) + camel(246, 480, 0.85, p.ground)
        + '<rect width="800" height="190" fill="url(#haze'+id+')" opacity=".5"/>';
    },

    caravan: function(p,id,sd){
      return sky(id) + orb(id, 660, 128, 30)
        + dunes(p, 450, sd)
        + camel(90,492,1.25,p.ground) + camel(215,500,1.1,p.ground)
        + camel(330,496,0.95,p.ground) + camel(432,502,0.8,p.ground)
        + camel(515,498,0.68,p.ground)
        + person(160,500,0.9,p.ground) + person(278,506,0.8,p.ground)
        + '<rect width="800" height="200" fill="url(#haze'+id+')"/>';
    },

    kaaba: function(p,id,sd){
      return sky(id) + stars(id,p,sd,44,250)
        + ridge(p, 300, sd, p.far, 58)
        + houses(372, sd, p.mid, 0.9)
        + '<rect x="0" y="430" width="800" height="170" fill="'+p.near+'"/>'
        + arches(432, 11, 56, 62, p.mid)
        + rays(id, 400, 352, p, 18, 400, 0.10)
        + kaabaShape(400, 432, 128, 162, p.ground, p.warm)
        + '<circle cx="400" cy="300" r="120" fill="url(#orb'+id+')" opacity=".45"/>'
        + crowd(470, 13, p.ground, sd, 0.68)
        + crowd(506, 9, p.ground, sd+4, 0.86);
    },

    cave: function(p,id,sd){
      /* inside a cave, looking out */
      return '<rect width="800" height="600" fill="'+p.c+'"/>'
        + '<path d="M 250 600 Q 236 350 320 212 Q 400 90 500 160 Q 600 230 574 392 Q 560 520 596 600 Z" fill="'+p.a+'"/>'
        + '<path d="M 276 600 Q 264 356 338 232 Q 404 128 488 186 Q 574 246 552 392 Q 540 520 568 600 Z" fill="'+p.b+'" opacity=".9"/>'
        + orb(id, 418, 290, 40)
        + rays(id, 418, 290, p, 16, 420, 0.14)
        + '<path d="M 0 0 H 800 V 600 H 0 Z M 250 600 Q 236 350 320 212 Q 400 90 500 160 Q 600 230 574 392 Q 560 520 596 600 Z" fill="'+p.near+'" fill-rule="evenodd"/>'
        + '<path d="M 0 600 L 0 452 Q 120 424 196 468 L 246 600 Z" fill="'+p.ground+'"/>'
        + '<path d="M 800 600 L 800 480 Q 700 452 614 500 L 594 600 Z" fill="'+p.ground+'"/>'
        + vignette(id);
    },

    mountain: function(p,id,sd){
      return sky(id) + stars(id,p,sd,36,220) + orb(id,170,120,26)
        + ridge(p, 386, sd,   p.far, 128)
        + ridge(p, 452, sd+7, p.mid, 104)
        + ridge(p, 520, sd+13,p.near, 72)
        + '<rect width="800" height="240" fill="url(#haze'+id+')" opacity=".6"/>';
    },

    city: function(p,id,sd){
      return sky(id) + stars(id,p,sd,40,210)
        + ridge(p, 322, sd, p.far, 96)
        + houses(404, sd, p.mid, 1)
        + houses(472, sd+6, p.near, 1.15)
        + palm(96, 476, 1.05, p.ground) + palm(712, 486, 0.9, p.ground)
        + '<rect x="0" y="482" width="800" height="118" fill="'+p.ground+'"/>';
    },

    madinah: function(p,id,sd){
      return sky(id) + stars(id,p,sd,40,220)
        + ridge(p, 330, sd, p.far, 84)
        + houses(430, sd, p.mid, 0.95)
        + '<rect x="200" y="356" width="400" height="118" fill="'+p.near+'"/>'
        + dome(400, 356, 56, p.near, true)
        + arches(474, 9, 54, 54, p.ground)
        + '<rect x="0" y="474" width="800" height="126" fill="'+p.ground+'"/>'
        + palm(78, 470, 1.15, p.ground) + palm(150, 480, 0.85, p.ground)
        + palm(676, 474, 1.05, p.ground) + palm(742, 484, 0.8, p.ground)
        + '<circle cx="400" cy="300" r="140" fill="url(#orb'+id+')" opacity=".25"/>';
    },

    oasis: function(p,id,sd){
      return sky(id) + orb(id, 640, 140, 30)
        + dunes(p, 400, sd)
        + '<ellipse cx="400" cy="508" rx="250" ry="52" fill="'+p.far+'" opacity=".75"/>'
        + palm(230,470,1.35,p.ground) + palm(316,486,1.05,p.ground)
        + palm(520,474,1.2,p.ground) + palm(600,490,0.9,p.ground)
        + '<rect x="0" y="540" width="800" height="60" fill="'+p.ground+'"/>';
    },

    well: function(p,id,sd){
      return sky(id) + stars(id,p,sd,34,220)
        + ridge(p, 356, sd, p.far, 64)
        + '<rect x="0" y="432" width="800" height="168" fill="'+p.near+'"/>'
        + '<ellipse cx="400" cy="436" rx="124" ry="34" fill="'+p.mid+'"/>'
        + '<path d="M 282 436 L 292 520 Q 400 548 508 520 L 518 436 Z" fill="'+p.ground+'"/>'
        + '<ellipse cx="400" cy="436" rx="84" ry="22" fill="'+p.c+'"/>'
        + '<circle cx="400" cy="434" r="62" fill="url(#orb'+id+')" opacity=".6"/>'
        + person(236, 470, 1.1, p.ground, 'point')
        + person(560, 476, 1.0, p.ground);
    },

    sea: function(p,id,sd){
      var r = rng(sd||17), waves='', i, y;
      for(i=0;i<16;i++){
        y = 360 + i*15;
        waves += '<path d="M -20 '+y+' q 60 -'+(5+r()*6).toFixed(1)+' 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0" stroke="'+(i%2?p.a:p.glow)+'" stroke-width="2" fill="none" opacity="'+(0.16+i*0.03).toFixed(2)+'"/>';
      }
      return sky(id) + orb(id, 170, 130, 32) + birds(sd,p,7)
        + '<rect x="0" y="352" width="800" height="248" fill="'+p.mid+'"/>'
        + waves
        /* two ships, in silhouette */
        + '<g fill="'+p.near+'"><path d="M 470 420 L 610 420 L 584 462 L 496 462 Z"/>'
        + '<rect x="536" y="330" width="4" height="90"/>'
        + '<path d="M 540 336 Q 592 366 540 404 Z"/><path d="M 536 342 Q 494 368 536 398 Z"/></g>'
        + '<g fill="'+p.near+'" opacity=".72"><path d="M 192 392 L 282 392 L 266 420 L 208 420 Z"/>'
        + '<rect x="234" y="330" width="3" height="62"/><path d="M 237 334 Q 272 356 237 380 Z"/></g>'
        + vignette(id);
    },

    elephant: function(p,id,sd){
      return sky(id) + birds(sd,p,12)
        + ridge(p, 348, sd, p.far, 82)
        + dunes(p, 448, sd+3)
        /* elephant silhouette */
        + '<g fill="'+p.ground+'" transform="translate(400,500) scale(1.5)">'
        + '<path d="M -72 0 L -70 -34 Q -74 -56 -56 -68 Q -30 -84 4 -80 Q 44 -78 60 -58 Q 72 -42 68 -22 L 66 0 L 54 0 L 56 -22 L 30 -28 L 8 -26 L 6 0 L -6 0 L -4 -26 L -34 -30 L -56 -24 L -58 0 Z"/>'
        + '<path d="M 60 -58 Q 80 -62 88 -48 Q 94 -34 86 -22 Q 80 -12 84 2 Q 86 12 78 12 Q 70 12 70 2 Q 70 -12 74 -26 Q 66 -40 60 -58 Z"/>'
        + '<path d="M 54 -66 q 22 -12 28 6 q 6 18 -14 22 Z"/>'
        + '</g>'
        + banners(452, p, 6, sd)
        + crowd(502, 15, p.ground, sd+9, 0.6)
        + vignette(id);
    },

    battlefield: function(p,id,sd){
      return sky(id) + ridge(p, 320, sd, p.far, 96)
        + dunes(p, 430, sd+2)
        + banners(470, p, 9, sd)
        + crowd(506, 17, p.ground, sd, 0.72)
        + crowd(548, 13, p.ground, sd+5, 0.95)
        + '<rect width="800" height="220" fill="url(#haze'+id+')" opacity=".45"/>'
        + vignette(id);
    },

    trench: function(p,id,sd){
      return sky(id) + stars(id,p,sd,40,210)
        + ridge(p, 316, sd, p.far, 88)
        + '<rect x="0" y="392" width="800" height="208" fill="'+p.mid+'"/>'
        /* the dug trench cutting across */
        + '<path d="M -20 452 L 300 430 L 520 448 L 820 428 L 820 530 L 520 548 L 300 526 L -20 548 Z" fill="'+p.c+'"/>'
        + '<path d="M -20 452 L 300 430 L 520 448 L 820 428 L 820 452 L 520 472 L 300 454 L -20 476 Z" fill="'+p.near+'"/>'
        + person(170, 436, 0.95, p.ground, 'raise')
        + person(372, 424, 1.0, p.ground)
        + person(606, 432, 0.9, p.ground, 'raise')
        /* campfires */
        + '<circle cx="110" cy="560" r="26" fill="url(#orb'+id+')" opacity=".75"/>'
        + '<circle cx="690" cy="566" r="22" fill="url(#orb'+id+')" opacity=".7"/>'
        + vignette(id);
    },

    fort: function(p,id,sd){
      return sky(id) + ridge(p, 300, sd, p.far, 74)
        + '<rect x="150" y="286" width="500" height="214" fill="'+p.near+'"/>'
        + '<rect x="150" y="268" width="500" height="22" fill="'+p.mid+'"/>'
        + '<g fill="'+p.mid+'"><rect x="150" y="238" width="38" height="52"/><rect x="286" y="246" width="34" height="44"/>'
        + '<rect x="470" y="246" width="34" height="44"/><rect x="612" y="238" width="38" height="52"/></g>'
        + '<path d="M 368 500 L 368 392 Q 400 348 432 392 L 432 500 Z" fill="'+p.c+'"/>'
        + '<rect x="0" y="498" width="800" height="102" fill="'+p.ground+'"/>'
        + palm(86, 494, 1.0, p.ground) + palm(726, 492, 0.95, p.ground)
        + crowd(528, 11, p.ground, sd, 0.8)
        + vignette(id);
    },

    tent: function(p,id,sd){
      return sky(id) + stars(id,p,sd,54,250) + crescent(id, 660, 124, 30, p)
        + dunes(p, 440, sd)
        + '<path d="M 230 500 L 330 388 L 470 388 L 570 500 Z" fill="'+p.ground+'"/>'
        + '<path d="M 330 388 L 400 356 L 470 388 Z" fill="'+p.near+'"/>'
        + '<path d="M 366 500 L 366 438 Q 400 414 434 438 L 434 500 Z" fill="'+p.c+'"/>'
        + '<circle cx="400" cy="470" r="38" fill="url(#orb'+id+')" opacity=".6"/>'
        + '<circle cx="640" cy="506" r="30" fill="url(#orb'+id+')" opacity=".7"/>'
        + camel(150, 508, 0.95, p.ground)
        + vignette(id);
    },

    market: function(p,id,sd){
      var r = rng(sd||19), stalls='', i, x;
      for(i=0;i<5;i++){
        x = 70 + i*165;
        stalls += '<path d="M '+(x-62)+' 396 L '+x+' 342 L '+(x+62)+' 396 Z" fill="'+(i%2?p.pop:p.warm)+'" opacity=".88"/>'
                + '<rect x="'+(x-56)+'" y="396" width="112" height="14" fill="'+p.near+'"/>'
                + '<rect x="'+(x-50)+'" y="410" width="8" height="74" fill="'+p.near+'"/>'
                + '<rect x="'+(x+42)+'" y="410" width="8" height="74" fill="'+p.near+'"/>';
      }
      return sky(id) + houses(330, sd, p.far, 0.9) + stalls
        + '<rect x="0" y="484" width="800" height="116" fill="'+p.ground+'"/>'
        + crowd(506, 11, p.ground, sd, 0.92)
        + vignette(id);
    },

    valley: function(p,id,sd){
      return sky(id) + stars(id,p,sd,46,230)
        + '<path d="M -20 600 L -20 160 L 230 420 L 230 600 Z" fill="'+p.near+'"/>'
        + '<path d="M 820 600 L 820 140 L 560 420 L 560 600 Z" fill="'+p.near+'"/>'
        + '<path d="M 60 600 L 60 250 L 258 448 L 258 600 Z" fill="'+p.ground+'"/>'
        + '<path d="M 740 600 L 740 230 L 540 448 L 540 600 Z" fill="'+p.ground+'"/>'
        + '<rect x="230" y="470" width="340" height="130" fill="'+p.c+'"/>'
        + '<circle cx="400" cy="516" r="30" fill="url(#orb'+id+')" opacity=".55"/>'
        + crowd(534, 7, p.ground, sd, 0.72)
        + vignette(id);
    },

    nightsky: function(p,id,sd){
      return sky(id) + stars(id,p,sd,130,480) + crescent(id, 600, 150, 46, p)
        + '<path d="M -20 600 L -20 520 Q 200 470 400 512 Q 620 556 820 496 L 820 600 Z" fill="'+p.ground+'"/>'
        + vignette(id);
    },

    ascent: function(p,id,sd){
      /* Night Journey — a stair of light, no figures */
      var i, out='', y;
      for(i=0;i<9;i++){
        y = 560 - i*58;
        out += '<ellipse cx="400" cy="'+y+'" rx="'+(210 - i*21)+'" ry="'+(26 - i*2.2)+'" fill="'+p.warm+'" opacity="'+(0.07 + i*0.045).toFixed(3)+'"/>';
      }
      return sky(id) + stars(id,p,sd,150,540)
        + rays(id, 400, 120, p, 22, 620, 0.09)
        + out
        + '<circle cx="400" cy="92" r="150" fill="url(#orb'+id+')" opacity=".75"/>'
        + '<rect width="800" height="600" fill="url(#haze'+id+')" opacity=".4"/>';
    },

    revelation: function(p,id,sd){
      return '<rect width="800" height="600" fill="'+p.c+'"/>'
        + stars(id,p,sd,80,420)
        + rays(id, 400, 250, p, 26, 640, 0.13)
        + '<circle cx="400" cy="250" r="230" fill="url(#orb'+id+')"/>'
        + '<circle cx="400" cy="250" r="86" fill="#fff" opacity=".22"/>'
        + '<path d="M -20 600 L -20 500 Q 180 456 400 496 Q 620 536 820 480 L 820 600 Z" fill="'+p.ground+'"/>'
        + vignette(id);
    },

    scroll: function(p,id,sd){
      return sky(id)
        + '<rect x="0" y="420" width="800" height="180" fill="'+p.near+'"/>'
        + '<g transform="translate(400,330)">'
        + '<path d="M -230 -110 L 230 -110 L 230 110 L -230 110 Z" fill="'+p.orb+'" opacity=".96"/>'
        + '<path d="M -230 -110 q -26 110 0 220 Z" fill="'+p.warm+'" opacity=".55"/>'
        + '<path d="M 230 -110 q 26 110 0 220 Z" fill="'+p.warm+'" opacity=".55"/>'
        + '<g fill="'+p.mid+'" opacity=".55">'
        + '<rect x="-180" y="-74" width="360" height="9" rx="4"/><rect x="-180" y="-46" width="320" height="9" rx="4"/>'
        + '<rect x="-180" y="-18" width="344" height="9" rx="4"/><rect x="-180" y="10" width="286" height="9" rx="4"/>'
        + '<rect x="-180" y="38" width="330" height="9" rx="4"/><rect x="-180" y="66" width="200" height="9" rx="4"/>'
        + '</g></g>'
        + '<circle cx="400" cy="330" r="200" fill="url(#orb'+id+')" opacity=".3"/>'
        + vignette(id);
    },

    gate: function(p,id,sd){
      return sky(id) + stars(id,p,sd,40,220)
        + ridge(p, 300, sd, p.far, 60)
        + '<rect x="0" y="330" width="800" height="270" fill="'+p.near+'"/>'
        + '<path d="M 290 600 L 290 400 Q 400 300 510 400 L 510 600 Z" fill="'+p.c+'"/>'
        + '<path d="M 316 600 L 316 410 Q 400 326 484 410 L 484 600 Z" fill="'+p.mid+'" opacity=".55"/>'
        + rays(id, 400, 430, p, 14, 400, 0.14)
        + '<circle cx="400" cy="440" r="120" fill="url(#orb'+id+')" opacity=".6"/>'
        + '<g fill="'+p.mid+'"><rect x="200" y="300" width="42" height="34"/><rect x="558" y="300" width="42" height="34"/></g>'
        + crowd(560, 9, p.ground, sd, 0.95)
        + vignette(id);
    },

    rain: function(p,id,sd){
      return sky(id)
        + '<ellipse cx="240" cy="130" rx="190" ry="62" fill="'+p.far+'" opacity=".8"/>'
        + '<ellipse cx="560" cy="106" rx="210" ry="70" fill="'+p.mid+'" opacity=".75"/>'
        + rainfall(sd, 110, 0.38)
        + ridge(p, 400, sd, p.mid, 60)
        + '<rect x="0" y="460" width="800" height="140" fill="'+p.ground+'"/>'
        + palm(130, 456, 1.1, p.ground) + palm(664, 462, 1.0, p.ground)
        + vignette(id);
    },

    storm: function(p,id,sd){
      return sky(id)
        + '<ellipse cx="300" cy="110" rx="240" ry="78" fill="'+p.far+'" opacity=".85"/>'
        + '<ellipse cx="610" cy="88" rx="230" ry="70" fill="'+p.near+'" opacity=".8"/>'
        + rainfall(sd, 70, 0.3)
        + '<path d="M 420 150 L 388 268 L 426 262 L 396 368 L 470 240 L 430 246 L 462 150 Z" fill="'+p.warm+'" opacity=".92"/>'
        + ridge(p, 420, sd, p.mid, 74)
        + banners(470, p, 5, sd)
        + '<rect x="0" y="498" width="800" height="102" fill="'+p.ground+'"/>'
        + vignette(id);
    },

    star: function(p,id,sd){
      return '<rect width="800" height="600" fill="'+p.c+'"/>'
        + stars(id,p,sd,180,600)
        + '<circle cx="400" cy="300" r="260" fill="url(#orb'+id+')" opacity=".5"/>'
        + rays(id, 400, 300, p, 20, 560, 0.08);
    },

    lantern: function(p,id,sd){
      var i, out='';
      for(i=0;i<7;i++){
        var x = 70 + i*112, y = 110 + ((i%3)*48);
        out += '<circle cx="'+x+'" cy="'+y+'" r="54" fill="url(#orb'+id+')" opacity=".6"/>'
             + '<path d="M '+(x-14)+' '+(y-16)+' L '+(x+14)+' '+(y-16)+' L '+(x+19)+' '+(y+16)+' L '+(x-19)+' '+(y+16)+' Z" fill="'+p.warm+'"/>'
             + '<rect x="'+(x-2)+'" y="'+(y-44)+'" width="4" height="28" fill="'+p.near+'"/>';
      }
      return sky(id) + stars(id,p,sd,60,300) + out
        + houses(440, sd, p.near, 1)
        + '<rect x="0" y="494" width="800" height="106" fill="'+p.ground+'"/>'
        + crowd(528, 11, p.ground, sd, 0.9);
    },

    hands: function(p,id,sd){
      /* raised hands in duʿāʾ — silhouettes only */
      return sky(id) + stars(id,p,sd,70,300)
        + rays(id, 400, 170, p, 18, 440, 0.11)
        + '<circle cx="400" cy="170" r="160" fill="url(#orb'+id+')" opacity=".6"/>'
        + '<rect x="0" y="470" width="800" height="130" fill="'+p.ground+'"/>'
        + person(130,520,1.5,p.ground,'raise') + person(268,534,1.7,p.ground,'raise')
        + person(406,516,1.6,p.ground,'raise') + person(540,536,1.75,p.ground,'raise')
        + person(678,522,1.5,p.ground,'raise')
        + vignette(id);
    },

    road: function(p,id,sd){
      return sky(id) + orb(id, 400, 170, 36) + rays(id,400,170,p,16,420,0.1)
        + ridge(p, 356, sd, p.far, 70)
        + dunes(p, 430, sd+2)
        + '<path d="M 330 600 Q 384 480 396 420 Q 404 480 470 600 Z" fill="'+p.a+'" opacity=".35"/>'
        + camel(400, 520, 1.5, p.ground)
        + person(286, 540, 1.2, p.ground) + person(520, 544, 1.15, p.ground)
        + vignette(id);
    },

    bookplate: function(p,id,sd){
      /* abstract ornamental plate — used for covers */
      var i, out='';
      for(i=0;i<5;i++){
        out += '<circle cx="400" cy="300" r="'+(70+i*52)+'" fill="none" stroke="'+p.warm+'" stroke-width="1.4" opacity="'+(0.3 - i*0.045).toFixed(2)+'"/>';
      }
      return sky(id) + stars(id,p,sd,90,600) + out
        + rays(id, 400, 300, p, 16, 420, 0.07)
        + '<circle cx="400" cy="300" r="180" fill="url(#orb'+id+')" opacity=".4"/>';
    }
  };

  /* ---------- knotwork pattern (chapter plates) ---------- */
  function knot(id, stroke, op){
    return '<svg class="knot" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<defs><pattern id="kn'+id+'" width="100" height="100" patternUnits="userSpaceOnUse">'
      +   '<g fill="none" stroke="'+(stroke||'#ffffff')+'" stroke-width="7" opacity="'+(op||0.5)+'">'
      +     '<circle cx="0"   cy="0"   r="50"/><circle cx="100" cy="0"   r="50"/>'
      +     '<circle cx="0"   cy="100" r="50"/><circle cx="100" cy="100" r="50"/>'
      +     '<circle cx="50"  cy="50"  r="50"/>'
      +     '<rect x="14" y="14" width="72" height="72" transform="rotate(45 50 50)"/>'
      +   '</g>'
      + '</pattern></defs>'
      + '<rect width="400" height="400" fill="url(#kn'+id+')"/>'
      + '</svg>';
  }

  /* ---------- public ---------- */
  var uid = 0;
  function scene(name, paletteName, seed, anchor){
    var p = pal(paletteName), id = 's' + (++uid), fn = SCENES[name] || SCENES.desert;
    var par = anchor === 'mid' ? 'xMidYMid slice' : 'xMidYMax slice';
    var sd = seed || (name.length * 7 + (paletteName||'n').length * 13);
    return '<svg viewBox="0 0 800 600" preserveAspectRatio="' + par + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + defs(p, id) + fn(p, id, sd) + grain(id) + '</svg>';
  }

  global.ART = {
    scene: scene,
    knot: function(stroke,op){ return knot('k'+(++uid), stroke, op); },
    names: Object.keys(SCENES),
    palettes: Object.keys(PAL)
  };

})(window);
