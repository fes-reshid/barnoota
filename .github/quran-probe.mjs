// Temporary check (removed after one run): matches every Qur'an quotation in Seeraa
// against Quran.com's words and timings, using seeraa/seeraa-quran.js itself.
import fs from 'node:fs'; import vm from 'node:vm';
const S = 'seeraa/';
const ctx = { console, fetch: globalThis.fetch, AbortController, setTimeout, clearTimeout, btoa, URL };
ctx.window = ctx;
ctx.document = { head: { insertAdjacentHTML() {} }, body: {}, addEventListener() {}, querySelectorAll() { return []; } };
ctx.MutationObserver = class { observe() {} }; ctx.addEventListener = () => {}; ctx.Audio = class {};
const mem = {}; ctx.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
vm.createContext(ctx);
for (const f of ['course-data.js', 'seeraa-enrichment-data.js']) vm.runInContext(fs.readFileSync(S + f, 'utf8'), ctx);
vm.runInContext(fs.readFileSync(S + 'seeraa-quran.js', 'utf8'), ctx);
const Q = ctx.SeeraaQuran, items = [];
for (const m of ctx.SEERAA_COURSE) for (const l of m.lessons) {
  const v = l.learn && l.learn.verse; if (v && v.kind === 'quran') items.push(['learn', v.ref, v.ar]);
  for (const q of l.quotes || []) if (/^\s*(s[uū]ra|qur)/i.test(q.ref)) items.push(['quote', q.ref, q.ar]);
}
for (const e of Object.values(ctx.SEERAA_ENRICHMENT.evidence)) if (/^qur/i.test(e.kind)) items.push(['card', e.ref, e.ar]);
vm.runInContext('var __D=' + fs.readFileSync(S + 'seeraa-activities.js', 'utf8').match(/const SEERAA_DUAS=(\[[\s\S]*?\]);/)[1], ctx);
ctx.__D.forEach(d => items.push(['dua', d.ref, d.ar]));
for (const m of fs.readFileSync(S + 'seeraa-event-scenes.js', 'utf8').matchAll(/who:'([^']*\d+:\d+[^']*)',k:'quran',ar:'([^']+)'/g)) items.push(['bubble', m[1], m[2]]);
const seen = new Set(); let ok = 0, bad = 0;
for (const [kind, ref, ar] of items) {
  const id = ref + '|' + ar; if (seen.has(id)) continue; seen.add(id);
  const keys = Q.parseRef(ref); if (!keys) { console.log('NOREF  ', kind, ref); bad++; continue; }
  let data; try { data = await Promise.all(keys.map(k => Q.verse(k))); } catch (e) { console.log('FETCH  ', kind, ref, e.message); bad++; continue; }
  if (data.some(d => !d.seg.length || !d.words)) { console.log('NOSEG  ', kind, ref); bad++; continue; }
  const W = []; data.forEach((d, vi) => d.words.forEach(([pos, t]) => Q.words(t).forEach(x => W.push({ vi, pos, t: x }))));
  const q = Q.words(ar), m = Q.align(q, W);
  if (!m) { console.log('NOALIGN', kind, ref, '| quote:', q.join(' '), '| api:', W.map(w => w.t).join(' ')); bad++; continue; }
  const span = W.slice(m.start, m.end + 1).map(w => w.t), same = span.join(' ') === q.join(' ');
  const parts = await Q.plan(keys, ar);
  console.log(same ? 'OK     ' : 'DIFF   ', kind, ref, '| quote:', q.join(' '), same ? '' : '| api: ' + span.join(' '), '|', parts.map(p => p.key + '@' + p.from + '-' + (p.to || 'end')).join(' '));
  same ? ok++ : bad++;
  await new Promise(r => setTimeout(r, 120));
}
console.log('SUMMARY ok', ok, 'other', bad, 'of', seen.size, '| first url', JSON.parse(Object.values(mem)[0] || '{}').url);
