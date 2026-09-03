'use strict';

const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, dialog, shell } = require('electron');
const path = require('path');

const { Store } = require('./store');
const { ParentAuth } = require('./parentAuth');
const { DnsProxy } = require('./dnsProxy');
const systemDns = require('./systemDns');
const hadith = require('./hadith');
const {
  Blocklist,
  loadSeedDomains,
  normalizeDomain,
  isValidDomain,
} = require('./blocklist');

let store;
let parentAuth;
let dnsProxy;
let mainWindow = null;
let tray = null;
let reminderTimer = null;
let quitConfirmed = false; // set only after the parent authorises a real quit
const seedDomains = loadSeedDomains();

/* ------------------------------------------------------------------ *
 * Blocklist plumbing
 * ------------------------------------------------------------------ */

function buildBlocklist() {
  const custom = (store.get('customDomains') || []).map((entry) => entry.domain);
  return new Blocklist(seedDomains, custom);
}

function refreshBlocklist() {
  if (dnsProxy) dnsProxy.setBlocklist(buildBlocklist());
}

/* ------------------------------------------------------------------ *
 * Filter lifecycle
 * ------------------------------------------------------------------ */

async function startFilter() {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'The filter currently supports Windows only.' };
  }
  if (!(await systemDns.isElevated())) {
    return {
      ok: false,
      error:
        'Noor Shield needs to run as Administrator to change this PC\'s DNS settings. ' +
        'Close it and choose "Run as administrator".',
    };
  }

  if (!dnsProxy) dnsProxy = new DnsProxy({ blocklist: buildBlocklist() });

  if (!dnsProxy.isRunning) {
    try {
      await dnsProxy.start();
    } catch (err) {
      const reason =
        err.code === 'EADDRINUSE'
          ? 'Port 53 is already in use — another DNS or filtering program may be running.'
          : err.code === 'EACCES'
            ? 'Windows refused to let Noor Shield listen on port 53. Run it as Administrator.'
            : err.message;
      return { ok: false, error: `Could not start the local resolver: ${reason}` };
    }
  }

  try {
    const previous = await systemDns.apply();
    // Only persist the pre-Noor-Shield config; never overwrite it with our own
    // 127.0.0.1 entry, or restore would have nothing real to put back.
    const worthSaving = previous.some((a) => (a.serverAddresses || []).some((s) => s !== '127.0.0.1'));
    if (worthSaving || !store.get('previousDns')) store.set('previousDns', previous);
  } catch (err) {
    await dnsProxy.stop();
    return { ok: false, error: `Could not point Windows at the filter: ${err.message}` };
  }

  store.set('filterEnabled', true);
  updateTray();
  return { ok: true };
}

async function stopFilter() {
  try {
    await systemDns.restore(store.get('previousDns'));
  } catch (err) {
    console.error(`[filter] DNS restore failed: ${err.message}`);
  }
  if (dnsProxy) await dnsProxy.stop();
  store.set('filterEnabled', false);
  updateTray();
  return { ok: true };
}

/**
 * On launch, reconcile what the store believes with what the machine actually
 * looks like. A crash can leave Windows pointed at 127.0.0.1 with no resolver
 * behind it — that machine has no working DNS until we either restart the
 * proxy or put the old servers back.
 */
async function reconcileOnStartup() {
  if (process.platform !== 'win32') return;

  const shouldRun = store.get('filterEnabled');
  let redirected = false;
  try {
    redirected = await systemDns.isRedirected();
  } catch (err) {
    console.error(`[startup] could not read DNS config: ${err.message}`);
    return;
  }

  if (shouldRun) {
    const result = await startFilter();
    if (!result.ok && redirected) {
      // We can't filter but the machine is still pointed at us: repair DNS
      // rather than leave the family with no internet.
      await systemDns.restore(store.get('previousDns')).catch(() => {});
      notify('Noor Shield could not start', result.error);
    }
  } else if (redirected) {
    await systemDns.restore(store.get('previousDns')).catch(() => {});
  }
}

/* ------------------------------------------------------------------ *
 * Reminders
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

  // Closing the window must not quietly end protection. It hides to the tray;
  // a real quit goes through the parent password (see 'before-quit').
  mainWindow.on('close', (event) => {
    if (!quitConfirmed && store.get('filterEnabled')) {
      event.preventDefault();
      mainWindow.hide();
      notify('Noor Shield is still protecting this PC', 'It is running in the notification area.');
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

function updateTray() {
  if (!tray) return;
  const on = Boolean(store.get('filterEnabled'));
  tray.setToolTip(on ? 'Noor Shield — protecting this PC' : 'Noor Shield — filter off');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: on ? 'Protection: on' : 'Protection: off', enabled: false },
      { type: 'separator' },
      { label: 'Open Noor Shield', click: showWindow },
      {
        // Escape hatch that does not require the password: it only ever puts
        // DNS back, never disables the filter's intent. A family whose
        // internet is broken should not need the parent to be home.
        label: 'Repair DNS (restore Windows settings)',
        click: async () => {
          await systemDns.restore(store.get('previousDns')).catch(() => {});
          notify('DNS restored', 'Windows DNS settings have been put back.');
        },
      },
      { type: 'separator' },
      { label: 'Quit (needs parent password)', click: showWindow },
    ])
  );
}

function createTray() {
  try {
    tray = new Tray(path.join(__dirname, '..', 'renderer', 'assets', 'tray.png'));
    tray.on('click', showWindow);
    updateTray();
  } catch (err) {
    // A missing tray icon shouldn't stop the app from protecting the machine.
    console.warn(`[tray] could not create tray icon: ${err.message}`);
  }
}

/* ------------------------------------------------------------------ *
 * IPC — the security boundary
 * ------------------------------------------------------------------ */

