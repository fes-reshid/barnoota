'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Small JSON store in Electron's userData directory. Everything Noor Shield
 * keeps — the parent's password hash, custom blocked domains, the tawbah
 * journal — lives here on the machine. Nothing is uploaded anywhere.
 */

const DEFAULTS = {
  parent: null, // { salt, hash, recoverySalt, recoveryHash, createdAt }
  filterEnabled: true, // protection is on by default, as on Android
  customDomains: [], // [{ domain, addedAt }]
  journal: [], // [{ id, timestamp, note, istighfarCount }]
  previousDns: null, // saved adapter DNS config, for restore
  reminderIntervalHours: 4,
  failedUnlocks: { count: 0, lockedUntil: 0 },
  activityLog: [], // [{ id, domain, timestampMs }] — blocked attempts only; service-owned
  emailSmtp: null, // { host, port, secure, user, from } — GUI-owned, password stored separately (encrypted)
  emailSmtpPasswordEnc: null, // base64 ciphertext from Electron's safeStorage, or null
  emailRecipient: null,
  // Adult content is always filtered — this app's core purpose, not a
  // toggle. Malware/phishing and ad/tracker blocking (see feedBlocklist.js)
  // are on by default but parent-toggleable, since ad blocking in
  // particular can occasionally break a site's layout or functionality.
  filterCategories: { security: true, ads: true },
  // A single recurring full-internet-off window (e.g. a school-night
  // bedtime) — see schedule.js for exactly how days/startTime/endTime
  // combine, especially for a window that crosses midnight.
  schedule: { enabled: false, days: [0, 1, 2, 3, 4], startTime: '21:00', endTime: '07:00' },
  // Product-key activation (see src/main/license.js). Separate on purpose
  // from `parent` (the password/recovery-key system) — activation and
  // account recovery are different concerns and shouldn't share a secret.
  activated: false,
  // A random id this PC generates for itself the first time it tries to
  // activate a product key, and reuses on every later attempt (see
  // license.js's activateKeyOnline). Lets Supabase tell "this same PC is
  // reactivating its own key, e.g. after a reinstall" apart from "a
  // different PC is trying to reuse someone else's key" — nothing to do
  // with the separate `cloud.deviceId` used for remote-control pairing.
  license: { deviceId: null },
  // Set once, the first time the protection service ever starts on this
  // PC — the anchor for the free trial window (see license.js). Not reset
  // by reinstalling the app; only a full "Remove protection completely"
  // (which deletes this whole data directory) starts a new trial.
  firstRunAt: null,
  // Remote control pairing (see service/cloudSync.js). deviceSecret is a
  // long random token this PC generated for itself and never shares except
  // with the cloud project it's paired to — it's the only thing that proves
  // "yes, this request really is from this PC" to the remote commands table.
  // pendingPairing holds a not-yet-claimed code (cleared once claimed or on
  // cancel); deviceId is set once a parent claims that code from the web
  // dashboard, which is what "paired" means here.
  cloud: { deviceId: null, deviceSecret: null, pendingPairing: null },
  // A remotely-issued "enforce sleep now" sets this to a future timestamp
  // (ms since epoch); the schedule check treats "now" as within the
  // bedtime window for as long as this is in the future, independent of
  // the PC's own configured weekly schedule. Null means no remote override.
  forceSleepUntil: null,
  // Set by a remote lock_computer command, cleared by unlock_computer. The
  // GUI (main.js) polls this and shows a full-screen "ask your parent"
  // overlay while it's true — necessary because just locking the Windows
  // session (which also happens immediately, see cloudSync.js) does
  // nothing if the child has their own account and password to log back
  // in with; this is what actually keeps them out afterwards.
  remoteLockActive: false,
  // Sites the parent added for this specific PC from the web dashboard
  // (device_domains in Supabase — see service/cloudSync.js), synced down
  // and merged into the live blocklist alongside customDomains. Always
  // wholesale-replaced from the cloud's current list, never edited locally.
  cloudBlockedDomains: [],
};

class Store {
  constructor(userDataPath) {
    this.file = path.join(userDataPath, 'noor-shield.json');
    this.data = { ...DEFAULTS };
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.file, 'utf8');
      this.data = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`[store] could not read ${this.file}: ${err.message}`);
      }
      this.data = { ...DEFAULTS };
    }
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      // Write-then-rename so a crash mid-write can't truncate the real file.
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmp, this.file);
    } catch (err) {
      console.error(`[store] could not write ${this.file}: ${err.message}`);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  update(patch) {
    Object.assign(this.data, patch);
    this.save();
  }
}

module.exports = { Store, DEFAULTS };
