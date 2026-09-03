'use strict';

/**
 * Renderer logic. Deliberately dumb about security: it asks the main process
 * for everything and reacts to what it's told. When a call comes back with
 * { needsParent: true } it shows the password dialog and retries — it never
 * decides for itself whether an action is allowed.
 */

const $ = (id) => document.getElementById(id);
const api = window.noor;

let pendingAction = null; // retried after a successful unlock

/* ------------------------------------------------------------------ *
 * Parent gate helpers
 * ------------------------------------------------------------------ */

function showUnlock(reason, retry) {
  $('unlock-reason').textContent = reason || 'Enter the parent password to change this setting.';
  $('unlock-password').value = '';
  hideError($('unlock-error'));
  $('recover-form').hidden = true;
  pendingAction = retry || null;
  $('unlock-gate').hidden = false;
  $('unlock-password').focus();
}

function hideError(el) {
  el.hidden = true;
  el.textContent = '';
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

/**
 * Calls a parent-gated API. If the main process says we're locked, prompts for
 * the password and runs the same call again once unlocked.
 */
async function callGated(fn, reason) {
  const result = await fn();
  if (result && result.needsParent) {
    showUnlock(reason, fn);
    return null;
  }
  return result;
}

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

$('nav').addEventListener('click', (event) => {
  const button = event.target.closest('.navitem');
  if (!button) return;
  const view = button.dataset.view;

  document.querySelectorAll('.navitem').forEach((b) => b.classList.toggle('active', b === button));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.dataset.view === view));

  if (view === 'blocklist') renderBlocklist();
  if (view === 'journal') renderJournal();
  if (view === 'settings') renderSettings();
});

/* ------------------------------------------------------------------ *
 * First-run setup
 * ------------------------------------------------------------------ */

$('setup-submit').addEventListener('click', async () => {
  const password = $('setup-password').value;
  const confirm = $('setup-confirm').value;
  hideError($('setup-error'));

  if (password.length < 6) {
    showError($('setup-error'), 'Password must be at least 6 characters.');
    return;
  }
  if (password !== confirm) {
    showError($('setup-error'), 'The two passwords do not match.');
    return;
  }

  const result = await api.parentSetup(password);
  if (!result.ok) {
    showError($('setup-error'), result.error);
    return;
  }

  $('setup-gate').hidden = true;
  $('recovery-key').textContent = result.recoveryKey;
  $('recovery-gate').hidden = false;
});

$('recovery-ack').addEventListener('change', (event) => {
  $('recovery-continue').disabled = !event.target.checked;
});

$('recovery-continue').addEventListener('click', async () => {
  $('recovery-gate').hidden = true;
  $('shell').hidden = false;
  // Protection is on by default, so switch it on as soon as setup is done.
  await callGated(() => api.enableFilter(), 'Enter the parent password to start the filter.');
  refreshStatus();
});

/* ------------------------------------------------------------------ *
 * Unlock dialog
 * ------------------------------------------------------------------ */

$('unlock-submit').addEventListener('click', async () => {
  const result = await api.parentUnlock($('unlock-password').value);
  if (!result.ok) {
    showError($('unlock-error'), result.error);
    return;
  }
  $('unlock-gate').hidden = true;
  const retry = pendingAction;
  pendingAction = null;
  if (retry) await retry();
  refreshStatus();
  renderSettings();
});

$('unlock-password').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') $('unlock-submit').click();
});

$('unlock-cancel').addEventListener('click', () => {
  pendingAction = null;
  $('unlock-gate').hidden = true;
});

$('unlock-forgot').addEventListener('click', () => {
  $('recover-form').hidden = !$('recover-form').hidden;
});

$('recover-submit').addEventListener('click', async () => {
  const result = await api.parentResetWithRecoveryKey($('recover-key').value, $('recover-newpass').value);
  if (!result.ok) {
    showError($('unlock-error'), result.error);
    return;
  }
  $('unlock-gate').hidden = true;
  $('recovery-key').textContent = result.recoveryKey;
  $('recovery-ack').checked = false;
  $('recovery-continue').disabled = true;
  $('recovery-gate').hidden = false; // a new key was issued; show it once
});

/* ------------------------------------------------------------------ *
 * Protection view
 * ------------------------------------------------------------------ */

$('filter-toggle').addEventListener('click', async () => {
  const status = await api.getStatus();
  const turningOn = !status.filterEnabled;

  const result = await callGated(
    () => (turningOn ? api.enableFilter() : api.disableFilter()),
    turningOn
      ? 'Enter the parent password to turn protection on.'
      : 'Enter the parent password to turn protection off.'
  );

  if (result && !result.ok) {
    $('status-detail').textContent = result.error;
  }
  refreshStatus();
});