/**
 * Wraps a handler so it only runs when the parent session is unlocked.
 *
 * This is the whole point of the design: the renderer is a web page and cannot
 * be trusted to tell us whether the parent is present. Hiding a button is a
 * UI nicety; THIS is the enforcement.
 */
function parentOnly(handler) {
  return async (event, ...args) => {
    if (!parentAuth.isUnlocked()) {
      return { ok: false, error: 'locked', needsParent: true };
    }
    parentAuth.touch(); // active parent use keeps the session alive
    return handler(event, ...args);
  };
}

function registerIpc() {
  /* --- Free to read: status, hadith, journal (per the parent-lock design) --- */

  ipcMain.handle('status:get', async () => ({
    ok: true,
    platform: process.platform,
    filterEnabled: Boolean(store.get('filterEnabled')),
    proxyRunning: Boolean(dnsProxy && dnsProxy.isRunning),
    elevated: await systemDns.isElevated(),
    stats: dnsProxy ? dnsProxy.stats : { queries: 0, blocked: 0, forwarded: 0, failed: 0 },
    seedCount: seedDomains.length,
    customCount: (store.get('customDomains') || []).length,
    parent: parentAuth.status(),
  }));

  ipcMain.handle('hadith:list', () => ({ ok: true, hadiths: hadith.HADITHS }));

  ipcMain.handle('blocklist:list', () => ({
    ok: true,
    custom: store.get('customDomains') || [],
    seedCount: seedDomains.length,
  }));

  ipcMain.handle('journal:list', () => {
    const journal = store.get('journal') || [];
    const totalIstighfar = journal.reduce((sum, e) => sum + (Number(e.istighfarCount) || 0), 0);
    return { ok: true, entries: journal, totalIstighfar };
  });

  // The journal is the child's own spiritual practice, not a protection
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

  /* --- Parent account --- */

  ipcMain.handle('parent:status', () => ({ ok: true, ...parentAuth.status() }));
  ipcMain.handle('parent:setup', (event, { password }) => parentAuth.setup(password));
  ipcMain.handle('parent:unlock', (event, { password }) => parentAuth.unlock(password));
  ipcMain.handle('parent:lock', () => {
    parentAuth.lock();
    return { ok: true };
  });
  ipcMain.handle('parent:changePassword', (event, { currentPassword, newPassword }) =>
    parentAuth.changePassword(currentPassword, newPassword)
  );
  ipcMain.handle('parent:resetWithRecoveryKey', (event, { recoveryKey, newPassword }) =>
    parentAuth.resetWithRecoveryKey(recoveryKey, newPassword)
  );

  /* --- Everything that changes protection: parent only --- */

  ipcMain.handle('filter:enable', parentOnly(() => startFilter()));
  ipcMain.handle('filter:disable', parentOnly(() => stopFilter()));

  ipcMain.handle(
    'blocklist:add',
    parentOnly((event, { input }) => {
      const domain = normalizeDomain(input);
      if (!domain) return { ok: false, error: 'Enter a website address.' };
      if (!isValidDomain(domain)) {
        return { ok: false, error: 'That doesn\'t look like a valid website (e.g. example.com).' };
      }
      if (buildBlocklist().isBlocked(domain)) {
        return { ok: false, error: 'That site is already blocked.' };
      }

      const custom = store.get('customDomains') || [];
      custom.unshift({ domain, addedAt: Date.now() });
      store.set('customDomains', custom);
      refreshBlocklist(); // applies immediately, no restart
      return { ok: true, domain };
    })
  );

  ipcMain.handle(
    'blocklist:remove',
    parentOnly((event, { domain }) => {
      const custom = (store.get('customDomains') || []).filter((e) => e.domain !== domain);
      store.set('customDomains', custom);
      refreshBlocklist();
      return { ok: true };
    })
  );

  ipcMain.handle(
    'settings:update',
    parentOnly((event, { reminderIntervalHours }) => {
      const hours = Number(reminderIntervalHours);
      if (!Number.isFinite(hours) || hours < 1 || hours > 24) {
        return { ok: false, error: 'Reminder interval must be between 1 and 24 hours.' };
      }
      store.set('reminderIntervalHours', hours);
      scheduleReminders();
      return { ok: true };
    })
  );

  // Quitting stops protection, so it is a parent action like any other.
  ipcMain.handle(
    'app:quit',
    parentOnly(async () => {
      quitConfirmed = true;
      await stopFilter();
      app.quit();
      return { ok: true };
    })
  );

  ipcMain.handle('app:openExternal', (event, { url }) => {
    if (/^https:\/\//i.test(String(url || ''))) shell.openExternal(url);
    return { ok: true };
  });
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

// A second instance would fight the first over port 53 and the DNS settings.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);

  app.whenReady().then(async () => {
    store = new Store(app.getPath('userData'));
    parentAuth = new ParentAuth(store);

    registerIpc();
    createWindow();
    createTray();
    scheduleReminders();
    await reconcileOnStartup();
  });

  // Never leave the machine without DNS because our process is going away.
  app.on('before-quit', async (event) => {
    if (!quitConfirmed && store && store.get('filterEnabled')) {
      event.preventDefault();
      showWindow();
      return;
    }
    if (store && store.get('previousDns')) {
      await systemDns.restore(store.get('previousDns')).catch(() => {});
    }
  });

  app.on('window-all-closed', () => {
    // Deliberately does nothing: the tray keeps the filter alive.
  });
}
