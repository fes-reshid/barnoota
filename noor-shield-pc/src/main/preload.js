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
  activateLicense: (key) => ipcRenderer.invoke('license:activate', { key }),
  listHadith: () => ipcRenderer.invoke('hadith:list'),
  listBlocklist: () => ipcRenderer.invoke('blocklist:list'),
  refreshBlocklistFeed: () => ipcRenderer.invoke('blocklist:refreshFeed'),
  setBlocklistCategory: (category, enabled) => ipcRenderer.invoke('blocklist:setCategory', { category, enabled }),
  setSchedule: (schedule) => ipcRenderer.invoke('schedule:set', schedule),
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

  // Parent-gated (the protection service rejects these when locked, not this process)
  enableFilter: () => ipcRenderer.invoke('filter:enable'),
  disableFilter: () => ipcRenderer.invoke('filter:disable'),
  addBlockedSite: (input) => ipcRenderer.invoke('blocklist:add', { input }),
  removeBlockedSite: (domain) => ipcRenderer.invoke('blocklist:remove', { domain }),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),

  // Not gated: only ever restores DNS, never changes what protection is
  // supposed to do, so there's no reason to require the parent for it.
  repairDns: () => ipcRenderer.invoke('dns:repair'),

  // Fully removes the Windows service. Verified twice: once by the service
  // itself (the password check in service.prepareUninstall) and once by
  // Windows (deleting a service is an admin-only operation regardless of
  // what this app thinks).
  removeProtection: (password) => ipcRenderer.invoke('app:removeProtection', { password }),

  // Whether the always-on protection service is installed and reachable —
  // it can be running (or not) independently of whether this window is open.
  ensureService: () => ipcRenderer.invoke('app:ensureService'),

  // Activity log: blocked attempts only (see README). Gated by the service.
  listActivity: () => ipcRenderer.invoke('activity:list'),
  clearActivity: () => ipcRenderer.invoke('activity:clear'),

  // Email report: on-request only, no schedule. Gated by the shared parent
  // session (checked against the service, since this process holds no
  // password state of its own).
  getEmailSettings: () => ipcRenderer.invoke('email:getSettings'),
  saveEmailSettings: (settings) => ipcRenderer.invoke('email:saveSettings', settings),
  sendEmailReport: () => ipcRenderer.invoke('email:sendReport'),

  openExternal: (url) => ipcRenderer.invoke('app:openExternal', { url }),
});
