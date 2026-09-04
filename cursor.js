(function(){
  try{
    if(!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var style = document.createElement('style');
    style.textContent =
      '*{cursor:none !important;}' +
      '#dc-cursor,#dc-nun{position:fixed;top:0;left:0;pointer-events:none;z-index:2147483647;will-change:transform;opacity:0;}' +
      '#dc-cursor{width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2.5px solid #caa131;' +
        'box-shadow:0 0 8px rgba(202,161,49,.5);' +
        'background:radial-gradient(circle, rgba(202,161,49,.25), rgba(202,161,49,0) 70%);' +
        'transition:transform .12s cubic-bezier(.2,.9,.3,1), opacity .25s ease, border-color .2s ease, box-shadow .2s ease, background .2s ease;}' +
      '#dc-cursor.dc-click{transform:scale(1.7) translate(0,0);border-color:#2e6b58;box-shadow:0 0 10px rgba(46,107,88,.55);' +
        'background:radial-gradient(circle, rgba(46,107,88,.28), rgba(46,107,88,0) 70%);}' +
      '#dc-nun{font-family:"Amiri",serif;font-size:19px;line-height:1;color:#caa131;' +
        'text-shadow:0 0 6px rgba(202,161,49,.4);transition:opacity .35s ease;}' +
      '@media(max-width:820px){#dc-cursor,#dc-nun{display:none;}}';
    document.head.appendChild(style);

    var cursor = document.createElement('div'); cursor.id = 'dc-cursor';
    var nun = document.createElement('div'); nun.id = 'dc-nun'; nun.textContent = 'ن';
    document.body.appendChild(cursor);
    document.body.appendChild(nun);

    var mouseX = -100, mouseY = -100;
    var nunX = -100, nunY = -100;
    var shown = false;

    function show(){
      if(shown) return;
      shown = true;
      cursor.style.opacity = '1';
      nun.style.opacity = '.82';
    }

    window.addEventListener('mousemove', function(e){
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
      show();
    }, {passive:true});

    document.addEventListener('mouseleave', function(){
      shown = false;
      cursor.style.opacity = '0';
      nun.style.opacity = '0';
    });

    window.addEventListener('pageshow', function(){
      shown = false;
      cursor.style.opacity = '0';
      nun.style.opacity = '0';
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

    function spawnInk(x, y){
      var dot = document.createElement('div');
      dot.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;' +
        'border-radius:50%;background:#caa131;pointer-events:none;z-index:2147483646;' +
        'transition:transform .5s ease-out, opacity .5s ease-out;transform:scale(1);opacity:.55;';
      document.body.appendChild(dot);
      requestAnimationFrame(function(){
        dot.style.transform = 'scale(4.5)';
        dot.style.opacity = '0';
      });
      setTimeout(function(){ dot.remove(); }, 550);
    }

    function loop(){
      nunX += (mouseX - nunX) * 0.14;
      nunY += (mouseY - nunY) * 0.14;
      var dx = mouseX - nunX, dy = mouseY - nunY;
      var angle = Math.atan2(dy, dx) * (180 / Math.PI);
      nun.style.transform = 'translate(' + (nunX - 9) + 'px,' + (nunY - 9) + 'px) rotate(' + (angle * 0.12) + 'deg)';
      requestAnimationFrame(loop);
    }
    loop();
  } catch(e){
    if(style && style.parentNode) style.remove();
    var s = document.getElementById('dc-cursor'), n = document.getElementById('dc-nun');
    if(s) s.remove();
    if(n) n.remove();
  }
})();
