'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * The lock-overlay window's own tiny bridge — deliberately separate from
 * preload.js (the main app window's much larger surface). This window only
 * ever needs one thing: a way to try the local parent password as a
 * fallback when remote unlock isn't reachable (no internet, Supabase down,
 * etc.) — see lock-overlay.html and handlers.js's 'cloud.localUnlock'.
 */
contextBridge.exposeInMainWorld('noorLock', {
  unlock: (password) => ipcRenderer.invoke('lock:unlock', { password }),
});
