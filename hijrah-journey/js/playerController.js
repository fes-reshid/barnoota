/* ===================== Player Controller =====================
   Movement, collision against a chapter's obstacles, and drawing for one
   rider-and-camel pair. Colors are colorblind-safe, and every status is
   also shown as a label/icon, never by color alone. */

import { createStamina, updateStamina, isTired } from './camelController.js';

export const CLOTHING_COLORS = ['#0072B2', '#E69F00', '#009E73', '#CC79A7'];
export const CAMEL_COLORS = ['#c9a26a', '#8a6a43', '#e6d3ad', '#4f3d2e'];

export const CONTROL_SCHEMES = [
  { label: 'W A S D', up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
  { label: 'Arrow Keys', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
  { label: 'I J K L', up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL' },
  { label: 'T F G H', up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH' }
];

const START_SLOTS = [
  { dx: -40, dy: -24 }, { dx: 40, dy: -24 }, { dx: -40, dy: 24 }, { dx: 40, dy: 24 }
];

export class Rider {
  constructor(index, name, clothingColor, camelColor){
    this.index = index;
    this.name = name || ('Player ' + (index + 1));
    this.clothingColor = clothingColor || CLOTHING_COLORS[index];
    this.camelColor = camelColor || CAMEL_COLORS[index];
    this.radius = 22;
    this.speed = 150;
    this.controls = CONTROL_SCHEMES[index];
    this.stamina = createStamina();
    this.moving = false;
  }

  placeAt(cx, cy){
    const slot = START_SLOTS[this.index];
    this.x = cx + slot.dx;
    this.y = cy + slot.dy;
  }

  update(dt, keysDown, bounds, obstacles){
    let dx = 0, dy = 0;
    if(keysDown.has(this.controls.up)) dy -= 1;
    if(keysDown.has(this.controls.down)) dy += 1;
    if(keysDown.has(this.controls.left)) dx -= 1;
    if(keysDown.has(this.controls.right)) dx += 1;

    const len = Math.hypot(dx, dy);
    this.moving = len > 0.05;
    if(len > 0){ dx /= len; dy /= len; }

    this.stamina = updateStamina(this.stamina, this.moving, dt);
    const speedFactor = isTired(this.stamina) ? 0.55 : 1;

    let nx = this.x + dx * this.speed * speedFactor * dt;
    let ny = this.y + dy * this.speed * speedFactor * dt;

    const margin = this.radius + 10;
    nx = Math.max(bounds.x + margin, Math.min(bounds.x + bounds.width - margin, nx));
    ny = Math.max(bounds.y + margin, Math.min(bounds.y + bounds.height - margin, ny));

    (obstacles || []).forEach(o => {
      const ddx = nx - o.x, ddy = ny - o.y;
      const dist = Math.hypot(ddx, ddy);
      const minDist = o.r + this.radius;
      if(dist > 0 && dist < minDist){
        nx = o.x + (ddx / dist) * minDist;
        ny = o.y + (ddy / dist) * minDist;
      }
    });

    this.x = nx; this.y = ny;
  }

  draw(ctx){
    const tired = isTired(this.stamina);

    ctx.save();
    ctx.translate(this.x, this.y);

    // Camel body (emoji), tinted via a colored disc behind it so each rider reads distinctly.
    ctx.beginPath();
    ctx.arc(0, 6, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.camelColor;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.font = (this.radius * 1.9) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐪', 0, 4);

    // Backpack + water container, always equipped.
    ctx.font = (this.radius * 0.7) + 'px sans-serif';
    ctx.fillText('🏒', this.radius * 0.7, -this.radius * 0.3); // backpack (brown bag icon)
    ctx.fillText('💧', -this.radius * 0.75, -this.radius * 0.3); // water droplet

    // Rider (small colored circle "child").
    ctx.beginPath();
    ctx.arc(0, -this.radius * 0.75, this.radius * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = this.clothingColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = '#3c2f26';
    ctx.font = 'bold 13px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.x, this.y - this.radius - 14);

    if(tired){
      ctx.font = '15px sans-serif';
      ctx.fillText('💤', this.x, this.y - this.radius - 30);
    }
  }
}
