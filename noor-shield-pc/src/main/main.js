'use strict';

const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, shell } = require('electron');
const path = require('path');

const { Store } = require('./store');
const hadith = require('./hadith');
const serviceClient = require('./serviceClient');

/**
 * The Electron process is now a thin control panel. All the actual
 * protection — the DNS proxy, system DNS changes, the parent password gate,
 * the blocklist — lives in the always-on Windows service (see ../../service),
 * which keeps running whether or not this GUI, or anyone at all, is signed
 * in. This process only owns what genuinely belongs to a signed-in user:
 * the window/tray, desktop notifications (services can't show these — they
 * run in Session 0, isolated from any desktop), and the personal tawbah
 * journal.
 */

let store; // per-user: journal + reminder interval only, not protection state
let mainWindow = null;
let tray = null;
let reminderTimer = null;
let quitting = false;

/* ------------------------------------------------------------------ *
 * Reminders (unchanged: these are a per-user desktop experience)
 * ------------------------------------------------------------------ */

function notify(title, body) {
  if (!Notification.isSupported()) return;
  new Notification({ title, body }).show();
}

function scheduleReminders() {
  if (reminderTimer) clearInterval(reminderTimer);
  const hours = Number(store.get('reminderIntervalHours')) || 4;
  reminderTimer = setInterval(() => {
    const pick = hadith.random();
    notify('A reminder', `${pick.text}\n\n— ${pick.source}`);
  }, hours * 60 * 60 * 1000);
}

/* ------------------------------------------------------------------ *
 * Window & tray
 * ------------------------------------------------------------------ */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    title: 'Noor Shield',
    backgroundColor: '#F6F5F0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Closing the window no longer needs to be intercepted for protection's
  // sake — the service keeps filtering regardless. It still hides to the
  // tray rather than fully quitting, purely so reminders/status stay one
  // click away instead of needing a relaunch.
  mainWindow.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showWindow() {
  if (!mainWindow) createWindow();
  else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function updateTray(status) {
  if (!tray) return;
  const on = Boolean(status && status.filterEnabled && status.proxyRunning);
  tray.setToolTip(on ? 'Noor Shield — protecting this PC' : 'Noor Shield — filter off');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: on ? 'Protection: on' : 'Protection: off', enabled: false },
      { type: 'separator' },
      { label: 'Open Noor Shield', click: showWindow },
      {
        // Deliberately not password-gated: a family whose internet breaks
        // shouldn't need the parent present just to get back online, and
        // this only ever restores DNS — it never turns the filter's saved
        // intent off, so protection resumes on the service's next start.
        label: 'Repair DNS (restore Windows settings)',
        click: async () => {
          await serviceClient.call('dns.repair', {});
          notify('DNS restored', 'Windows DNS settings have been put back.');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Noor Shield (window only — protection keeps running)',
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ])
  );
}

function createTray() {
  try {
    tray = new Tray(path.join(__dirname, '..', 'renderer', 'assets', 'tray.png'));
    tray.on('click', showWindow);
  } catch (err) {
    console.warn(`[tray] could not create tray icon: ${err.message}`);
  }
}

/* ------------------------------------------------------------------ *
 * IPC — thin proxies to the protection service
 * ------------------------------------------------------------------ */

// Old ipcMain channel names (kept so preload.js/renderer don't need to
// change) mapped to the service's RPC method names.
const SERVICE_PROXY_CHANNELS = {
  'status:get': 'status.get',
  'blocklist:list': 'blocklist.list',
  'parent:status': 'parent.status',
  'parent:lock': 'parent.lock',
  'filter:enable': 'filter.enable',
  'filter:disable': 'filter.disable',
  'dns:repair': 'dns.repair',
};

