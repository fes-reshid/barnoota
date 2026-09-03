'use strict';

const { execFile } = require('child_process');

/**
 * Points Windows' DNS at our local resolver and puts it back afterwards.
 *
 * Everything here goes through PowerShell with `ConvertTo-Json` rather than
 * parsing `netsh` output: netsh prints localised column headers, so text
 * parsing breaks the moment someone runs a non-English Windows install.
 */

const PS_ARGS = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command'];

function powershell(command, { timeoutMs = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      [...PS_ARGS, command],
      { timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          err.message = `${err.message}\n${String(stderr || '').trim()}`;
          reject(err);
          return;
        }
        resolve(String(stdout || '').trim());
      }
    );
  });
}

/** PowerShell's ConvertTo-Json emits a bare object for one item and an array for many. */
function asArray(json) {
  if (!json) return [];
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (parsed === null || parsed === undefined) return [];
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function isElevated() {
  if (process.platform !== 'win32') return false;
  try {
    const out = await powershell(
      '([Security.Principal.WindowsPrincipal]' +
        '[Security.Principal.WindowsIdentity]::GetCurrent()' +
        ').IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)'
    );
    return out.toLowerCase() === 'true';
  } catch (err) {
    return false;
  }
}

/**
 * Connected IPv4 adapters and the DNS servers they currently use. We record
 * these before touching anything so restore() can put back exactly what was
 * there, rather than blanket-resetting everyone to DHCP.
 */
async function readCurrentConfig() {
  const out = await powershell(
    'Get-NetIPConfiguration | Where-Object { $_.NetAdapter.Status -eq "Up" } | ' +
      'ForEach-Object { [pscustomobject]@{ ' +
      'InterfaceIndex = $_.InterfaceIndex; ' +
      'InterfaceAlias = $_.InterfaceAlias; ' +
      'ServerAddresses = @($_.DNSServer | ' +
      'Where-Object { $_.AddressFamily -eq 2 } | ' +
      'Select-Object -ExpandProperty ServerAddresses) } } | ConvertTo-Json -Depth 4'
  );
  return asArray(out).map((entry) => ({
    interfaceIndex: entry.InterfaceIndex,
    interfaceAlias: entry.InterfaceAlias,
    serverAddresses: Array.isArray(entry.ServerAddresses)
      ? entry.ServerAddresses
      : entry.ServerAddresses
        ? [entry.ServerAddresses]
        : [],
  }));
}

/**
 * Points every connected adapter at 127.0.0.1.
 *
 * Only our resolver is set — deliberately no public fallback server. Windows
 * will happily use a secondary server when the primary doesn't answer, which
 * would quietly route around the filter exactly when it matters. The trade-off
 * is that if this app dies while DNS is redirected, name resolution stops
 * until it's restored; see restore(), the tray "Repair DNS" action, and the
 * manual command in the README.
 *
 * Returns the previous configuration so the caller can persist it.
 */
async function apply() {
  const previous = await readCurrentConfig();
  for (const adapter of previous) {
    await powershell(
      `Set-DnsClientServerAddress -InterfaceIndex ${Number(adapter.interfaceIndex)} ` +
        '-ServerAddresses 127.0.0.1'
    );
  }
  await flushCache();
  return previous;
}

/**
 * Restores DNS. Uses the saved per-adapter servers when we have them; falls
 * back to clearing the static entry (back to DHCP) for anything unknown, which
 * is the safe answer for a machine that would otherwise have no resolver.
 */
async function restore(previous) {
  const adapters = Array.isArray(previous) && previous.length > 0 ? previous : await readCurrentConfig();

  for (const adapter of adapters) {
    const index = Number(adapter.interfaceIndex);
    const saved = (adapter.serverAddresses || []).filter((addr) => addr && addr !== '127.0.0.1');

    if (saved.length > 0) {
      const list = saved.map((addr) => `"${addr}"`).join(',');
      await powershell(`Set-DnsClientServerAddress -InterfaceIndex ${index} -ServerAddresses ${list}`);
    } else {
      await powershell(`Set-DnsClientServerAddress -InterfaceIndex ${index} -ResetServerAddresses`);
    }
  }
  await flushCache();
}

async function flushCache() {
  try {
    await powershell('Clear-DnsClientCache');
  } catch (err) {
    // Non-fatal: stale cached answers just mean a blocked site may resolve
    // until its TTL expires.
    console.warn(`[systemDns] could not flush DNS cache: ${err.message}`);
  }
}

/** True when at least one connected adapter is currently pointed at our resolver. */
async function isRedirected() {
  const config = await readCurrentConfig();
  return config.some((adapter) => (adapter.serverAddresses || []).includes('127.0.0.1'));
}

module.exports = {
  isElevated,
  readCurrentConfig,
  apply,
  restore,
  flushCache,
  isRedirected,
};
