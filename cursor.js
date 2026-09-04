(function(){
  try{
    if(!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var style = document.createElement('style');
    style.textContent =
      '*{cursor:none !important;}' +
      '#dc-cursor{position:fixed;top:0;left:0;width:28px;height:28px;pointer-events:none;z-index:2147483647;will-change:transform;opacity:0;' +
        'filter:drop-shadow(0 1px 2px rgba(0,0,0,.4)) drop-shadow(0 0 6px rgba(202,161,49,.6));' +
        'transition:opacity .25s ease, filter .18s ease;}' +
      '#dc-cursor polygon{fill:#d8ac3a; stroke:#5c3d0e; stroke-width:1.7; stroke-linejoin:round; transition:fill .15s ease, stroke .15s ease;}' +
      '#dc-cursor.dc-click{filter:drop-shadow(0 1px 2px rgba(0,0,0,.4)) drop-shadow(0 0 8px rgba(46,107,88,.65));}' +
      '#dc-cursor.dc-click polygon{fill:#3a8a6e; stroke:#123a2c;}' +
      '#dc-daal{position:fixed;top:0;left:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
        'background:#2e6b58;color:#faf3e0;font-family:"Amiri",serif;font-size:12px;line-height:22px;text-align:center;' +
        'pointer-events:none;z-index:2147483646;will-change:transform;opacity:0;box-shadow:0 1px 4px rgba(0,0,0,.35);' +
        'transition:opacity .3s ease;}' +
      '@media(max-width:820px){#dc-cursor,#dc-daal{display:none;}}';
    document.head.appendChild(style);

    var svgNS = 'http://www.w3.org/2000/svg';
    var cursor = document.createElementNS(svgNS, 'svg');
    cursor.setAttribute('id', 'dc-cursor');
    cursor.setAttribute('viewBox', '0 0 24 24');
    var poly = document.createElementNS(svgNS, 'polygon');
    poly.setAttribute('points', '2,1.5 2,18.7 6.7,14.7 10.1,22.2 12.9,20.9 9.4,13.5 16.3,13.2');
    cursor.appendChild(poly);
    document.body.appendChild(cursor);

    var daal = document.createElement('div');
    daal.id = 'dc-daal';
    daal.textContent = 'د';
    document.body.appendChild(daal);

    var mouseX = -100, mouseY = -100;
    var daalX = -100, daalY = -100;
    var shown = false;

    function show(){
      if(shown) return;
      shown = true;
      cursor.style.opacity = '1';
      daal.style.opacity = '.92';
    }

    window.addEventListener('mousemove', function(e){
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.style.transform = 'translate(' + (mouseX - 2) + 'px,' + (mouseY - 1.5) + 'px)';
      show();
    }, {passive:true});

    document.addEventListener('mouseleave', function(){
      shown = false;
      cursor.style.opacity = '0';
      daal.style.opacity = '0';
    });

    window.addEventListener('pageshow', function(){
      shown = false;
      cursor.style.opacity = '0';
      daal.style.opacity = '0';
    });

    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'visible'){
        shown = false;
      }
    });

    window.addEventListener('mousedown', function(e){
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.classList.add('dc-click');
      spawnInk(mouseX, mouseY);
    });
    window.addEventListener('mouseup', function(){
      cursor.classList.remove('dc-click');
    });

    function loop(){
      daalX += (mouseX - daalX) * 0.16;
      daalY += (mouseY - daalY) * 0.16;
      daal.style.transform = 'translate(' + daalX + 'px,' + daalY + 'px)';
      requestAnimationFrame(loop);
    }
    loop();

    function spawnInk(x, y){
      var dot = document.createElement('div');
      dot.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;' +
        'border-radius:50%;background:#3a8a6e;pointer-events:none;z-index:2147483646;' +
        'transition:transform .5s ease-out, opacity .5s ease-out;transform:scale(1);opacity:.55;';
      document.body.appendChild(dot);
      requestAnimationFrame(function(){
        dot.style.transform = 'scale(4.5)';
        dot.style.opacity = '0';
      });
      setTimeout(function(){ dot.remove(); }, 550);
    }
  } catch(e){
    if(style && style.parentNode) style.remove();
    var s = document.getElementById('dc-cursor'), d = document.getElementById('dc-daal');
    if(s) s.remove();
    if(d) d.remove();
  }
})();
