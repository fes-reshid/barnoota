/* ===================== Mini-Map Manager =====================
   A small corner map showing where all four racers are along the level
   and where the Good Deed finish line is, in each character's fixed
   color. */

export function drawMiniMap(ctx, canvasEl, racers, level){
  const w = canvasEl.width, h = canvasEl.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#a97c25';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  const trackY = h / 2;
  ctx.strokeStyle = '#d3ac5c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, trackY);
  ctx.lineTo(w - 16, trackY);
  ctx.stroke();

  // Good Deed finish marker.
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌟', w - 10, trackY + 5);

  racers.forEach(r => {
    const pct = Math.min(1, Math.max(0, r.x / level.finishX));
    const x = 8 + pct * (w - 24);
    ctx.beginPath();
    ctx.arc(x, trackY, 5, 0, Math.PI * 2);
    ctx.fillStyle = r.character.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}
