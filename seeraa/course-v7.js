/* Seeraa course version 7: 45 maps (version 6 had 31).
   Maps 1–24 and their 96 lessons did not move. The lessons of the old Maps 25–31 moved into
   the new Madīnah Maps 25–45, between the new lessons. These helpers move anything saved with
   the old numbering to the new places: a student's progress, teachers' edits and teachers'
   quizzes. Used by the student course (seeraa/) and the teacher portal (seeraa-admin/). */
(function () {
  'use strict';
  /* the moment course version 7 went live: quizzes last saved before it still use old map numbers */
  const SINCE = '2026-10-15T14:40:00.000Z';
  /* old lesson index (0-based) → new lesson index, for the lessons that moved */
  const LESSON = {96:100,97:104,98:102,99:106,100:114,101:116,102:119,103:120,104:124,105:125,106:126,107:128,108:136,109:137,110:138,111:139,112:142,113:143,114:144,115:151,116:153,117:159,118:160,119:164,120:168,121:172,122:177,123:179};
  /* old map index (0-based) → the new map that holds most of its lessons */
  const MAP = {24:26, 25:29, 26:31, 27:34, 28:36, 29:39, 30:44};
  const lesson = i => (i in LESSON ? LESSON[i] : i), map = i => (i in MAP ? MAP[i] : i);
  const course = () => window.SEERAA_COURSE || [];
  const counts = () => ({ lessons: course().reduce((n, m) => n + m.lessons.length, 0) || 180, maps: course().length || 45 });

  function list(a, move, len, fill) {
    if (!Array.isArray(a)) return a;
    const out = Array(Math.max(len, a.length)).fill(fill);
    a.forEach((v, i) => { const j = move(i); if (v != null && j < out.length) out[j] = v; });
    return out.slice(0, len);
  }
  function keyed(o, move) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return o;
    const out = {};
    Object.keys(o).forEach(k => { const n = Number(k); out[Number.isInteger(n) && String(n) === k ? move(n) : k] = o[k]; });
    return out;
  }
  /* a progress record saved with course version 6 → version 7 (changed in place and returned) */
  function profile(p) {
    if (!p || typeof p !== 'object' || Number(p.courseVersion) !== 6) return p;
    const { lessons, maps } = counts();
    p.stars = list(p.stars, lesson, lessons, 0);
    p.memoryDone = list(p.memoryDone, lesson, lessons, false);
    ['vocabDone', 'flashPracticeDone', 'teacherMapUnlocks'].forEach(k => { p[k] = list(p[k], map, maps, false); });
    ['teacherAssessments', 'mapQuizScores'].forEach(k => { p[k] = list(p[k], map, maps, null); });
    ['stepDone', 'lessonQuizAttempts', 'hifz'].forEach(k => { p[k] = keyed(p[k], lesson); });
    const open = Math.max(1, Number(p.unlocked) || 1);
    p.unlocked = Math.min(lessons, lesson(open - 1) + 1);
    p.courseVersion = 7;
    return p;
  }
  /* where teachers' edits are saved: lessons after 96 and maps after 24 use new keys */
  const lessonKey = (game, number) => game + (number > 96 ? '_lesson7_' : '_lesson_') + number;
  const mapKey = (game, i) => game + (i >= 24 ? '_map7_' : '_map_') + i;
  const evidenceKey = (game, i) => game + (i >= 24 ? '_map7_evidence_' : '_map_evidence_') + i;
  /* teachers' edits saved under the old numbers are shown at the new places (nothing is rewritten) */
  function edits(all, game) {
    game = game || 'seeraa';
    const copy = (from, to) => { if (all[from] && !all[to]) all[to] = Object.assign({}, all[from], { id: to }); };
    Object.keys(LESSON).forEach(o => copy(game + '_lesson_' + (+o + 1), lessonKey(game, LESSON[o] + 1)));
    Object.keys(MAP).forEach(o => { copy(game + '_map_' + o, mapKey(game, MAP[o])); copy(game + '_map_evidence_' + o, evidenceKey(game, MAP[o])); });
    return all;
  }
  /* a teacher quiz for one map, saved before version 7, moves with its map */
  function quiz(q) {
    if (q && q.game === 'seeraa' && Number.isInteger(q.map) && q.map in MAP && String(q.updatedAt || q.createdAt || '') < SINCE) q.map = MAP[q.map];
    return q;
  }
  window.SeeraaCourseV7 = { lesson, map, profile, edits, quiz, lessonKey, mapKey, evidenceKey };
})();
