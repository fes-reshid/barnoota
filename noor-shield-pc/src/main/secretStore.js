'use strict';

const { safeStorage } = require('electron');

/**
 * Thin wrapper around Electron's safeStorage (OS-level encryption — DPAPI on
 * Windows) for the one real credential this app holds: the parent's SMTP
 * password for sending activity reports. Never stored in plaintext JSON.
 */

function isAvailable() {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch (_) {
    return false;
  }
}

function encrypt(plainText) {
  if (!isAvailable()) {
    throw new Error('This PC has no OS-level secure storage available, so the password cannot be saved safely.');
  }
  return safeStorage.encryptString(String(plainText)).toString('base64');
}

function decrypt(base64Ciphertext) {
  if (!base64Ciphertext) return '';
  if (!isAvailable()) {
    throw new Error('This PC has no OS-level secure storage available, so the saved password cannot be read back.');
  }
  return safeStorage.decryptString(Buffer.from(base64Ciphertext, 'base64'));
}

module.exports = { isAvailable, encrypt, decrypt };
