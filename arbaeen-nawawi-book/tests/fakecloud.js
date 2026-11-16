/* In-memory stand-in for kids-quest-cloud.js, shared between pages through localStorage. */
(function(){
  var DBK = 'fc.db';
  function load(){ try { return JSON.parse(localStorage.getItem(DBK)) || null; } catch(e){ return null; } }
  var db = load() || { students:{}, classes:{}, admins:{ 'ahmed@x.test': { role:'teacher', fullName:'Ustadh Ahmed' }, 'pending@x.test': { role:null } }, pw:{ 'ahmed-teacher':'secret1', 'new-teacher':'secret1' } };
  function save(){ localStorage.setItem(DBK, JSON.stringify(db)); }
  function reload(){ db = load() || db; }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function merge(t, p){ Object.keys(p).forEach(function(k){ if(p[k] && typeof p[k] === 'object' && !Array.isArray(p[k]) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) merge(t[k], p[k]); else t[k] = clone(p[k]); }); return t; }
  var SA = 'fc.auth.student', TA = 'fc.auth.staff';
  var norm = function(u){ return String(u||'').trim().toLowerCase().replace(/[^a-z0-9_.-]/g,''); };
  var P = function(v){ return new Promise(function(r){ setTimeout(function(){ r(v); }, 5); }); };
  var E = function(code, msg){ var e = new Error(msg||code); e.code = code; return e; };
  function me(){ reload(); var uid = localStorage.getItem(SA); return uid && db.students[uid] ? Object.assign({ uid: uid }, clone(db.students[uid])) : null; }
  function staff(){ reload(); var em = localStorage.getItem(TA); return em ? Object.assign({ email: em }, db.admins[em]) : null; }
  var KC = {
    normalizeUsername: norm,
    studentSignUp: function(u, email, pass, full){
      reload(); u = norm(u); var uid = 'u-' + u;
      if(db.students[uid]) return Promise.reject(E('auth/email-already-in-use'));
      if(String(pass).length < 6) return Promise.reject(E('auth/weak-password'));
      db.students[uid] = { username:u, displayName: full || u, fullName: full || '', progress:{}, createdAt: new Date().toISOString(), teacherEmails:[] }; db.pw[u] = pass; save();
      localStorage.setItem(SA, uid); notify();
      return P({ uid:uid, username:u, displayName: full||u, fullName: full||'', progress:{} });
    },
    studentLogin: function(u, pass){
      reload(); u = norm(u); var uid = 'u-' + u;
      if(!db.students[uid] || db.pw[u] !== pass) return Promise.reject(E('auth/invalid-credential'));
      localStorage.setItem(SA, uid); notify(); var s = db.students[uid];
      return P({ uid:uid, username:u, displayName:s.displayName, fullName:s.fullName||'', progress:clone(s.progress||{}) });
    },
    studentLogout: function(){ localStorage.removeItem(SA); notify(); return P(); },
    onStudentAuth: function(cb){ studentCbs.push(cb); setTimeout(function(){ cb(me()); }, 20); return function(){}; },
    saveProgress: function(key, obj){ var m = me(); if(!m) return Promise.reject(E('x','Not signed in')); reload(); var s = db.students[m.uid]; s.progress = s.progress||{}; s.progress[key] = merge(s.progress[key]||{}, obj); save(); window.__saves = (window.__saves||0) + 1; return P(); },
    getStudentProfile: function(){ var m = me(); return P(m ? { uid:m.uid, username:m.username, displayName:m.displayName, fullName:m.fullName, progress:m.progress||{} } : null); },
    listMyClasses: function(){ var m = me(); reload(); if(!m) return P([]); return P(Object.keys(db.classes).map(function(id){ return Object.assign({ id:id }, db.classes[id]); }).filter(function(c){ return (c.studentUids||[]).indexOf(m.uid) >= 0; })); },
    studentJoinClass: function(code){
      var m = me(); reload(); code = String(code).toUpperCase(); var c = db.classes[code];
      if(!m) return Promise.reject(E('x','Not signed in'));
      if(!c) return Promise.reject(Object.assign(new Error('No class has that code. Check it with your teacher.'), { code:'app/no-class' }));
      c.studentUids = c.studentUids||[]; if(c.studentUids.indexOf(m.uid) < 0) c.studentUids.push(m.uid);
      var s = db.students[m.uid]; s.teacherEmails = s.teacherEmails||[]; if(c.teacherEmail && s.teacherEmails.indexOf(c.teacherEmail) < 0) s.teacherEmails.push(c.teacherEmail);
      save(); return P(Object.assign({ id:code }, clone(c)));
    },
    studentLeaveClass: function(id){ var m = me(); reload(); var c = db.classes[id]; if(c) c.studentUids = (c.studentUids||[]).filter(function(u){ return u !== m.uid; }); save(); return P(); },
    teacherSignIn: function(u, pass){
      reload(); u = norm(u); if(db.pw[u] !== pass) return Promise.reject(E('auth/invalid-credential'));
      var em = u === 'ahmed-teacher' ? 'ahmed@x.test' : 'pending@x.test'; localStorage.setItem(TA, em); notify(); return P();
    },
    adminSignOut: function(){ localStorage.removeItem(TA); notify(); return P(); },
    onAdminAuth: function(cb){ staffCbs.push(cb); setTimeout(function(){ var s = staff(); cb(s ? { email:s.email, role:s.role, fullName:s.fullName||'' } : null); }, 20); return function(){}; },
    listClasses: function(game){ reload(); return P(Object.keys(db.classes).map(function(id){ return Object.assign({ id:id }, clone(db.classes[id]), { studentUids: db.classes[id].studentUids||[] }); }).filter(function(c){ return !game || c.game === game; })); },
    adminCreateClass: function(c){ var s = staff(); reload(); var code = (window.__codes && window.__codes.shift()) || Math.random().toString(36).slice(2,8).toUpperCase(); db.classes[code] = { name:c.name, game:c.game, teacherEmail:s.email, teacherName:c.teacherName||'', studentUids:[], createdAt:new Date().toISOString() }; save(); return P(code); },
    adminUpdateClass: function(id, p){ reload(); var c = db.classes[id]; if(p.name != null) c.name = p.name; if(p.teacherName != null) c.teacherName = p.teacherName; if(Array.isArray(p.studentUids)) c.studentUids = p.studentUids; save(); return P(); },
    adminDeleteClass: function(id){ reload(); delete db.classes[id]; save(); return P(); },
    adminListStudents: function(){ var s = staff(); reload(); return P(Object.keys(db.students).map(function(u){ return Object.assign({ uid:u }, clone(db.students[u])); }).filter(function(x){ return s.role !== 'teacher' || (x.teacherEmails||[]).indexOf(s.email) >= 0; })); },
    watchStudents: function(cb){ var last = ''; var t = setInterval(function(){ var s = staff(); if(!s) return; var all = Object.keys(db.students).map(function(u){ return Object.assign({ uid:u }, clone(db.students[u])); }).filter(function(x){ return s.role !== 'teacher' || (x.teacherEmails||[]).indexOf(s.email) >= 0; }); var j = JSON.stringify(all); if(j !== last){ last = j; cb(all); } }, 300); return function(){ clearInterval(t); }; },
    adminUpdateStudentGameProgress: function(uid, key, obj){ reload(); var s = db.students[uid]; s.progress = s.progress||{}; s.progress[key] = merge(s.progress[key]||{}, obj); save(); return P(); }
  };
  var studentCbs = [], staffCbs = [];
  function notify(){ setTimeout(function(){ var m = me(), s = staff(); studentCbs.forEach(function(cb){ cb(m); }); staffCbs.forEach(function(cb){ cb(s ? { email:s.email, role:s.role, fullName:s.fullName||'' } : null); }); }, 10); }
  window.KidsCloud = KC; window.dispatchEvent(new Event('kidscloud-ready'));
})();
