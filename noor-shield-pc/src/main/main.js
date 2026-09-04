'use strict';

const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, shell, dialog } = require('electron');
const path = require('path');

// A tester's PC showed a completely blank window with DevTools unable to
// open at all — not just our page failing, but Chromium's own rendering/
// DevTools pipeline not functioning. That pattern (blank window + DevTools
// silently refusing to open) is a known Electron failure mode on some
// Windows setups (blocked or buggy GPU drivers, remote desktop/VDI
// sessions, some locked-down corporate laptops) where hardware-accelerated
// rendering fails silently. Forcing software rendering is the standard
// fix, and it must happen before app.whenReady() to take effect.
app.disableHardwareAcceleration();

// Disabling GPU acceleration alone didn't fix a second tester's totally
// blank window (content never renders, and even "Toggle Developer Tools"
// from the menu does nothing) — the next most common cause of exactly that
// combination is Chromium's OS-level renderer sandbox itself failing to
// initialize. That happens on some Windows machines where antivirus/EDR
// software hooks process creation, or restrictive group policy blocks the
// low-privilege AppContainer Chromium's sandbox relies on — the renderer
// process never actually starts, so nothing can ever paint and DevTools has
// nothing to attach to. --no-sandbox disables that OS-level sandboxing
// globally; contextIsolation + nodeIntegration:false (still set below) stay
// on and remain the app's real security boundary against renderer content.
app.commandLine.appendSwitch('no-sandbox');

const { Store } = require('./store');
const hadith = require('./hadith');
const serviceClient = require('./serviceClient');
const secretStore = require('./secretStore');
const emailReport = require('./emailReport');
const { isElevated, relaunchElevated } = require('./elevation');

// node-windows performs some of its setup (creating its own "daemon" work
// folder under Program Files) with a raw fs callback rather than a promise,
// so a permission failure there throws asynchronously outside of any
// try/catch or .catch() we could otherwise wrap it in — it would otherwise
// surface as Electron's default, unhelpful "A JavaScript error occurred in
// the main process" dialog. This is a safety net for that (and anything
// else that manages to slip past our own error handling); the real fix is
// the elevation check below, which stops it from happening in the first
// place.
process.on('uncaughtException', (err) => {
  console.error('[main] uncaughtException:', err);
  try {
    dialog.showErrorBox(
      'Noor Shield ran into a problem',
      'Something went wrong while setting up protection:\n\n' +
        `${err.message}\n\n` +
        'Please close Noor Shield, right-click its icon, and choose ' +
        '"Run as administrator". If this keeps happening, uninstall and ' +
        'reinstall Noor Shield.'
    );
  } catch (_) {
    // Too early for a dialog (e.g. before app is ready) — nothing more we can do.
  }
});

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
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Defense-in-depth alongside app.js's own on-page error overlay: these
  // cover failures the renderer script can never see itself — the preload
  // script throwing before contextBridge runs, or index.html failing to
  // load at all — either of which would otherwise just leave a window with
  // nothing in it and no visible sign of why.
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    dialog.showErrorBox(
      'Noor Shield failed to start correctly',
      `The app's preload script failed:\n\n${error.message}\n\nTry reinstalling Noor Shield.`
    );
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (errorCode === -3) return; // ERR_ABORTED — a normal navigation cancel, not a real failure
    dialog.showErrorBox(
      'Noor Shield failed to load its window',
      `${errorDescription} (${errorCode})\n\nTry reinstalling Noor Shield.`
    );
  });

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

  // The activity log (blocked attempts only) lives in the service's store —
  // it's generated by the DNS proxy the service runs. Gated there, same as
  // everything else that reveals what the child has been doing.
  ipcMain.handle('activity:list', () => serviceClient.call('activity.list', {}));
  ipcMain.handle('activity:clear', () => serviceClient.call('activity.clear', {}));

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
 * Email report (per-user SMTP settings; the parent session that gates it
 * lives in the service, so these check in with the service rather than
 * keeping — or duplicating — any auth state of their own)
 * ------------------------------------------------------------------ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a `{ ok:false, ... }` gate result if the parent session isn't unlocked, else null. */
