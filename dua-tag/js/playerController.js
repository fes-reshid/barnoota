/* ===================== Player Controller =====================
   Movement, collision against the map's obstacles, and drawing for a
   single player. Colors are chosen from a colorblind-safe palette, and
   status ("It", protected, frozen) is always also shown as an icon/label,
   never by color alone. */

import { MAP_WIDTH, MAP_HEIGHT, getObstacles } from './mapEnvironment.js';

export const PLAYER_COLORS = ['#0072B2', '#E69F00', '#009E73', '#CC79A7'];
export const PLAYER_ACCESSORIES = ['🟦', '🟧', '🟩', '🟪']; // colored square swatches shown in the player-select UI

export const CONTROL_SCHEMES = [
  { label: 'W A S D', up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
  { label: 'Arrow Keys', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
  { label: 'I J K L', up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL' },
  { label: 'T F G H', up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH' }
];

const START_POSITIONS = [
  { x: 90, y: 60 }, { x: 810, y: 60 }, { x: 90, y: 540 }, { x: 810, y: 540 }
];

export class Player {
  constructor(index, name, color){
    this.index = index;
    this.name = name || ('Player ' + (index + 1));
    this.color = color || PLAYER_COLORS[index];
    this.radius = 18;
    this.speed = 190; // px/sec
    this.controls = CONTROL_SCHEMES[index];
    this.reset();
  }

  reset(){
    const p = START_POSITIONS[this.index];
    this.x = p.x; this.y = p.y;
    this.isIt = false;
    this.frozen = false;      // true while the du'a popup is open for this player
    this.protectedUntil = 0;  // performance.now() timestamp -- cannot be tagged until this passes
    this.tagLockedUntil = 0;  // performance.now() timestamp -- cannot tag anyone else until this passes
    this.timesIt = 0;
    this.duasRecited = 0;
    this.connected = true;    // local play: always true; kept for a future networked mode
  }

  isProtected(now){ return now < this.protectedUntil; }

  grantProtection(now, durationMs){ this.protectedUntil = now + durationMs; }

  update(dt, keysDown, gamepadVec){
    if(this.frozen) return;
    let dx = 0, dy = 0;
    if(keysDown.has(this.controls.up)) dy -= 1;
    if(keysDown.has(this.controls.down)) dy += 1;
    if(keysDown.has(this.controls.left)) dx -= 1;
    if(keysDown.has(this.controls.right)) dx += 1;
    if(gamepadVec){ dx += gamepadVec.x; dy += gamepadVec.y; }

    const len = Math.hypot(dx, dy);
    this.moving = len > 0.05;
    if(len > 0){ dx /= len; dy /= len; }

    let nx = this.x + dx * this.speed * dt;
    let ny = this.y + dy * this.speed * dt;

    const margin = this.radius + 14;
    nx = Math.max(margin, Math.min(MAP_WIDTH - margin, nx));
    ny = Math.max(margin, Math.min(MAP_HEIGHT - margin, ny));

    getObstacles().forEach(o => {
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

  draw(ctx, now){
    const protectedNow = this.isProtected(now);

    if(protectedNow){
      const pulse = 4 * Math.sin(now / 150);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFD43B';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if(this.isIt){
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#e0703a';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.frozen ? '#9aa0a6' : this.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(this.index + 1), this.x, this.y + 5);

    ctx.fillStyle = '#1c3a34';
    ctx.font = 'bold 13px "Nunito", sans-serif';
    ctx.fillText(this.name, this.x, this.y - this.radius - 10);

    if(this.isIt){
      ctx.font = '16px sans-serif';
      ctx.fillText('🏷️', this.x, this.y - this.radius - 26);
    } else if(protectedNow){
      ctx.font = '16px sans-serif';
      ctx.fillText('🛡️', this.x, this.y - this.radius - 26);
    } else if(this.frozen){
      ctx.font = '16px sans-serif';
      ctx.fillText('💬', this.x, this.y - this.radius - 26);
    }
  }
}
