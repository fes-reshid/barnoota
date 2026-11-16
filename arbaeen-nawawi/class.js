/* The Forty Hadith online book: "My class" (student side).
 *
 * Optional. The book works fully without an account. A student who signs in (the same
 * Diin Islaam / Kids Quest login used in the quest games) and joins their teacher's class
 * with a 6-letter code lets the teacher see their progress, test scores and written answers
 * on the teacher page (/arbaeen-nawawi-admin/).
 *
 * What is sent to the cloud (progress.arbaeen-nawawi on the student's own record):
 *   hadith studied, to-do ticks per hadith, test scores, the hadith to review after each test,
 *   the written answers of each test, the name and the teacher's name.
 * What stays on the device: "My Notes" and the chosen answers of the marked questions.
 * The teacher's marks come back in progress.arbaeen-nawawi-teacher.
 */
(function () {
  "use strict";
  var KEY = "arbaeen-nawawi", FB_KEY = "arbaeen-nawawi-teacher";
  var AN = window.AN, KC = null, user = null, myClass = null, feedback = null;
  var busy = false, msg = "", msgKind = "", mode = "", saved = "", lastJson = "", timer = null, mountEl = null, offline = false;
  var invite = "";
  try { invite = (new URLSearchParams(location.search).get("class") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); } catch (e) {}
  if (invite) { try { sessionStorage.setItem("an.invite", invite); } catch (e) {} }
  else { try { invite = sessionStorage.getItem("an.invite") || ""; } catch (e) {} }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }

  /* ---------- what is sent to the cloud ---------- */
  function profile() {
    var S = AN.get(), studied = [], todo = {}, tests = {}, results = {}, k;
    Object.keys(S.studied || {}).forEach(function (n) { if (S.studied[n]) studied.push(+n); });
    studied.sort(function (a, b) { return a - b; });
    Object.keys(S.todo || {}).forEach(function (n) { var c = (S.todo[n] || []).filter(Boolean).length; if (c) todo[n] = c; });
    for (k in (S.tests || {})) tests[k] = { best: S.tests[k].best, last: S.tests[k].last, tries: S.tests[k].tries || 1 };
    for (k in (S.results || {})) {
      var r = S.results[k];
      results[k] = { date: r.date, a: r.a, b: r.b, score: r.score, review: AN.review(+k, r), short: r.short || [], crit: r.crit || [] };
    }
    return { v: 1, name: (S.name || "").trim(), teacher: ((S.teacher && S.teacher.name) || "").trim(), studied: studied, todo: todo, tests: tests, results: results,
      complete: [1, 2, 3, 4, 5].every(function (j) { return AN.passed(j); }), updated: new Date().toISOString() };
  }
  function same(p) { var c = JSON.parse(JSON.stringify(p)); delete c.updated; return JSON.stringify(c); }

  /* cloud -> device: only ever adds progress, never removes it */
  function pull(cloud) {
    if (!cloud || typeof cloud !== "object") return;
    AN.merge(function (S) {
      (cloud.studied || []).forEach(function (n) { if (n >= 1 && n <= 50) S.studied[n] = true; });
      var k;
      for (k in (cloud.tests || {})) {
        var c = cloud.tests[k], l = S.tests[k];
        if (!l) S.tests[k] = { best: c.best, last: c.last, tries: c.tries || 1 };
        else { l.best = Math.max(l.best, c.best); l.tries = Math.max(l.tries || 1, c.tries || 1); }
      }
      /* full results (with the chosen answers) stay on the device that took the test; the cloud keeps its own copy for the teacher */
      if (!(S.name || "").trim() && cloud.name) S.name = cloud.name;
      if (!(S.teacher && S.teacher.name) && cloud.teacher) { S.teacher = S.teacher || {}; S.teacher.name = cloud.teacher; }
    });
  }

  function push(now) {
    if (!KC || !user) return;
    var p = profile(), j = same(p);
    if (j === lastJson && !now) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      saved = "saving"; repaint();
      KC.saveProgress(KEY, p).then(function () {
        lastJson = j; saved = "ok"; offline = false; repaint();
      }).catch(function (e) { saved = "error"; offline = true; repaint(); });
    }, now ? 0 : 1200);
  }

  function refreshClass() {
    if (!KC || !user) return Promise.resolve();
    return KC.listMyClasses().then(function (list) {
      myClass = (list || []).filter(function (c) { return c.game === KEY; })[0] || null;
      if (myClass && myClass.teacherName) {
        var S = AN.get();
        if (!(S.teacher && S.teacher.name)) AN.merge(function (s) { s.teacher = s.teacher || {}; s.teacher.name = myClass.teacherName; });
      }
    }).catch(function () {});
  }
  function refreshFeedback() {
    if (!KC || !user) return Promise.resolve();
    return KC.getStudentProfile().then(function (p) { feedback = p && p.progress ? p.progress[FB_KEY] || null : null; }).catch(function () {});
  }

  function friendly(err) {
    var c = (err && err.code) || "", m = (err && err.message) || "";
    if (/wrong-password|invalid-credential|user-not-found|invalid-email/.test(c)) return "Wrong username or password.";
    if (c.indexOf("email-already-in-use") >= 0) return "That username is already taken. Choose another, or sign in.";
    if (c.indexOf("weak-password") >= 0) return "The password needs at least 6 characters.";
    if (c.indexOf("too-many-requests") >= 0) return "Too many tries. Wait a little and try again.";
    if (c.indexOf("network") >= 0) return "No internet connection. Try again when you are online.";
    return m || "Something went wrong. Please try again.";
  }

  /* ---------- the card on the home page ---------- */
  function feedbackHtml() {
    var f = feedback && feedback.marks, out = "";
    if (!f) return "";
    Object.keys(f).sort().forEach(function (k) {
      var m = f[k], p = AN.part(+k);
      out += '<li><b>' + esc(p.label) + '</b> · written answers: C ' + esc(m.c) + '/10, D ' + esc(m.d) + '/5' +
        (m.note ? '<div class="fnote">“' + esc(m.note) + '”</div>' : "") + '</li>';
    });
    return out ? '<div class="cfb"><h4>From your teacher</h4><ul>' + out + '</ul></div>' : "";
  }
  function savedText() {
    if (saved === "saving") return "Saving…";
    if (saved === "ok") return "✓ Progress saved to your class";
    if (saved === "error") return "Could not save. It will try again when you are online.";
    return "";
  }
  function inner() {
    var S = AN.get(), nm = esc((S.name || "").trim());
    if (!KC) {
      return '<div class="ac-head"><span class="cic">👩‍🏫</span><div><h3>My class</h3><p>' + (offline ? "Class features need an internet connection. The book itself works without one." : "Connecting…") + "</p></div></div>";
    }
    var note = msg ? '<p class="cmsg ' + msgKind + '" role="status">' + esc(msg) + "</p>" : "";
    if (!user) {
      var head = '<div class="ac-head"><span class="cic">👩‍🏫</span><div><h3>' + (invite ? "You are invited to a class" : "Learning with a teacher?") + "</h3><p>" +
        (invite ? "Sign in or create an account, then join class <b>" + esc(invite) + "</b>. " : "Sign in and join your teacher’s class with a code. ") +
        "Your teacher will see the hadith you have studied, your test scores and your written answers. Your private notes stay on this device.</p></div></div>";
      if (!mode) return head + '<div class="crow"><button class="btn gold" data-a="m-in">Sign in</button><button class="btn line" data-a="m-up">Create an account</button></div>' +
        '<p class="csmall">You can use the same username as in the Diin Islaam quest games.</p>' + note;
      var up = mode === "up";
      return head + '<form class="cform" data-f="auth">' + (up ? '<label>Full name <small>(printed on your certificate)</small><input name="full" maxlength="48" autocomplete="name" required value="' + nm + '"></label>' : "") +
        '<label>Username<input name="user" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></label>' +
        '<label>Password' + (up ? " <small>(at least 6 characters)</small>" : "") + '<input name="pass" type="password" autocomplete="' + (up ? "new-password" : "current-password") + '" required></label>' +
        (up ? '<label>Email <small>(optional, to reset your password)</small><input name="email" type="email" autocomplete="email"></label>' : "") +
        '<div class="crow"><button class="btn gold" type="submit"' + (busy ? " disabled" : "") + ">" + (up ? "Create account" : "Sign in") + '</button><button class="btn line" type="button" data-a="m-' + (up ? "in" : "up") + '">' +
        (up ? "I have an account" : "Create an account") + '</button><button class="btn plain" type="button" data-a="m-x">Cancel</button></div>' + note + "</form>";
    }
    var who = '<p class="csmall">Signed in as <b>' + esc(user.fullName || user.displayName || user.username) + '</b> · <button class="lnk" data-a="out">Sign out</button></p>';
    if (!myClass) {
      return '<div class="ac-head"><span class="cic">👩‍🏫</span><div><h3>Join your class</h3><p>Ask your teacher for the 6-letter class code' + (invite ? ", or press the button for the class you were invited to." : ".") + "</p></div></div>" +
        '<form class="cform cjoin" data-f="join"><label>Class code<input name="code" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ABC123" value="' + esc(invite) + '" required></label>' +
        '<div class="crow"><button class="btn gold" type="submit"' + (busy ? " disabled" : "") + ">Join class</button></div>" + note + "</form>" + who;
    }
    return '<div class="ac-head"><span class="cic">🎓</span><div><h3>' + esc(myClass.name) + "</h3><p>" + (myClass.teacherName ? "Teacher: <b>" + esc(myClass.teacherName) + "</b> · " : "") +
      'Class code <b>' + esc(myClass.id) + '</b></p></div></div><p class="csave ' + saved + '">' + savedText() + "</p>" + feedbackHtml() + note +
      '<p class="csmall"><button class="lnk" data-a="leave">Leave this class</button> · <button class="lnk" data-a="out">Sign out</button></p>';
  }
  function repaint() {
    if (!mountEl || !document.body.contains(mountEl)) return;
    var active = document.activeElement && document.activeElement.name;
    mountEl.innerHTML = '<div class="ccard">' + inner() + "</div>";
    if (active) { var el = $('[name="' + active + '"]', mountEl); if (el) el.focus(); }
  }
  function setMsg(t, k) { msg = t || ""; msgKind = k || ""; repaint(); }

  function afterLogin(u) {
    user = u; msg = ""; mode = ""; saved = "";
    pull((u.progress || {})[KEY]);
    feedback = (u.progress || {})[FB_KEY] || null;
    refreshClass().then(function () { push(true); repaint(); });
    repaint();
  }

  function bind() {
    if (!mountEl) return;
    mountEl.onclick = function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      var a = b.dataset.a;
      if (a === "m-in") { mode = "in"; msg = ""; repaint(); }
      else if (a === "m-up") { mode = "up"; msg = ""; repaint(); }
      else if (a === "m-x") { mode = ""; msg = ""; repaint(); }
      else if (a === "out") { KC.studentLogout().then(function () { user = null; myClass = null; feedback = null; lastJson = ""; saved = ""; mode = ""; repaint(); }); }
      else if (a === "leave") {
        if (!confirm("Leave " + myClass.name + "? Your teacher will no longer see your progress.")) return;
        KC.studentLeaveClass(myClass.id).then(function () { myClass = null; saved = ""; repaint(); }).catch(function (er) { setMsg(friendly(er), "error"); });
      }
    };
    mountEl.onsubmit = function (e) {
      e.preventDefault();
      var f = e.target, d = {}; [].forEach.call(f.elements, function (el) { if (el.name) d[el.name] = el.value.trim(); });
      if (busy) return;
      if (f.dataset.f === "auth") {
        if (!d.user || !d.pass) { setMsg("Enter your username and password.", "error"); return; }
        busy = true; setMsg(mode === "up" ? "Creating your account…" : "Signing you in…");
        var p = mode === "up" ? KC.studentSignUp(d.user, d.email || "", d.pass, d.full || "") : KC.studentLogin(d.user, d.pass);
        p.then(function (r) {
          if (mode === "up" && d.full && !(AN.get().name || "").trim()) AN.merge(function (S) { S.name = d.full; });
          busy = false;   /* onStudentAuth now reports the signed-in student */
          if (!user) afterLogin({ uid: r.uid, username: r.username, displayName: r.displayName, fullName: r.fullName, progress: r.progress || {} });
        }).catch(function (er) { busy = false; setMsg(friendly(er), "error"); });
      } else if (f.dataset.f === "join") {
        var code = (d.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (code.length !== 6) { setMsg("A class code has 6 letters and numbers.", "error"); return; }
        busy = true; setMsg("Joining…");
        KC.studentJoinClass(code).then(function (c) {
          if (c.game && c.game !== KEY) {
            return KC.studentLeaveClass(c.id).catch(function () {}).then(function () { throw new Error("That code is for a different course. Ask your teacher for the Forty Hadith class code."); });
          }
          myClass = { id: c.id, name: c.name, game: c.game, teacherName: c.teacherName || "" };
          if (c.teacherName) AN.merge(function (S) { S.teacher = S.teacher || {}; if (!S.teacher.name) S.teacher.name = c.teacherName; });
          try { sessionStorage.removeItem("an.invite"); } catch (x) {}
          invite = ""; busy = false; msg = ""; push(true); repaint();
        }).catch(function (er) { busy = false; setMsg(friendly(er), "error"); });
      }
    };
  }

  function ready() {
    if (KC) return;
    KC = window.KidsCloud; offline = false;
    KC.onStudentAuth(function (u) {
      if (!u) { user = null; myClass = null; feedback = null; repaint(); return; }
      if (user && user.uid === u.uid) return;   /* already handled (sign-in form result) */
      afterLogin(u);
    });
    window.addEventListener("focus", function () { if (user && myClass) refreshFeedback().then(repaint); });
    repaint();
  }

  /* ---------- hooks used by the book ---------- */
  window.ANclass = {
    mount: function (el) { mountEl = el; bind(); repaint(); if (user && myClass) refreshFeedback().then(repaint); },
    onSave: function () { push(false); }
  };
  var first = document.getElementById("classcard"); if (first) window.ANclass.mount(first);   /* the home page was drawn before this file loaded */
  if (window.KidsCloud) ready(); else window.addEventListener("kidscloud-ready", ready);
  setTimeout(function () { if (!KC) { offline = true; repaint(); } }, 8000);

  /* ---------- look ---------- */
  var st = document.createElement("style");
  st.textContent =
    ".ccard{max-width:760px;margin:18px auto;background:#fff;border:1.5px solid var(--gold2,#d9bd7a);border-radius:16px;padding:16px 18px;box-shadow:0 6px 20px rgba(60,45,20,.07)}" +
    ".ccard .ac-head{display:flex;gap:12px;align-items:flex-start}.ccard .cic{font-size:30px;line-height:1}" +
    ".ccard h3{margin:0 0 2px;font-size:19px;color:var(--emerald,#0f4c45)}.ccard p{margin:0;color:var(--muted,#6d5f45);font-size:14.5px;line-height:1.5}" +
    ".ccard .crow{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.ccard .btn.plain{background:none;border:0;color:var(--muted,#6d5f45);text-decoration:underline}" +
    ".ccard .cform{display:grid;gap:10px;margin-top:12px}.ccard .cform label{display:grid;gap:3px;font-size:14px;color:var(--ink,#26221c)}" +
    ".ccard .cform small{color:var(--muted,#6d5f45)}" +
    ".ccard .cform input{padding:10px 12px;border:1.5px solid #d8c395;border-radius:10px;font:16px system-ui,sans-serif;background:#fff;color:var(--ink,#26221c);min-width:0}" +
    ".ccard .cform input:focus{outline:2px solid var(--emerald,#0f4c45);outline-offset:1px}" +
    ".ccard .cjoin input{text-transform:uppercase;letter-spacing:.3em;font-weight:700;max-width:220px}" +
    ".ccard .cmsg{margin-top:8px;font-size:14px}.ccard .cmsg.error{color:var(--bad,#b23a3a)}" +
    ".ccard .csmall{margin-top:10px;font-size:13px}.ccard .lnk{border:0;background:none;padding:0;color:var(--emerald,#0f4c45);text-decoration:underline;font-size:inherit}" +
    ".ccard .csave{margin-top:8px;font-size:13.5px;color:var(--muted,#6d5f45)}.ccard .csave.ok{color:var(--ok,#2e7d4f)}.ccard .csave.error{color:var(--bad,#b23a3a)}" +
    ".ccard .cfb{margin-top:10px;background:#fbf6ea;border-radius:10px;padding:8px 12px}.ccard .cfb h4{margin:0 0 4px;font-size:14px;color:var(--emerald,#0f4c45)}" +
    ".ccard .cfb ul{margin:0;padding-left:18px;font-size:14px}.ccard .fnote{font-style:italic;color:var(--muted,#6d5f45)}";
  document.head.appendChild(st);
})();