async function requireParentUnlocked() {
  const status = await serviceClient.call('parent.status', {});
  if (status.serviceUnreachable) return status;
  if (!status.unlocked) return { ok: false, error: 'locked', needsParent: true };
  return null;
}

function registerEmailIpc() {
  ipcMain.handle('email:getSettings', async () => {
    const gate = await requireParentUnlocked();
    if (gate) return gate;

    const smtp = store.get('emailSmtp') || {};
    return {
      ok: true,
      host: smtp.host || '',
      port: smtp.port || 587,
      secure: Boolean(smtp.secure),
      user: smtp.user || '',
      from: smtp.from || '',
      recipient: store.get('emailRecipient') || '',
      hasPassword: Boolean(store.get('emailSmtpPasswordEnc')),
      secureStorageAvailable: secretStore.isAvailable(),
    };
  });

  ipcMain.handle('email:saveSettings', async (event, { host, port, secure, user, from, recipient, password }) => {
    const gate = await requireParentUnlocked();
    if (gate) return gate;

    const trimmedHost = String(host || '').trim();
    const trimmedRecipient = String(recipient || '').trim();
    if (!trimmedHost) return { ok: false, error: 'Enter an SMTP server address.' };
    if (trimmedRecipient && !EMAIL_REGEX.test(trimmedRecipient)) {
      return { ok: false, error: 'That recipient address doesn\'t look valid.' };
    }

    store.set('emailSmtp', {
      host: trimmedHost,
      port: Number(port) || 587,
      secure: Boolean(secure),
      user: String(user || '').trim(),
      from: String(from || '').trim(),
    });
    store.set('emailRecipient', trimmedRecipient);

    // Blank password field means "keep what's already saved" — never forces
    // a re-entry just to change the recipient address.
    if (password) {
      try {
        store.set('emailSmtpPasswordEnc', secretStore.encrypt(password));
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    return { ok: true };
  });

  ipcMain.handle('email:sendReport', async () => {
    const gate = await requireParentUnlocked();
    if (gate) return gate;

    const smtp = store.get('emailSmtp');
    const recipient = store.get('emailRecipient');
    if (!smtp || !smtp.host) return { ok: false, error: 'Set up email settings first.' };
    if (!recipient) return { ok: false, error: 'Enter a recipient email address first.' };

    let password = '';
    try {
      password = secretStore.decrypt(store.get('emailSmtpPasswordEnc'));
    } catch (err) {
      return { ok: false, error: err.message };
    }

    const activity = await serviceClient.call('activity.list', {});
    if (!activity.ok) return activity;

    try {
      await emailReport.sendReport({
        smtp: { ...smtp, password },
        recipient,
        entries: activity.entries,
        totalCount: activity.totalCount,
      });
    } catch (err) {
      return { ok: false, error: `Could not send the report: ${err.message}` };
    }

    return { ok: true, sentCount: activity.entries.length };
  });
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

if (process.platform === 'win32' && app.isPackaged && !isElevated()) {
  // The packaged .exe is meant to always run elevated (build config sets
  // requestedExecutionLevel: requireAdministrator), but that only takes
  // effect if the manifest embedding step actually ran during packaging.
  // Checking here — and self-relaunching elevated if it didn't — means a
  // build where that step silently failed still works instead of crashing
  // the moment it tries to install the service (see the EPERM mkdir under
  // Program Files\...\node-windows\lib\daemon that motivated this check).
  relaunchElevated();
  app.exit(0);
} else if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);

  app.whenReady().then(async () => {
    store = new Store(app.getPath('userData'));

    registerServiceProxies();
    registerEmailIpc();
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