async function refreshStatus() {
  const status = await api.getStatus();
  const serviceWarning = $('service-warning');

  if (status.serviceUnreachable) {
    serviceWarning.hidden = false;
    $('service-warning-title').textContent = 'Protection service not running';
    $('service-warning-detail').textContent =
      `${status.error} Reopening Noor Shield as Administrator installs and starts it automatically.`;

    $('status-pill').textContent = 'Unknown';
    $('status-pill').className = 'statuspill off';
    $('status-detail').textContent = 'Cannot reach the protection service to check whether this PC is protected.';
    $('filter-toggle').disabled = true;
    $('filter-toggle').textContent = 'Unavailable';
    $('admin-warning').hidden = true;
    $('lockdot').className = 'lockdot';
    $('parent-state-label').textContent = 'Unknown';
    return;
  }
  serviceWarning.hidden = true;

  const pill = $('status-pill');
  const detail = $('status-detail');
  const toggle = $('filter-toggle');

  const running = status.filterEnabled && status.proxyRunning;
  pill.textContent = running ? 'Protected' : status.filterEnabled ? 'Not enforcing' : 'Off';
  pill.className = `statuspill ${running ? 'on' : 'off'}`;

  detail.textContent = running
    ? 'Every app on this PC resolves through Noor Shield. Blocked domains do not resolve.'
    : status.filterEnabled
      ? 'Protection is meant to be on, but the local resolver is not running. Check the warnings below.'
      : 'The filter is off. Nothing on this PC is being blocked right now.';

  toggle.textContent = status.filterEnabled ? 'Turn protection off' : 'Turn protection on';
  toggle.disabled = false;
  toggle.className = `btn ${status.filterEnabled ? 'ghost' : 'primary'}`;

  $('stat-blocked').textContent = status.stats.blocked;
  $('stat-queries').textContent = status.stats.queries;
  $('stat-domains').textContent = status.seedCount + status.customCount;

  $('admin-warning').hidden = status.elevated || status.platform !== 'win32';

  // Sidebar lock indicator
  const unlocked = status.parent.configured ? status.parent.unlocked : true;
  $('lockdot').className = `lockdot ${unlocked ? 'unlocked' : ''}`;
  $('parent-state-label').textContent = unlocked ? 'Parent unlocked' : 'Locked';
  $('parent-toggle').textContent = unlocked ? 'Lock' : 'Unlock';
}

$('parent-toggle').addEventListener('click', async () => {
  const status = await api.parentStatus();
  if (status.unlocked && status.configured) {
    await api.parentLock();
    refreshStatus();
    renderSettings();
  } else {
    showUnlock('Enter the parent password to unlock settings.', null);
  }
});

/* ------------------------------------------------------------------ *
 * Blocked sites view
 * ------------------------------------------------------------------ */

$('block-add').addEventListener('click', addBlockedSite);
$('block-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addBlockedSite();
});

async function addBlockedSite() {
  const input = $('block-input').value;
  const message = $('block-message');
  message.textContent = '';
  message.className = 'hint';

  const result = await callGated(
    () => api.addBlockedSite(input),
    'Enter the parent password to add a blocked site.'
  );
  if (!result) return; // unlock dialog shown; will retry

  if (result.ok) {
    message.textContent = `Blocked "${result.domain}".`;
    message.className = 'success';
    $('block-input').value = '';
  } else {
    message.textContent = result.error;
    message.className = 'error';
  }
  renderBlocklist();
  refreshStatus();
}

async function renderBlocklist() {
  const data = await api.listBlocklist();
  const list = $('custom-list');
  list.textContent = '';

  if (data.serviceUnreachable) {
    $('seed-count').textContent = '—';
    $('custom-count').textContent = '—';
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'The protection service is not reachable right now.';
    list.appendChild(empty);
    return;
  }

  $('seed-count').textContent = data.seedCount;
  $('custom-count').textContent = data.custom.length;

  if (data.custom.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No sites added yet. The built-in list is still active.';
    list.appendChild(empty);
    return;
  }

  for (const entry of data.custom) {
    const row = document.createElement('div');
    row.className = 'domainrow';

    const name = document.createElement('span');
    name.textContent = entry.domain;

    const remove = document.createElement('button');
    remove.className = 'linkbtn';
    remove.textContent = 'Remove';
    remove.addEventListener('click', async () => {
      const result = await callGated(
        () => api.removeBlockedSite(entry.domain),
        'Enter the parent password to remove a blocked site.'
      );
      if (result && result.ok) {
        renderBlocklist();
        refreshStatus();
      }
    });

    row.append(name, remove);
    list.appendChild(row);
  }
}

/* ------------------------------------------------------------------ *
 * Hadith view
 * ------------------------------------------------------------------ */

