/* ===================== Player Controller =====================
   The shared physics, collision response and drawing every racer uses:
   gravity, jump (with one double jump), sliding, and reading input from
   one of four fixed keyboard zones. Character-specific abilities are
   layered on top by the four small controller subclasses in
   zaydController.js / laylaController.js / malikController.js /
   amiraController.js -- this class only knows generic racer physics. */

import { resolveCollisions, FALL_LIMIT, GROUND_Y } from './obstacleManager.js';
import { tokenSpeedMultiplier, isShielded } from './collectibleManager.js';

export const GRAVITY = 1500;
export const JUMP_VELOCITY = -560;
export const DOUBLE_JUMP_VELOCITY = -480;
export { GROUND_Y };

export const CONTROL_SCHEMES = [
  { label: 'D / W / S / A', right: 'KeyD', jump: 'KeyW', down: 'KeyS', ability: 'KeyA' },
  { label: 'Arrow Keys', right: 'ArrowRight', jump: 'ArrowUp', down: 'ArrowDown', ability: 'ArrowLeft' },
  { label: 'L / I / K / J', right: 'KeyL', jump: 'KeyI', down: 'KeyK', ability: 'KeyJ' },
  { label: 'H / T / G / F', right: 'KeyH', jump: 'KeyT', down: 'KeyG', ability: 'KeyF' }
];

const STAND_HEIGHT = 50;
const SLIDE_HEIGHT = 28;
const WIDTH = 32;

export class Racer {
  constructor(index, character){
    this.index = index;
    this.character = character;
    this.controls = CONTROL_SCHEMES[index];
    this.width = WIDTH;
    this.reset();
  }

  reset(){
    this.x = 60 + this.index * 26;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.jumpsUsed = 0;
    this.sliding = false;
    this.height = STAND_HEIGHT;
    this.finished = false;
    this.finishTime = null;
    this.lastCheckpointX = this.x;
    this.lastCheckpointY = this.y;
    this.abilityCooldownUntil = 0;
    this.abilityFlashUntil = 0;
    this.currentPlatform = null;
    this.tokens = { kindness: 0, helping: 0, patience: 0, teamwork: 0 };
    this.helpedCount = 0;
    this.correctChoices = 0;
    this.finishRank = null;
  }

  currentSpeed(){
    return this.character.baseSpeed;
  }

  flashAbility(now, durationMs){
    this.abilityFlashUntil = now + (durationMs || 400);
  }

  /* Overridden by each character subclass. */
  onAbilityPressed(now, level){}
  updateAbility(dt, input, now, level){}

  update(dt, input, now, level){
    if(this.finished) return;

    this.updateAbility(dt, input, now, level);

    if(!this._skipHorizontal){
      this.vx = input.right ? this.currentSpeed() * tokenSpeedMultiplier(this, now) : 0;
    }

    this.sliding = !!(input.down && this.grounded && this.vx > 0);
    this.height = this.sliding ? SLIDE_HEIGHT : STAND_HEIGHT;

    if(input.jumpPressed && !this._skipJump){
      if(this.grounded){
        this.vy = JUMP_VELOCITY;
        this.grounded = false;
        this.jumpsUsed = 1;
        this.currentPlatform = null;
      } else if(this.jumpsUsed < 2){
        this.vy = DOUBLE_JUMP_VELOCITY;
        this.jumpsUsed = 2;
      }
    }

    if(input.abilityPressed) this.onAbilityPressed(now, level);

    if(!this._skipGravity){
      this.vy += GRAVITY * dt;
    }

    this.x += this.vx * dt;
    if(this.currentPlatform && this.currentPlatform.moving){
      this.x += this.currentPlatform._dx || 0;
    }
    this.y += this.vy * dt;
    this.x = Math.max(20, this.x);

    resolveCollisions(this, level, dt, now);

    if(this.y > FALL_LIMIT){
      this.respawnAtCheckpoint();
    }
  }

  respawnAtCheckpoint(){
    this.x = this.lastCheckpointX;
    this.y = this.lastCheckpointY;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.jumpsUsed = 0;
  }

  draw(ctx, cameraX, now){
    const sx = this.x - cameraX;
    if(sx < -60 || sx > 1100) return;

    const c = this.character;
    const top = this.y - this.height;
    const flashing = now < this.abilityFlashUntil;

    if(flashing){
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(sx, top + this.height / 2, this.width * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.restore();
    }

    if(isShielded(this, now)){
      ctx.beginPath();
      ctx.arc(sx, top + this.height / 2, this.width * 0.95, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFD43B';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.fillStyle = c.color;
    ctx.strokeStyle = c.colorDark;
    ctx.lineWidth = 3;
    const r = 10;
    roundRect(ctx, sx - this.width / 2, top, this.width, this.height, r);
    ctx.fill();
    ctx.stroke();

    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.accent, sx, top - 4);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Baloo 2", sans-serif';
    ctx.fillText(String(this.index + 1), sx, top + this.height / 2 + 4);

    ctx.fillStyle = c.colorDark;
    ctx.font = 'bold 12px "Baloo 2", sans-serif';
    ctx.fillText(c.name, sx, top - 20);
  }
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export { STAND_HEIGHT, SLIDE_HEIGHT };
