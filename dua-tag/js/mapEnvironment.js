/* ===================== Map / Environment =====================
   A colorful, peaceful courtyard-garden scene: geometric floor tiling,
   a fountain, some archway pillars, trees and lanterns. Purely a
   generic, cheerful "Islamic geometric pattern" garden — it is not a
   depiction of any real, specific sacred site. */

export const MAP_WIDTH = 900;
export const MAP_HEIGHT = 600;

/* Solid circular obstacles players can't walk through. Lanterns are
   deliberately left out of this list -- they're ambient decoration only. */
const OBSTACLES = [
  { x: 450, y: 300, r: 58 },   // fountain, center
  { x: 110, y: 110, r: 26 },   // corner pillar
  { x: 790, y: 110, r: 26 },
  { x: 110, y: 490, r: 26 },
  { x: 790, y: 490, r: 26 },
  { x: 450, y: 110, r: 20 },   // tree, top middle
  { x: 450, y: 490, r: 20 },   // tree, bottom middle
  { x: 230, y: 300, r: 18 },   // tree, left
  { x: 670, y: 300, r: 18 }    // tree, right
];

export function getObstacles(){ return OBSTACLES; }

let bgCanvas = null;
function buildBackground(){
  const c = document.createElement('canvas');
  c.width = MAP_WIDTH; c.height = MAP_HEIGHT;
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, MAP_HEIGHT);
  grad.addColorStop(0, '#eaf7f2');
  grad.addColorStop(1, '#d3efe1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // Geometric floor pattern: a grid of simple eight-pointed star outlines.
  ctx.strokeStyle = 'rgba(47,184,143,0.22)';
  ctx.lineWidth = 1.5;
  const tile = 60;
  for(let y = tile / 2; y < MAP_HEIGHT; y += tile){
    for(let x = tile / 2; x < MAP_WIDTH; x += tile){
      drawStar8(ctx, x, y, tile * 0.42);
    }
  }

  // Border wall.
  ctx.strokeStyle = '#2fb88f';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, MAP_WIDTH - 10, MAP_HEIGHT - 10);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, MAP_WIDTH - 20, MAP_HEIGHT - 20);

  bgCanvas = c;
}

function drawStar8(ctx, cx, cy, r){
  ctx.beginPath();
  for(let i = 0; i < 8; i++){
    const a1 = (Math.PI / 4) * i;
    const a2 = a1 + Math.PI / 8;
    const p1 = { x: cx + Math.cos(a1) * r, y: cy + Math.sin(a1) * r };
    const p2 = { x: cx + Math.cos(a2) * r * 0.45, y: cy + Math.sin(a2) * r * 0.45 };
    if(i === 0) ctx.moveTo(p1.x, p1.y); else ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawFountain(ctx, x, y){
  ctx.fillStyle = '#bfe0f0';
  ctx.beginPath(); ctx.arc(x, y, 58, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5aa9e6'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, 58, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#e7dcc0';
  ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dff3ea';
  ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
  ctx.font = '26px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⛲', x, y + 9);
}

function drawPillar(ctx, x, y){
  ctx.font = '40px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🕌️', x, y + 12);
}

function drawTree(ctx, x, y){
  ctx.font = '38px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🌳', x, y + 12);
}

const LANTERNS = [
  { x: 300, y: 60 }, { x: 600, y: 60 }, { x: 300, y: 540 }, { x: 600, y: 540 },
  { x: 60, y: 300 }, { x: 840, y: 300 }
];

export function drawMap(ctx){
  if(!bgCanvas) buildBackground();
  ctx.drawImage(bgCanvas, 0, 0);

  drawFountain(ctx, 450, 300);
  drawPillar(ctx, 110, 110); drawPillar(ctx, 790, 110);
  drawPillar(ctx, 110, 490); drawPillar(ctx, 790, 490);
  drawTree(ctx, 450, 110); drawTree(ctx, 450, 490);
  drawTree(ctx, 230, 300); drawTree(ctx, 670, 300);

  ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
  LANTERNS.forEach(l => ctx.fillText('🏾', l.x, l.y));
}
