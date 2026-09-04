'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { powershell } = require(path.join(__dirname, '..', 'src', 'main', 'systemDns'));

/**
 * A local certificate authority so blocked HTTPS sites can show our own
 * reminder page instead of a certificate warning or a broken connection.
 *
 * How it works: a self-signed root CA is created once and installed into
 * Windows' Trusted Root store (LocalMachine\Root) — the same trust anchor
 * browsers and the OS check. From then on, whenever the reminder server
 * (reminderServer.js) needs to answer a TLS connection for some blocked
 * hostname, it asks this module for a leaf certificate for that exact
 * hostname, signed by our CA; the browser sees a normal-looking, trusted
 * certificate for the site it asked for, no warning.
 *
 * This deliberately never touches traffic for anything OTHER than domains
 * already decided to be blocked (see dnsProxy.js: only blocked A-record
 * queries resolve to 127.0.0.1 at all) — it has no ability to intercept or
 * decrypt real traffic to sites that aren't blocked, because DNS never sends
 * their connections here in the first place.
 *
 * All of this goes through PowerShell/Windows' own certificate store APIs
 * (New-SelfSignedCertificate, Export-PfxCertificate, etc.) rather than doing
 * our own X.509 encoding in JS — the same "shell out to PowerShell for
 * Windows-native PKI/networking APIs" pattern systemDns.js already uses, and
 * far less likely to produce a certificate some browser quietly rejects.
 */

const CA_SUBJECT = 'CN=Noor Shield Local Filter CA';
const CA_META_FILENAME = 'ca-meta.json';
const LEAF_CACHE_DIRNAME = 'leaf-certs';
const LEAF_PASSPHRASE_FILENAME = 'leaf-passphrase.txt';

// Hostnames only ever reach these functions after DomainBlocklist has
// already matched them, and are re-validated here regardless — SNI values
// come off the wire from whatever connected, and get interpolated directly
// into a PowerShell command string below. Anything that fails this check is
// replaced with a fixed placeholder instead of ever reaching PowerShell.
const SAFE_HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;
const PLACEHOLDER_HOSTNAME = 'blocked.noorshield.local';

function sanitizeHostname(hostname) {
  const lower = String(hostname || '').toLowerCase();
  return SAFE_HOSTNAME_RE.test(lower) ? lower : PLACEHOLDER_HOSTNAME;
}

function metaPath(dataDir) {
  return path.join(dataDir, CA_META_FILENAME);
}

function leafCacheDir(dataDir) {
  return path.join(dataDir, LEAF_CACHE_DIRNAME);
}

function passphrasePath(dataDir) {
  return path.join(dataDir, LEAF_PASSPHRASE_FILENAME);
}

function readMeta(dataDir) {
  try {
    return JSON.parse(fs.readFileSync(metaPath(dataDir), 'utf8'));
  } catch (_) {
    return null;
  }
}

