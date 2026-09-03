'use strict';

const crypto = require('crypto');

/**
 * The parent's password: what stands between a child and turning the filter
 * off. Passwords are stored as scrypt hashes with a per-password random salt —
 * never in plaintext, never reversibly encrypted.
 *
 * Also issues a one-time recovery key at setup, so a forgotten password means
 * digging out a printed code rather than reinstalling Windows.
 *
 * The unlock state lives here in the main process, NOT in the renderer: the
 * renderer is a web page and anything it claims about being "unlocked" is
 * unverifiable. Every mutating IPC handler asks this object.
 */

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const UNLOCK_WINDOW_MS = 10 * 60 * 1000; // parent session auto-relocks after 10 idle minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 6;

function hash(secret, salt) {
  return crypto.scryptSync(secret, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS).toString('hex');
}

function newSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/** Constant-time compare so a wrong guess can't be narrowed down by timing. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Human-transcribable recovery key: 4 groups of 5 chars, no ambiguous letters. */
function generateRecoveryKey() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
  const groups = [];
  for (let g = 0; g < 4; g += 1) {
    let group = '';
    for (let i = 0; i < 5; i += 1) {
      group += alphabet[crypto.randomInt(alphabet.length)];
    }
    groups.push(group);
  }
  return groups.join('-');
}

class ParentAuth {
  constructor(store) {
    this.store = store;
    this.unlockedUntil = 0;
  }

  isConfigured() {
    const parent = this.store.get('parent');
    return Boolean(parent && parent.hash && parent.salt);
  }

  isUnlocked() {
    return this.isConfigured() ? Date.now() < this.unlockedUntil : true;
  }

  /**
   * Before a password is ever set, nothing is locked — otherwise a fresh
   * install would be unusable. Setup is therefore the first thing the UI asks for.
   */
  status() {
    const lock = this.store.get('failedUnlocks') || { count: 0, lockedUntil: 0 };
    return {
      configured: this.isConfigured(),
      unlocked: this.isUnlocked(),
      unlockedUntil: this.unlockedUntil,
      lockedOutUntil: lock.lockedUntil > Date.now() ? lock.lockedUntil : 0,
      attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - (lock.count || 0)),
    };
  }

  /** First-run setup. Refuses to silently overwrite an existing password. */
  setup(password) {
    if (this.isConfigured()) {
      return { ok: false, error: 'A parent password is already set. Use "Change password" instead.' };
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }

    const recoveryKey = generateRecoveryKey();
    const salt = newSalt();
    const recoverySalt = newSalt();

    this.store.set('parent', {
      salt,
      hash: hash(password, salt),
      recoverySalt,
      recoveryHash: hash(recoveryKey, recoverySalt),
      createdAt: Date.now(),
    });
    this.touch();

    // The only time the recovery key is ever readable — it is not stored in the clear.
    return { ok: true, recoveryKey };
  }

  unlock(password) {
    if (!this.isConfigured()) return { ok: true };

    const lock = this.store.get('failedUnlocks') || { count: 0, lockedUntil: 0 };
    if (lock.lockedUntil > Date.now()) {
      const minutes = Math.ceil((lock.lockedUntil - Date.now()) / 60000);
      return { ok: false, error: `Too many wrong attempts. Try again in ${minutes} minute(s).` };
    }

    const parent = this.store.get('parent');
    const attempt = hash(String(password || ''), parent.salt);

    if (!safeEqual(attempt, parent.hash)) {
      const count = (lock.count || 0) + 1;
      const lockedUntil = count >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
      this.store.set('failedUnlocks', { count: lockedUntil ? 0 : count, lockedUntil });
      return {
        ok: false,
        error: lockedUntil
          ? 'Too many wrong attempts. Locked for 5 minutes.'
          : `Wrong password. ${MAX_FAILED_ATTEMPTS - count} attempt(s) left.`,
      };
    }

    this.store.set('failedUnlocks', { count: 0, lockedUntil: 0 });
    this.touch();
    return { ok: true };
  }

  /** Extends the unlock window — called on each successful parent action. */
  touch() {
    this.unlockedUntil = Date.now() + UNLOCK_WINDOW_MS;
  }

  lock() {
    this.unlockedUntil = 0;
  }

  changePassword(currentPassword, newPassword) {
    if (!this.isConfigured()) return this.setup(newPassword);

    const verified = this.unlock(currentPassword);
    if (!verified.ok) return verified;

    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }

    const parent = this.store.get('parent');
    const salt = newSalt();
    this.store.set('parent', { ...parent, salt, hash: hash(newPassword, salt) });
    this.touch();
    return { ok: true };
  }

  /** Forgot-password path: the recovery key issued at setup sets a new password. */
  resetWithRecoveryKey(recoveryKey, newPassword) {
    if (!this.isConfigured()) return { ok: false, error: 'No parent password is set yet.' };
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }

    const parent = this.store.get('parent');
    const attempt = hash(String(recoveryKey || '').trim().toUpperCase(), parent.recoverySalt);
    if (!safeEqual(attempt, parent.recoveryHash)) {
      return { ok: false, error: 'That recovery key is not correct.' };
    }

    // Burn the used key and issue a fresh one, so a leaked slip of paper
    // doesn't stay valid forever.
    const newRecoveryKey = generateRecoveryKey();
    const salt = newSalt();
    const recoverySalt = newSalt();
    this.store.set('parent', {
      ...parent,
      salt,
      hash: hash(newPassword, salt),
      recoverySalt,
      recoveryHash: hash(newRecoveryKey, recoverySalt),
    });
    this.store.set('failedUnlocks', { count: 0, lockedUntil: 0 });
    this.touch();
    return { ok: true, recoveryKey: newRecoveryKey };
  }
}

module.exports = { ParentAuth, UNLOCK_WINDOW_MS, MIN_PASSWORD_LENGTH };
