// Audio editor — a best-effort check, run right before anything is saved or exported, for audio
// that has a steady, mechanical beat — the kind a drum machine, a full backing track or most
// produced music has, and that recorded human speech essentially never does by accident.
// This tool is for halal use only (see the reminder shown when the editor is first opened).
//
// Honesty about its limits, for whoever reads this: there is no reliable way to tell "music" from
// "not music" by analysing a waveform, and this file went through several designs before landing
// here. An earlier version also tried to score chords (several notes at once) using the pitch-class
// energy the key-detector already computes, on the idea that beat + chords together would be a much
// more specific signal than either alone. Testing it against made-up audio showed it doesn't hold up:
// a single instrument note's own harmonics can span several pitch classes just as a real chord does,
// and a quieter chord under a louder voice reliably scored as no chord at all. Both failure modes are
// exactly backwards from what the check exists for, so that signal was dropped rather than shipped
// half-working. What's left is only the beat check, which held up far better in the same testing —
// but it is still one signal, on made-up audio, not a trained or validated classifier: it will not
// catch music with no steady beat (a cappella singing, rubato), and a steady hand-drum/daf rhythm
// with no melody at all — which some scholars permit — will still be flagged, since this check has
// no way to tell that apart from an actual drum machine. It can also be wrong about audio that isn't
// music at all. This is a deterrent and a reminder, not a scholarly ruling and not a guarantee — a
// person's own judgement of what they are recording is never replaced by it.
'use strict';

const HG_STRIKES_KEY = 'ae-hg-strikes', HG_BLOCKED_KEY = 'ae-hg-blocked', HG_LIMIT = 3;
function hgBlocked() { try { return localStorage.getItem(HG_BLOCKED_KEY) === 'yes'; } catch (e) { return false; } }
function hgShowBlocked() {
  const dlg = document.getElementById('toolBlockedGate');
  if (!dlg || dlg.open || typeof dlg.showModal !== 'function') return;
  dlg.addEventListener('cancel', e => e.preventDefault());
  dlg.showModal();
}
if (hgBlocked()) hgShowBlocked();

// ---------- Best-effort "does this have a steady, mechanical beat?" score, 0 (no) – 1 (probably) ----------
// Reuses the beat-detector's own onsetEnvelope/tempoFromEnvelope (editor-tools.js): its "strength"
// is how much better a single, fixed tempo explains the note onsets than chance would. The editor's
// own Beat Detector calls anything past 2.2 "a clear, steady beat"; this is deliberately far more
// conservative than that (past ~8, on the same scale) — real recorded speech and recitation, even
// with a strong melodic or repetitive quality, measured well under that in testing; produced music
// with any kind of drum or rhythm track measured far past it.
async function hgMusicScore(ch, sr, a, b) {
  try {
    if ((b - a) / sr < 4) return { score: 0 }; // too short for the beat detector to be reliable — fail open
    const env = await hgOnsetEnvelope(ch, sr, a, b), fr = sr / BEAT_H, t = await hgTempoFromEnvelope(env, fr);
    return { score: clamp((t.strength - HG_CUTOFF) / 4, 0, 1), beatBpm: Math.round(t.bpm), strength: t.strength };
  } catch (e) { console.warn('halal-guard: scoring failed, allowing', e); return { score: 0 }; }
}
const HG_CUTOFF = 8, HG_THRESHOLD = 0.01; // i.e. flag once strength clearly passes HG_CUTOFF

// Same complete-file analysis, scheduled in small chunks so long recordings do not freeze the page.
async function hgOnsetEnvelope(ch, sr, a, b) {
  const n = b - a, frames = Math.max(0, Math.floor((n - BEAT_N) / BEAT_H));
  const win = new Float64Array(BEAT_N); for (let i = 0; i < BEAT_N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / BEAT_N);
  const re = new Float64Array(BEAT_N), im = new Float64Array(BEAT_N), prev = new Float64Array(BEAT_N / 2), env = new Float64Array(frames);
  let lastYield=performance.now();
  for (let f = 0; f < frames; f++) {
    if (f % 8 === 0 && performance.now()-lastYield > 16) {
      busyText('Checking audio… '+Math.round(f/frames*100)+'%');
      await new Promise(resolve=>setTimeout(resolve,0));lastYield=performance.now();
    }
    const st = a + f * BEAT_H;
    for (let i = 0; i < BEAT_N; i++) { let v = 0; for (const c of ch) v += c[st + i]; re[i] = v * win[i]; im[i] = 0; }
    fft(re, im, false);
    let flux = 0;
    for (let k = 1; k < BEAT_N / 2; k++) { const m = Math.log1p(100 * Math.hypot(re[k], im[k])); if (f) flux += Math.max(0, m - prev[k]); prev[k] = m; }
    env[f] = flux;
  }
  // Remove the slowly varying loudness so only the "hits" remain.
  const w = Math.round(sr / BEAT_H * 0.4), pre = new Float64Array(frames + 1);
  for (let i = 0; i < frames; i++) pre[i + 1] = pre[i] + env[i];
  const out = new Float64Array(frames);
  for (let i = 0; i < frames; i++) { const x0 = Math.max(0, i - w), x1 = Math.min(frames, i + w + 1); out[i] = Math.max(0, env[i] - (pre[x1] - pre[x0]) / (x1 - x0)); }
  // Compress: a soft kick and a loud snare should count almost equally, otherwise the loud
  // hit on every other beat makes the tempo come out at half speed.
  let mx=0; for(const value of out) if(value>mx) mx=value; mx=mx||1;
  for (let i = 0; i < frames; i++) out[i] = Math.sqrt(out[i] / mx);
  return out;
}
async function hgTempoFromEnvelope(env, fr) {
  const ac = L => { let s = 0; for (let i = 0; i + L < env.length; i++) s += env[i] * env[i + L]; return s / (env.length - L); };
  const lo = Math.floor(fr * 60 / 220), hi = Math.ceil(fr * 60 / 50);
  const vals = []; for (let L = lo; L <= hi + 1; L++) vals[L] = ac(L); await new Promise(resolve=>setTimeout(resolve,0));
  let best = lo, bestScore = -Infinity;
  for (let L = lo; L <= hi; L++) {
    const bpm = 60 * fr / L, wgt = Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.7) ** 2); // prefer 80–180 BPM
    const sc = vals[L] * wgt; if (sc > bestScore) { bestScore = sc; best = L; }
  }
  const y0 = vals[best - 1] ?? vals[best], y1 = vals[best], y2 = vals[best + 1] ?? vals[best];
  const d = (y0 - 2 * y1 + y2) ? clamp((y0 - y2) / (2 * (y0 - 2 * y1 + y2)), -0.5, 0.5) : 0;
  const mean = vals.slice(lo, hi + 1).reduce((t, v) => t + v, 0) / (hi - lo + 1);
  return { bpm: 60 * fr / (best + d), strength: y1 / (mean || 1) };
}