function registerServiceProxies() {
  for (const [channel, method] of Object.entries(SERVICE_PROXY_CHANNELS)) {
    ipcMain.handle(channel, async () => {
      const result = await serviceClient.call(method, {});
      if (channel === 'status:get') updateTray(result);
      return result;
    });
  }

  ipcMain.handle('parent:setup', (event, { password }) => serviceClient.call('parent.setup', { password }));
  ipcMain.handle('parent:unlock', (event, { password }) => serviceClient.call('parent.unlock', { password }));
  ipcMain.handle('parent:changePassword', (event, { currentPassword, newPassword }) =>
    serviceClient.call('parent.changePassword', { currentPassword, newPassword })
  );
  ipcMain.handle('parent:resetWithRecoveryKey', (event, { recoveryKey, newPassword }) =>
    serviceClient.call('parent.resetWithRecoveryKey', { recoveryKey, newPassword })
  );
  ipcMain.handle('blocklist:add', (event, { input }) => serviceClient.call('blocklist.add', { input }));
  ipcMain.handle('blocklist:remove', (event, { domain }) => serviceClient.call('blocklist.remove', { domain }));

  // Removing protection entirely: the service verifies the parent password
  // and restores DNS (service.prepareUninstall), then this — already
  // elevated — process deletes the service registration itself. See
  // serviceClient.uninstallService() for why that split exists.
  ipcMain.handle('app:removeProtection', async (event, { password }) => {
    const prepared = await serviceClient.call('parent.unlock', { password });
    if (!prepared.ok) return prepared;

    const stopped = await serviceClient.call('service.prepareUninstall', {});
    if (!stopped.ok) return stopped;

    return serviceClient.uninstallService();
  });

  ipcMain.handle('app:ensureService', () => serviceClient.ensureRunning());
}

/* ------------------------------------------------------------------ *
 * Journal & settings (per-user; not protection-critical, stays local)
 * ------------------------------------------------------------------ */

function registerLocalIpc() {
  ipcMain.handle('hadith:list', () => ({ ok: true, hadiths: hadith.HADITHS }));

  ipcMain.handle('journal:list', () => {
    const journal = store.get('journal') || [];
    const totalIstighfar = journal.reduce((sum, e) => sum + (Number(e.istighfarCount) || 0), 0);
    return { ok: true, entries: journal, totalIstighfar };
  });

  // The journal is the user's own spiritual practice, not a protection
  // setting — writing to it is deliberately NOT behind the parent password.
  ipcMain.handle('journal:add', (event, { note, istighfarCount }) => {
    const journal = store.get('journal') || [];
    journal.unshift({
      id: Date.now(),
      timestamp: Date.now(),
      note: String(note || '').slice(0, 500),
      istighfarCount: Math.max(0, Math.min(100000, Number(istighfarCount) || 0)),
    });
    store.set('journal', journal);
    return { ok: true };
  });

  ipcMain.handle('settings:update', (event, { reminderIntervalHours }) => {
    const hours = Number(reminderIntervalHours);
    if (!Number.isFinite(hours) || hours < 1 || hours > 24) {
      return { ok: false, error: 'Reminder interval must be between 1 and 24 hours.' };
    }
    store.set('reminderIntervalHours', hours);
    scheduleReminders();
    return { ok: true };
  });

  ipcMain.handle('app:openExternal', (event, { url }) => {
    if (/^https:\/\//i.test(String(url || ''))) shell.openExternal(url);
    return { ok: true };
  });
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);

  app.whenReady().then(async () => {
    store = new Store(app.getPath('userData'));

    registerServiceProxies();
    registerLocalIpc();
    createWindow();
    createTray();
    scheduleReminders();

    const ensured = await serviceClient.ensureRunning();
    if (!ensured.ok) {
      notify('Noor Shield needs attention', ensured.error);
    }
  });

  app.on('window-all-closed', () => {
    // Deliberately does nothing: the tray keeps the control panel reachable,
    // and protection itself no longer depends on this process at all.
  });

  // Any quit path other than the tray's explicit "Quit" — Cmd+Q, an OS
  // shutdown, app.quit() called elsewhere — should still actually quit
  // rather than get stuck behind the window's close-hides-to-tray handler.
  app.on('before-quit', () => {
    quitting = true;
  });
}
