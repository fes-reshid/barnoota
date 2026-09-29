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
function hgMusicScore(ch, sr, a, b) {
  try {
    if ((b - a) / sr < 4) return { score: 0 }; // too short for the beat detector to be reliable — fail open
    const env = onsetEnvelope(ch, sr, a, b), fr = sr / BEAT_H, t = tempoFromEnvelope(env, fr);
    return { score: clamp((t.strength - HG_CUTOFF) / 4, 0, 1), beatBpm: Math.round(t.bpm), strength: t.strength };
  } catch (e) { console.warn('halal-guard: scoring failed, allowing', e); return { score: 0 }; }
}
const HG_CUTOFF = 8, HG_THRESHOLD = 0.01; // i.e. flag once strength clearly passes HG_CUTOFF

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
  const info = hgMusicScore(ch, sr, 0, ch[0].length);
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
    return baseEncode(ch, sr, onProgress);
  };
}