async function renderHadith() {
  const { hadiths } = await api.listHadith();
  const container = $('hadith-list');
  container.textContent = '';

  for (const item of hadiths) {
    const card = document.createElement('div');
    card.className = 'hadithcard';

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = item.category;

    const text = document.createElement('p');
    text.className = 'text';
    text.textContent = item.text;

    const source = document.createElement('div');
    source.className = 'source';
    source.textContent = `${item.source} · ${item.grading}`;

    card.append(tag, text, source);
    container.appendChild(card);
  }
}

/* ------------------------------------------------------------------ *
 * Journal view
 * ------------------------------------------------------------------ */

$('journal-add').addEventListener('click', async () => {
  await api.addJournalEntry($('journal-note').value, Number($('journal-count').value));
  $('journal-note').value = '';
  renderJournal();
});

async function renderJournal() {
  const data = await api.listJournal();
  $('journal-total').textContent = data.totalIstighfar.toLocaleString();

  const list = $('journal-list');
  list.textContent = '';

  if (data.entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nothing logged yet.';
    list.appendChild(empty);
    return;
  }

  for (const entry of data.entries.slice(0, 50)) {
    const row = document.createElement('div');
    row.className = 'journalrow';

    const left = document.createElement('div');
    const when = document.createElement('div');
    when.className = 'when';
    when.textContent = new Date(entry.timestamp).toLocaleString();
    left.appendChild(when);

    if (entry.note) {
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = entry.note;
      left.appendChild(note);
    }

    const count = document.createElement('div');
    count.className = 'count';
    count.textContent = `${entry.istighfarCount}×`;

    row.append(left, count);
    list.appendChild(row);
  }
}

/* ------------------------------------------------------------------ *
 * Parent settings view
 * ------------------------------------------------------------------ */

async function renderSettings() {
  const status = await api.parentStatus();
  const unlocked = !status.serviceUnreachable && (status.configured ? status.unlocked : true);
  $('settings-locked').hidden = unlocked;
  $('settings-body').hidden = !unlocked;
  if (status.serviceUnreachable) {
    $('settings-locked').querySelector('p').textContent =
      'The protection service is not reachable. Reopen Noor Shield as Administrator.';
  }
}

$('settings-unlock').addEventListener('click', () => {
  showUnlock('Enter the parent password to change settings.', null);
});

$('reminder-save').addEventListener('click', async () => {
  const message = $('reminder-message');
  const result = await callGated(
    () => api.updateSettings({ reminderIntervalHours: Number($('reminder-hours').value) }),
    'Enter the parent password to change reminder settings.'
  );
  if (!result) return;

  message.textContent = result.ok ? 'Saved.' : result.error;
  message.className = result.ok ? 'success' : 'error';
});

$('pw-save').addEventListener('click', async () => {
  const message = $('pw-message');
  const result = await api.parentChangePassword($('pw-current').value, $('pw-new').value);
  message.textContent = result.ok ? 'Password changed.' : result.error;
  message.className = result.ok ? 'success' : 'error';
  if (result.ok) {
    $('pw-current').value = '';
    $('pw-new').value = '';
  }
});

$('remove-protection').addEventListener('click', async () => {
  const message = $('remove-message');
  const password = $('remove-password').value;

  if (!password) {
    message.textContent = 'Enter the parent password to confirm.';
    message.className = 'error';
    return;
  }

  $('remove-protection').disabled = true;
  message.textContent = 'Removing protection…';
  message.className = 'hint';

  const result = await api.removeProtection(password);

  $('remove-protection').disabled = false;
  message.textContent = result.ok
    ? 'Protection removed. The service has been uninstalled from this PC.'
    : result.error;
  message.className = result.ok ? 'success' : 'error';
  if (result.ok) $('remove-password').value = '';

  refreshStatus();
});

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

async function boot() {
  // On a fresh install the main process is installing/starting the
  // protection service concurrently with this page loading, so give it a
  // few seconds before deciding "unreachable" — otherwise a normal first
  // launch would flash the setup gate before settling on the real state.
  let status = await api.parentStatus();
  for (let attempt = 0; attempt < 6 && status.serviceUnreachable; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    status = await api.parentStatus();
  }

  if (status.serviceUnreachable) {
    // Let the dashboard's own warning banner explain it rather than asking
    // for a password the service isn't there to receive.
    $('shell').hidden = false;
  } else if (!status.configured) {
    // Nothing works until a parent password exists.
    $('setup-gate').hidden = false;
    $('setup-password').focus();
  } else {
    $('shell').hidden = false;
  }

  await renderHadith();
  await renderBlocklist();
  await renderJournal();
  await renderSettings();
  await refreshStatus();

  // Keep the dashboard live: counters move and the parent session expires.
  setInterval(() => {
    if (!$('shell').hidden) refreshStatus();
  }, 5000);
}

boot();
