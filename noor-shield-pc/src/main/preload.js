'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * The only surface the renderer gets. Context isolation is on and Node is off
 * in the renderer, so the UI can call exactly these channels and nothing else.
 *
 * Note what this bridge does NOT expose: any way to assert "the parent is
 * unlocked". Unlock state lives in the main process and is checked there on
 * every mutating call — the renderer can only ask, never claim.
 */
contextBridge.exposeInMainWorld('noor', {
  // Read-only
  getStatus: () => ipcRenderer.invoke('status:get'),
  listHadith: () => ipcRenderer.invoke('hadith:list'),
  listBlocklist: () => ipcRenderer.invoke('blocklist:list'),
  listJournal: () => ipcRenderer.invoke('journal:list'),
  addJournalEntry: (note, istighfarCount) =>
    ipcRenderer.invoke('journal:add', { note, istighfarCount }),

  // Parent account
  parentStatus: () => ipcRenderer.invoke('parent:status'),
  parentSetup: (password) => ipcRenderer.invoke('parent:setup', { password }),
  parentUnlock: (password) => ipcRenderer.invoke('parent:unlock', { password }),
  parentLock: () => ipcRenderer.invoke('parent:lock'),
  parentChangePassword: (currentPassword, newPassword) =>
    ipcRenderer.invoke('parent:changePassword', { currentPassword, newPassword }),
  parentResetWithRecoveryKey: (recoveryKey, newPassword) =>
    ipcRenderer.invoke('parent:resetWithRecoveryKey', { recoveryKey, newPassword }),

  // Parent-gated (main process rejects these when locked)
  enableFilter: () => ipcRenderer.invoke('filter:enable'),
  disableFilter: () => ipcRenderer.invoke('filter:disable'),
  addBlockedSite: (input) => ipcRenderer.invoke('blocklist:add', { input }),
  removeBlockedSite: (domain) => ipcRenderer.invoke('blocklist:remove', { domain }),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  quitApp: () => ipcRenderer.invoke('app:quit'),

  openExternal: (url) => ipcRenderer.invoke('app:openExternal', { url }),
});