function writeMeta(dataDir, meta) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = `${metaPath(dataDir)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(meta, null, 2), 'utf8');
  fs.renameSync(tmp, metaPath(dataDir));
}

/**
 * A random passphrase for the leaf .pfx cache files. Not a meaningful secret
 * — these are self-signed certs for domains we're already blocking, not
 * protecting anything — it exists only because Export-PfxCertificate
 * requires one. Generated once and reused so every cached leaf cert can be
 * decrypted the same way.
 */
function getOrCreatePassphrase(dataDir) {
  try {
    const existing = fs.readFileSync(passphrasePath(dataDir), 'utf8').trim();
    if (existing) return existing;
  } catch (_) {
    /* fall through to generate */
  }
  const value = crypto.randomBytes(24).toString('hex');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(passphrasePath(dataDir), value, 'utf8');
  return value;
}

function leafCachePath(dataDir, hostname) {
  const safe = hostname.replace(/[^a-z0-9.-]/g, '_');
  return path.join(leafCacheDir(dataDir), `${safe}.pfx`);
}

/**
 * Ensures a local root CA exists and is trusted. Idempotent: if the cached
 * thumbprint is still present in both the personal and trusted-root stores,
 * does nothing — a normal service restart shouldn't mint a new CA (which
 * would silently untrust every previously-cached leaf certificate).
 */
async function ensureCaInstalled(dataDir) {
  if (process.platform !== 'win32') {
    throw new Error('The local certificate authority only runs on Windows.');
  }

  const meta = readMeta(dataDir);
  if (meta && meta.thumbprint) {
    const check = await powershell(
      `if ((Test-Path 'Cert:\\LocalMachine\\My\\${meta.thumbprint}') -and ` +
        `(Test-Path 'Cert:\\LocalMachine\\Root\\${meta.thumbprint}')) { 'yes' } else { 'no' }`
    ).catch(() => 'no');
    if (check.trim() === 'yes') return meta;
  }

  fs.mkdirSync(dataDir, { recursive: true });
  const caCerPath = path.join(dataDir, 'ca.cer');
  const script =
    `$ca = New-SelfSignedCertificate -Type Custom -Subject '${CA_SUBJECT}' ` +
    "-KeyUsage CertSign,CRLSign,DigitalSignature -KeyAlgorithm RSA -KeyLength 2048 " +
    "-KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(10) " +
    "-CertStoreLocation 'Cert:\\LocalMachine\\My' " +
    "-TextExtension @('2.5.29.19={critical}{text}ca=true'); " +
    `Export-Certificate -Cert $ca -FilePath '${caCerPath}' | Out-Null; ` +
    `Import-Certificate -FilePath '${caCerPath}' -CertStoreLocation 'Cert:\\LocalMachine\\Root' | Out-Null; ` +
    '$ca.Thumbprint';

  const thumbprint = (await powershell(script, { timeoutMs: 30000 })).trim();
  if (!thumbprint) throw new Error('Could not create the local certificate authority.');

  const newMeta = { thumbprint, createdAt: Date.now(), subject: CA_SUBJECT };
  writeMeta(dataDir, newMeta);
  return newMeta;
}

/**
 * Removes the CA from both Windows certificate stores. Best-effort: called
 * during "Remove protection completely" and uninstall, where a partial
 * failure shouldn't block the rest of teardown.
 */
async function removeCa(dataDir) {
  const meta = readMeta(dataDir);
  if (!meta || !meta.thumbprint) return;
  try {
    await powershell(
      `Remove-Item 'Cert:\\LocalMachine\\Root\\${meta.thumbprint}' -ErrorAction SilentlyContinue; ` +
        `Remove-Item 'Cert:\\LocalMachine\\My\\${meta.thumbprint}' -DeleteKey -ErrorAction SilentlyContinue`
    );
  } catch (err) {
    console.error(`[certAuthority] could not remove local CA: ${err.message}`);
  }
  try {
    fs.rmSync(metaPath(dataDir), { force: true });
  } catch (_) {
    /* not critical */
  }
}

/**
 * Returns { pfx, passphrase } for a hostname's leaf certificate, generating
 * and caching one (signed by our CA) on first use. Concurrent requests for
 * the same never-before-seen hostname share one in-flight generation rather
 * than racing to spawn PowerShell twice.
 */
const inFlight = new Map();

async function getLeafPfx(dataDir, caThumbprint, rawHostname) {
  const hostname = sanitizeHostname(rawHostname);
  const cachePath = leafCachePath(dataDir, hostname);
  const passphrase = getOrCreatePassphrase(dataDir);

  try {
    const pfx = fs.readFileSync(cachePath);
    return { pfx, passphrase, hostname };
  } catch (_) {
    /* not cached yet — generate below */
  }

  if (inFlight.has(hostname)) {
    await inFlight.get(hostname);
    const pfx = fs.readFileSync(cachePath);
    return { pfx, passphrase, hostname };
  }

  const generate = (async () => {
    fs.mkdirSync(leafCacheDir(dataDir), { recursive: true });
    const script =
      `$signer = Get-Item 'Cert:\\LocalMachine\\My\\${caThumbprint}'; ` +
      `$leaf = New-SelfSignedCertificate -DnsName '${hostname}' -Signer $signer ` +
      "-CertStoreLocation 'Cert:\\LocalMachine\\My' -KeyExportPolicy Exportable " +
      "-NotAfter (Get-Date).AddYears(2); " +
      `$pwd = ConvertTo-SecureString -String '${passphrase}' -Force -AsPlainText; ` +
      `Export-PfxCertificate -Cert "Cert:\\LocalMachine\\My\\$($leaf.Thumbprint)" ` +
      `-FilePath '${cachePath}' -Password $pwd | Out-Null; ` +
      `Remove-Item "Cert:\\LocalMachine\\My\\$($leaf.Thumbprint)" -DeleteKey`;
    await powershell(script, { timeoutMs: 20000 });
  })();
  inFlight.set(hostname, generate);
  try {
    await generate;
  } finally {
    inFlight.delete(hostname);
  }

  const pfx = fs.readFileSync(cachePath);
  return { pfx, passphrase, hostname };
}

module.exports = {
  ensureCaInstalled,
  removeCa,
  getLeafPfx,
  sanitizeHostname,
  PLACEHOLDER_HOSTNAME,
};
