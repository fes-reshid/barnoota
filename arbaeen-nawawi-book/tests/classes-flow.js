const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const stub = fs.readFileSync(__dirname + '/fakecloud.js', 'utf8');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 1300 }, acceptDownloads: true });
  await ctx.route('**/kids-quest-cloud.js*', r => r.fulfill({ contentType: 'application/javascript', body: stub }));
  const errs = [];
  const watch = (pg, tag) => { pg.on('pageerror', e => errs.push(tag + ': ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(tag + ': ' + m.text()); }); };
  const dbOf = pg => pg.evaluate(() => JSON.parse(localStorage.getItem('fc.db')));

  // ---------- teacher: sign in, create a class
  const T = await ctx.newPage(); watch(T, 'teacher');
  await T.goto(BASE + '/arbaeen-nawawi-admin/');
  await T.waitForSelector('#login:not(.hidden)');
  await T.fill('#lu', 'ahmed-teacher'); await T.fill('#lp', 'wrong');
  await T.click('#lgo'); await T.waitForTimeout(300);
  ok((await T.textContent('#lmsg')).includes('Wrong username'), 'wrong password is refused with a clear message');
  await T.fill('#lp', 'secret1'); await T.click('#lgo');
  await T.waitForSelector('#app:not(.hidden)');
  ok((await T.textContent('#view')).includes('Create your first class'), 'new teacher sees the empty state');
  const answers = ['Year 7 Forty Hadith', 'Ustadh Ahmed']; T.on('dialog', d => d.accept(answers.shift() ?? ''));
  await T.click('#newCls2'); await T.waitForSelector('.code');
  const code = (await T.textContent('.code')).trim();
  ok(/^[A-Z0-9]{6}$/.test(code), 'class created with a 6-character code: ' + code);
  ok((await T.textContent('#view')).includes('Ustadh Ahmed'), 'teacher name is shown');
  const wa = await T.getAttribute('#wa', 'href');
  ok(decodeURIComponent(wa).includes('/40hadith/?class=' + code), 'WhatsApp invite contains the invite link');

  // ---------- student: invite link -> create account -> join -> study -> test
  const S = await ctx.newPage(); watch(S, 'student');
  await S.goto(BASE + '/40hadith/?class=' + code);
  await S.waitForSelector('.ccard');
  ok(S.url().includes('/arbaeen-nawawi/?class=' + code), 'short address keeps the invite code: ' + S.url().replace(BASE, ''));
  ok((await S.textContent('.ccard')).includes('invited to a class'), 'student sees the invitation');
  await S.click('[data-a="m-up"]');
  await S.fill('[name=full]', 'Amina Yusuf'); await S.fill('[name=user]', 'amina7'); await S.fill('[name=pass]', 'secret1');
  await S.click('.cform button[type=submit]');
  await S.waitForSelector('[data-f="join"]');
  ok((await S.inputValue('[name=code]')) === code, 'class code from the invite is pre-filled');
  await S.click('.cjoin button[type=submit]');
  await S.waitForSelector('.csave');
  ok((await S.textContent('.ccard')).includes('Year 7 Forty Hadith') && (await S.textContent('.ccard')).includes('Ustadh Ahmed'), 'student is in the class and sees the teacher');
  await S.waitForFunction(() => document.querySelector('.csave.ok'));
  ok(true, 'progress saved to the class');
  // study Hadith 1
  await S.goto(BASE + '/arbaeen-nawawi/#h/1'); await S.waitForSelector('#studied'); await S.click('#studied');
  await S.waitForTimeout(1800);
  let db = await dbOf(S);
  const stu = Object.values(db.students).find(x => x.username === 'amina7');
  ok(JSON.stringify(stu.progress['arbaeen-nawawi'].studied) === '[1]', 'studied hadith reached the cloud: ' + JSON.stringify(stu.progress['arbaeen-nawawi'].studied));
  ok(!JSON.stringify(stu).includes('My notes'), 'private notes are not sent');
  // take test 1
  await S.goto(BASE + '/arbaeen-nawawi/#test/1'); await S.waitForSelector('#submit');
  await S.fill('#ttname', 'Ustadh Ahmed');
  await S.evaluate(() => {
    document.querySelectorAll('.mcq').forEach(q => q.querySelector('input').click());
    document.querySelectorAll('.mtable select').forEach(s => { s.value = '0'; s.dispatchEvent(new Event('change', { bubbles: true })); });
    document.querySelectorAll('.sa textarea').forEach((t, i) => { t.value = 'My answer ' + (i + 1); t.dispatchEvent(new Event('input', { bubbles: true })); });
  });
  await S.click('#submit'); await S.waitForSelector('.thead.res');
  ok(true, 'test submitted, result page shown');
  await S.waitForTimeout(1800);
  db = await dbOf(S);
  const pr = Object.values(db.students).find(x => x.username === 'amina7').progress['arbaeen-nawawi'];
  ok(pr.tests['1'] && pr.tests['1'].tries === 1, 'test score synced: best ' + (pr.tests['1'] && pr.tests['1'].best) + '/35');
  ok(pr.results['1'].short.length === 10 && pr.results['1'].crit.length === 5 && pr.results['1'].short[0] === 'My answer 1', 'written answers synced (10 short + 5 critical)');
  ok(Array.isArray(pr.results['1'].review), 'hadith-to-review list synced');
  ok(!('mcq' in pr.results['1']), 'chosen multiple-choice answers stay on the device');
  ok(!('notes' in pr) && !('answers' in pr) && !JSON.stringify(pr).includes('"mcq"'), 'nothing private is sent: no notes, no chosen answers');

  // ---------- teacher: sees the student, marks the test
  await T.bringToFront(); await T.click('#refresh'); await T.waitForTimeout(800);
  let view = await T.textContent('#view');
  ok(view.includes('Amina Yusuf') && view.includes('1/50'), 'teacher sees the student with 1/50 hadith');
  ok(view.includes('/35') && view.includes('to mark'), 'teacher sees the test score and "to mark"');
  await T.click('tr[data-uid]'); await T.waitForSelector('dialog[open]');
  const dlg = await T.textContent('#dlgB');
  ok(dlg.includes('My answer 1') && dlg.includes('Model answer'), 'teacher sees the written answers with model answers');
  await T.fill('.mc', '8'); await T.fill('.md', '4'); await T.fill('.mn', 'Good work, review Hadith 3.');
  await T.click('.marks .save'); await T.waitForSelector('.marks .msg.ok');
  db = await dbOf(T);
  const fb = Object.values(db.students).find(x => x.username === 'amina7').progress['arbaeen-nawawi-teacher'];
  ok(fb && fb.marks['1'].c === 8 && fb.marks['1'].d === 4 && fb.marks['1'].note.includes('Hadith 3'), 'marks saved for the student');
  await T.screenshot({ path: '/tmp/classes-teacher-dialog.png' });
  await T.click('#dlgX'); await T.waitForTimeout(300);
  ok((await T.textContent('#view')).includes('/35') && !(await T.textContent('#view')).includes('to mark'), '"to mark" disappears once marked');
  await T.screenshot({ path: '/tmp/classes-teacher.png', fullPage: true });

  // CSV
  const [dl] = await Promise.all([T.waitForEvent('download'), T.click('#csv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  ok(csv.charCodeAt(0) === 0xFEFF && csv.includes('"Amina Yusuf"') && csv.includes('part1_written_C_of_10') && csv.includes('"8"'), 'CSV export has the student and the marks (Excel-ready)');
  console.log(csv.split('\r\n').slice(0, 2).join('\n').slice(0, 400));

  // ---------- student sees the marks; progress survives a new device
  await S.bringToFront(); await S.goto(BASE + '/arbaeen-nawawi/'); await S.waitForSelector('.cfb');
  ok((await S.textContent('.cfb')).includes('C 8/10') && (await S.textContent('.cfb')).includes('Good work'), 'student sees the teacher marks and comment in the book');
  await S.screenshot({ path: '/tmp/classes-student-home.png', fullPage: false });
  const dev2 = await ctx.newPage(); watch(dev2, 'device2');
  await dev2.addInitScript(() => { /* second device: empty book storage, same cloud */ });
  await dev2.goto(BASE + '/arbaeen-nawawi/'); await dev2.evaluate(() => { localStorage.removeItem('arbaeen-nawawi.v1'); }); await dev2.reload();
  await dev2.waitForSelector('.ccard'); await dev2.waitForTimeout(800);
  ok((await dev2.textContent('.stats')).includes('1/50'), 'on a new device the studied hadith are restored from the cloud');

  // sign out / leave
  S.on('dialog', d => d.accept());
  await S.click('[data-a="leave"]'); await S.waitForSelector('[data-f="join"]');
  ok(true, 'student can leave the class');
  await S.click('[data-a="out"]'); await S.waitForSelector('[data-a="m-in"]');
  ok(true, 'student can sign out');

  // wrong class code
  await S.click('[data-a="m-in"]'); await S.fill('[name=user]', 'amina7'); await S.fill('[name=pass]', 'secret1'); await S.click('.cform button[type=submit]');
  await S.waitForSelector('[data-f="join"]'); await S.fill('[name=code]', 'ZZZZZZ'); await S.click('.cjoin button[type=submit]');
  await S.waitForSelector('.cmsg.error');
  ok((await S.textContent('.cmsg')).includes('No class has that code'), 'a wrong class code gives a clear message');

  // teacher awaiting approval
  const W = await ctx.newPage(); watch(W, 'pending');
  await W.evaluate(() => 0).catch(() => {});
  await T.evaluate(() => localStorage.setItem('fc.auth.staff', 'pending@x.test'));
  await T.reload(); await T.waitForSelector('#wait:not(.hidden)');
  ok(true, 'unapproved teacher account sees the "awaiting approval" page');

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(fails ? ('\n' + fails + ' FAILED') : '\nALL PASSED');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