// ---------- The warning dialog: explain, then either cancel or type a confirmation to continue ----------
const hgDlg = document.createElement('dialog');
hgDlg.className = 'dlg eq'; hgDlg.id = 'hgWarnGate';
hgDlg.innerHTML = `<div class="eq-top"><h2>This sounds like it may be music</h2></div>
  <p class="info" id="hgWarnWhy" style="margin:0 0 10px"></p>
  <p>This tool doesn't save or export music. If this is not music — for example spoken word, adhan, or Qur'an recitation — you can continue, but please check again first. This is an automatic guess and it can be wrong.</p>
  <p style="margin-bottom:6px">Type <strong>THIS IS NOT MUSIC</strong> below to confirm and continue:</p>
  <input type="text" id="hgWarnConfirm" class="num" style="width:100%; margin-bottom:4px" autocomplete="off" spellcheck="false">
  <p class="info" id="hgWarnStrikes" style="margin:6px 0 0"></p>
  <div class="actions"><span style="flex:1"></span>
    <button class="btn" id="hgWarnCancel" type="button">Cancel — Don't Save This</button>
    <button class="btn primary" id="hgWarnContinue" type="button" disabled>Continue Anyway</button>
  </div>`;
document.body.appendChild(hgDlg);
$('hgWarnConfirm').addEventListener('input', e => { $('hgWarnContinue').disabled = e.target.value.trim().toUpperCase() !== 'THIS IS NOT MUSIC'; });
hgDlg.addEventListener('cancel', e => e.preventDefault());

function hgStrikes() { try { return +localStorage.getItem(HG_STRIKES_KEY) || 0; } catch (e) { return 0; } }
// Resolves true to let the save through, false to stop it (the caller — encode(), below — throws either way it's needed).
function hgAsk(info) {
  return new Promise(resolve => {
    $('hgWarnWhy').textContent = `Found: a steady, mechanical beat${info.beatBpm ? ` (about ${info.beatBpm} BPM)` : ''}.`;
    const left = HG_LIMIT - hgStrikes();
    $('hgWarnStrikes').textContent = `If you continue and this keeps happening, this tool will block itself on this device (${left} warning${left === 1 ? '' : 's'} left).`;
    $('hgWarnConfirm').value = ''; $('hgWarnContinue').disabled = true;
    const done = ok => { hgDlg.close(); $('hgWarnCancel').onclick = null; $('hgWarnContinue').onclick = null; resolve(ok); };
    $('hgWarnCancel').onclick = () => done(false);
    $('hgWarnContinue').onclick = () => {
      if ($('hgWarnConfirm').value.trim().toUpperCase() !== 'THIS IS NOT MUSIC') return;
      let strikes = hgStrikes() + 1;
      try { localStorage.setItem(HG_STRIKES_KEY, String(strikes)); } catch (e) {}
      if (strikes >= HG_LIMIT) {
        try { localStorage.setItem(HG_BLOCKED_KEY, 'yes'); } catch (e) {}
        done(false); // this save is also refused — the warning said it would be
        hgShowBlocked();
      } else {
        toast(`Warning ${strikes} of ${HG_LIMIT} for possible music`);
        done(true);
      }
    };
    hgDlg.showModal(); $('hgWarnConfirm').focus();
  });
}
async function hgGuard(ch, sr) {
  if (hgBlocked()) throw new Error('This tool is blocked on this device.');
  const info = await hgMusicScore(ch, sr, 0, ch[0].length);
  if (info.score < HG_THRESHOLD) return;
  const ok = await hgAsk(info);
  if (!ok) throw new Error(hgBlocked() ? 'This tool is now blocked on this device — nothing was saved.' : 'Not saved — it looked like it might be music.');
}
// One choke point for every save/export path (Save, Save Selection, Save All Parts, ringtones,
// share, batch convert, multitrack mix) — they all produce their bytes through this function.
{
  const baseEncode = encode;
  encode = async function (ch, sr, onProgress) {
    await hgGuard(ch, sr);
    busyText('Encoding…');
    return baseEncode(ch, sr, onProgress);
  };
}
