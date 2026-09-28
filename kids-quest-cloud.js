/* ===================== Kids Quest Cloud ===================== *
 * Shared account + progress sync for the quest games (Arabic, English,
 * Math, Seerah) and the admin panel. Loaded as a <script type="module">
 * AFTER each game's main classic <script> — same pattern nahw-course.html
 * uses: the classic script sets up a safe default UI (the login screen),
 * and this module upgrades it once Firebase is ready.
 *
 * Accounts use real Firebase Auth, but kids never see or type an email —
 * each username maps to a synthetic address built from the admin's own
 * inbox using Gmail-style "+tag" addressing:
 *
 *   username "amina123"  ->  fesbackups+quest-amina123@gmail.com
 *
 * Gmail (and most providers) deliver +tag addresses straight to the base
 * inbox, so Firebase's own "reset password" email actually reaches the
 * admin, who can then set a new password and hand it to the child. This
 * needs no backend of any kind — it's exactly what "sustain session" and
 * "admin can reset the password" need, using only the official client SDK.
 */
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, sendPasswordResetEmail, deleteUser,
  updateProfile, updateEmail
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAon9aeq2S5gL_Pe7OcI-HSWL41yswBCl8",
  authDomain: "diinislaam-8fdeb.firebaseapp.com",
  projectId: "diinislaam-8fdeb"
};

/* The one real inbox every kid account's synthetic login email resolves
   to (so Firebase's password-reset emails land somewhere real). This is
   NOT the same thing as "who is an admin" — that's decided by the
   kids_quest_admins collection below, so any number of people can be
   admins even though kid accounts all route through this one inbox. */
const ADMIN_EMAIL = "fesbackups@gmail.com";
const ADMIN_LOCAL = ADMIN_EMAIL.split('@')[0];
const ADMIN_DOMAIN = ADMIN_EMAIL.split('@')[1];

const STUDENTS_COLLECTION = 'kids_quest_students';
const ADMINS_COLLECTION = 'kids_quest_admins';
const USERNAMES_COLLECTION = 'kids_quest_usernames';
const QUIZZES_COLLECTION = 'kids_quest_quizzes';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* Turn a plain username into the synthetic login email Firebase Auth
   actually stores. Deterministic and reversible-by-convention — no
   Firestore lookup needed before signing in. */
function usernameToEmail(username){
  const clean = String(username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return ADMIN_LOCAL + '+quest-' + clean + '@' + ADMIN_DOMAIN;
}
function normalizeUsername(username){
  return String(username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
}
function normalizeEmail(email){
  return String(email || '').trim().toLowerCase();
}
function teacherUsernameToEmail(username){
  const clean = normalizeUsername(username);
  if(clean.indexOf('teacher') < 0) throw new Error('Teacher username must contain “teacher”, for example salah-teacher.');
  return ADMIN_LOCAL + '+quest-teacher-' + clean + '@' + ADMIN_DOMAIN;
}

/* ===================== Student-facing API ===================== */

/* Every account's REAL Firebase Auth login is created under the
   deterministic synthetic address (see usernameToEmail above) — always,
   with no exception — so "same username = same one shared account
   across every Quest game" can never fragment into two separate
   accounts no matter which game someone signs up from. If the student
   gives a real email at sign-up, that account's email is then changed
   ("graduated") to the real one via updateEmail, and the mapping is
   recorded in kids_quest_usernames so future sign-ins (from ANY game)
   can find the account again — usernameToEmail alone would no longer
   point at it once it's graduated. An account that never graduates has
   no doc in kids_quest_usernames at all, and resolveLoginEmail falls
   straight back to the deterministic address, so every account created
   before this feature existed keeps working with zero migration. */
function resolveLoginEmail(username){
  const clean = normalizeUsername(username);
  return getDoc(doc(db, USERNAMES_COLLECTION, clean)).then(function(snap){
    return (snap.exists() && snap.data().email) ? snap.data().email : usernameToEmail(clean);
  }).catch(function(){ return usernameToEmail(clean); });
}

/* Logs a child in with their plain username + password. Resolves with
   the Firestore profile doc (creating a blank one on first-ever login,
   in case an admin-created account hasn't been touched yet). Rejects
   (and signs back out) if an admin has disabled the account. */
function studentLogin(username, password){
  const clean = normalizeUsername(username);
  return resolveLoginEmail(clean).then(function(email){
    return signInWithEmailAndPassword(auth, email, password);
  }).then(function(cred){
    return ensureStudentDoc(cred.user, clean).then(function(data){
      if(data.disabled){
        return signOut(auth).then(function(){
          const err = new Error('This account has been disabled by an admin.');
          err.code = 'app/account-disabled';
          throw err;
        });
      }
      return { uid: cred.user.uid, username: data.username, displayName: data.displayName || data.username, fullName: data.fullName || '', progress: data.progress || {} };
    });
  });
}

/* Self-service sign-up: anyone can pick their own username, an optional
   real email (used for self-service password recovery — see
   studentForgotPassword — and for the admin to reach them) and a
   password.

   The account is always CREATED under the synthetic address first (see
   the comment above resolveLoginEmail for why), so a taken username
   reliably fails here with Firebase's own "email already in use" no
   matter whether the existing account has since graduated to a real
   email or not — the pre-check against kids_quest_usernames below
   catches the graduated case that usernameToEmail's uniqueness check
   alone could no longer see. If a real email is given, the account's
   email is then changed to it (best-effort: if that email is already
   in use by something else, the account still works fine under the
   synthetic address, just without self-service recovery).

   `fullName` is optional: when a caller provides it (the Qur'an
   tracker's create-account form does), it becomes the account's
   displayName in place of the username, everywhere that field is read —
   the admin roster, this game, and any other game on the shared login.
   Callers that do not pass it (the existing games) are unaffected:
   displayName still defaults to the username exactly as before. */
function studentSignUp(username, contactEmail, password, fullName){
  const clean = normalizeUsername(username);
  if(!clean) return Promise.reject(new Error('Choose a username.'));
  const cleanEmail = normalizeEmail(contactEmail || '');
  const cleanFullName = String(fullName || '').trim();
  return getDoc(doc(db, USERNAMES_COLLECTION, clean)).catch(function(){ return { exists:function(){ return false; } }; }).then(function(lookupSnap){
    if(lookupSnap.exists()){
      const err = new Error('That username is already taken. Try signing in instead.');
      err.code = 'auth/email-already-in-use';
      throw err;
    }
    const email = usernameToEmail(clean);
    return createUserWithEmailAndPassword(auth, email, password).then(function(cred){
      const data = {
        username: clean,
        displayName: cleanFullName || clean,
        fullName: cleanFullName,
        contactEmail: cleanEmail,
        selfSignup: true,
        createdAt: new Date().toISOString(),
        progress: {}
      };
      return setDoc(doc(db, STUDENTS_COLLECTION, cred.user.uid), data).then(function(){
        if(!cleanEmail) return null;
        return updateEmail(cred.user, cleanEmail)
          // Firestore rules see request.auth.token.email from the ID
          // token's cached claims, which updateEmail() does not refresh
          // by itself — force a refresh so the very next write (below,
          // claiming this username under the new email) is evaluated
          // against the email that write is actually for.
          .then(function(){ return cred.user.getIdToken(true); })
          .then(function(){ return setDoc(doc(db, USERNAMES_COLLECTION, clean), { email: cleanEmail, uid: cred.user.uid }); })
          .catch(function(){ return null; });
      }).then(function(){
        return { uid: cred.user.uid, username: clean, displayName: data.displayName, fullName: cleanFullName, progress: {} };
      });
    });
  });
}

/* Self-service "forgot password" for a STUDENT'S own login — only works
   for an account that graduated to a real email at sign-up (see above);
   otherwise there's nowhere of the student's own to send a reset link
   to, so this says so plainly rather than silently emailing the admin's
   inbox the way adminSendPasswordReset deliberately still does. */
function studentForgotPassword(username){
  const clean = normalizeUsername(username);
  if(!clean) return Promise.reject(new Error('Enter your username.'));
  return getDoc(doc(db, USERNAMES_COLLECTION, clean)).then(function(snap){
    if(!snap.exists() || !snap.data().email){
      const err = new Error('No email is on file for this account. Ask an admin or teacher to reset your password for you.');
      err.code = 'app/no-email-on-file';
      throw err;
    }
    return sendPasswordResetEmail(auth, snap.data().email);
  });
}

function ensureStudentDoc(user, usernameHint){
  const ref = doc(db, STUDENTS_COLLECTION, user.uid);
  return getDoc(ref).then(function(snap){
    if(snap.exists()){
      const data = snap.data();
      if(!data.displayName) data.displayName = data.username;
      return data;
    }
    const clean = normalizeUsername(usernameHint || user.email);
    const data = {
      username: clean,
      displayName: clean,
      createdAt: new Date().toISOString(),
      progress: {}
    };
    return setDoc(ref, data).then(function(){ return data; });
  });
}

/* Fires cb(null) if signed out, cb({uid, username, progress}) once
   signed in (including on a returning visit — this is what "sustains
   the session" across reloads, with zero extra code: Firebase Auth's
   own persistence handles it). */
function onStudentAuth(cb){
  return onAuthStateChanged(auth, function(user){
    if(!user){ cb(null); return; }
    ensureStudentDoc(user, null).then(function(data){
      if(data.disabled){ signOut(auth); cb(null); return; }
      cb({ uid: user.uid, username: data.username, displayName: data.displayName || data.username, fullName: data.fullName || '', progress: data.progress || {} });
    }).catch(function(){ cb(null); });
  });
}

function studentLogout(){ return signOut(auth); }

/* The signed-in user's Firebase ID token, for calling a backend that has to
   know who is asking without ever being told a username or password. Firebase
   refreshes it automatically; null when signed out. Used by the Qur'an daily
   tracker's reminder API. */
function getIdToken(forceRefresh){
  return auth.currentUser
    ? auth.currentUser.getIdToken(!!forceRefresh)
    : Promise.resolve(null);
}

/* Saves one game's profile object (stars, coins, unlocked, certs, avatar —
   whatever shape that game already uses) under progress.<gameKey>, merged
   so other games' saved progress on the same account is untouched. */
function saveProgress(gameKey, profileObj){
  const user = auth.currentUser;
  if(!user) return Promise.reject(new Error('Not signed in'));
  const patch = { progress: {} };
  patch.progress[gameKey] = profileObj;
  return setDoc(doc(db, STUDENTS_COLLECTION, user.uid), patch, { merge:true });
}

/* Re-read the current student's record after a teacher has approved a map.
   This lets an already-open student tab receive the new certificate/unlock
   when it becomes visible again without asking the child to sign in again. */
function getStudentProfile(){
  const user = auth.currentUser;
  if(!user) return Promise.resolve(null);
  return getDoc(doc(db, STUDENTS_COLLECTION, user.uid)).then(function(snap){
    if(!snap.exists()) return null;
    const data = snap.data();
    return { uid:user.uid, username:data.username, displayName:data.displayName || data.username,
      fullName:data.fullName || '', progress:data.progress || {} };
  });
}

/* The name printed on certificates — separate from username/displayName
   (which may be a login-style handle like "wbzz0015") and shared across
   all four games, so a child fixes the spelling once and every future
   certificate, in every game, uses it. */
function setFullName(name){
  const user = auth.currentUser;
  if(!user) return Promise.reject(new Error('Not signed in'));
  return setDoc(doc(db, STUDENTS_COLLECTION, user.uid), { fullName: String(name || '').trim() }, { merge:true });
}

/* ===================== Admin-facing API ===================== */
/* Who is allowed in kids-admin.html (or the Tuhfatul Atfaal teacher
   portal) is decided entirely by whether a doc exists at
   kids_quest_admins/{their email} and what its role field says — not by
   any email hardcoded in this file. Three roles: 'teacher' can manage
   students and grade Tuhfatul Atfaal progress, but never delete a
   student; 'admin' can do everything 'teacher' can, plus delete
   students and approve/add/remove teacher accounts; 'super' can also
   manage other admins (and teachers). The very first admin doc has to
   be created by hand in the Firebase console (nothing can grant that
   role from inside the app before it exists) — see kids-admin.html's
   setup instructions. Every check here is re-enforced server-side by
   the Firestore rules the project owner adds; a client-side bypass
   still hits a denied write. */

function adminSignIn(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}
function teacherSignIn(usernameOrEmail, password){
  const value = String(usernameOrEmail || '').trim();
  const email = value.indexOf('@') >= 0 ? normalizeEmail(value) : teacherUsernameToEmail(value);
  return adminSignIn(email, password);
}
function teacherSignUp(username, password){
  const clean = normalizeUsername(username);
  const email = teacherUsernameToEmail(clean);
  return createUserWithEmailAndPassword(auth, email, password).then(function(cred){
    return updateProfile(cred.user, { displayName: clean }).catch(function(){}).then(function(){
      return { uid: cred.user.uid, username: clean, email: email, awaitingApproval: true };
    });
  });
}
/* Self-service account creation for a NEW admin whose email a super
   admin already added to kids_quest_admins. Creating your own Firebase
   Auth login is harmless even for a stranger who isn't pre-authorized —
   onAdminAuth below still reports them as signed out of the admin panel
   until their email actually has an admins doc. */
function adminSignUp(email, password){
  return createUserWithEmailAndPassword(auth, email, password);
}
function adminSignOut(){ return signOut(auth); }

/* Fires cb(null) if fully signed out; cb({ email, role: null }) if signed
   in but that email has no admin doc (so the page can say "not an admin"
   instead of just bouncing back to a blank sign-in form); otherwise
   cb({ email, role: 'admin' | 'super' }). */
function onAdminAuth(cb){
  return onAuthStateChanged(auth, function(user){
    if(!user || !user.email){ cb(null); return; }
    const email = normalizeEmail(user.email);
    getDoc(doc(db, ADMINS_COLLECTION, email)).then(function(snap){
      cb(snap.exists() ? { email: email, role: snap.data().role || 'admin' } : { email: email, role: null });
    }).catch(function(){ cb({ email: email, role: null }); });
  });
}

/* ---- super-admin only: managing the admin/super roster itself ---- */
/* Teacher docs are deliberately left out of this list (and of anything
   superAddAdmin/superSetAdminRole/superRemoveAdmin touch) — they're
   managed separately below by adminAddTeacher/adminRemoveTeacher, which
   a regular admin can also call. Mixing them in here would let "make
   super admin" accidentally apply to a teacher row. */
function superListAdmins(){
  return getDocs(collection(db, ADMINS_COLLECTION)).then(function(snap){
    const out = [];
    snap.forEach(function(d){ const data = d.data(); if(data.role !== 'teacher') out.push(data); });
    out.sort(function(a, b){ return (a.email || '').localeCompare(b.email || ''); });
    return out;
  });
}
function superAddAdmin(email, role){
  const clean = normalizeEmail(email);
  if(!clean) return Promise.reject(new Error('Enter an email address.'));
  const user = auth.currentUser;
  return setDoc(doc(db, ADMINS_COLLECTION, clean), {
    email: clean,
    role: role === 'super' ? 'super' : 'admin',
    addedAt: new Date().toISOString(),
    addedBy: user && user.email
  });
}
function superSetAdminRole(email, role){
  return setDoc(doc(db, ADMINS_COLLECTION, normalizeEmail(email)), { role: role === 'super' ? 'super' : 'admin' }, { merge:true });
}
function superRemoveAdmin(email){
  return deleteDoc(doc(db, ADMINS_COLLECTION, normalizeEmail(email)));
}

/* ---- teacher accounts: any admin or super admin can manage these ---- */
/* A teacher's Firestore doc only ever gets role:'teacher' — never
   'admin'/'super' — so a teacher account can NEVER sign into the general
   kids-admin.html panel or delete a student; it only unlocks the
   Tuhfatul Atfaal teacher portal's grading tools. Approving someone
   (after they've created their own login with teacherSignUp) and
   pre-registering them ahead of time are the same call: it just writes
   the doc, approved or not doesn't exist as a separate idea here —
   same as how a regular admin doc works today. */
function adminAddTeacher(usernameOrEmail){
  const value = String(usernameOrEmail || '').trim();
  const email = value.indexOf('@') >= 0 ? normalizeEmail(value) : teacherUsernameToEmail(value);
  const user = auth.currentUser;
  return setDoc(doc(db, ADMINS_COLLECTION, email), {
    email: email,
    role: 'teacher',
    addedAt: new Date().toISOString(),
    addedBy: user && user.email
  });
}
function adminRemoveTeacher(email){
  return deleteDoc(doc(db, ADMINS_COLLECTION, normalizeEmail(email)));
}
function adminListTeachers(){
  return getDocs(collection(db, ADMINS_COLLECTION)).then(function(snap){
    const out = [];
    snap.forEach(function(d){ const data = d.data(); if(data.role === 'teacher') out.push(data); });
    out.sort(function(a, b){ return (a.email || '').localeCompare(b.email || ''); });
    return out;
  });
}

/* Creates a brand-new student account without disturbing the admin's own
   signed-in session: Firebase's client SDK signs in as whatever account
   createUserWithEmailAndPassword just made, so that call runs on a
   throwaway *second* Firebase app instance, then immediately signs out
   of it — the admin's session on the primary `auth` above never moves. */
function adminCreateStudent(username, displayName, password){
  const clean = normalizeUsername(username);
  if(!clean) return Promise.reject(new Error('Enter a username.'));
  const email = usernameToEmail(clean);
  const secondary = initializeApp(firebaseConfig, 'admin-create-' + Date.now());
  const secondaryAuth = getAuth(secondary);
  return createUserWithEmailAndPassword(secondaryAuth, email, password)
    .then(function(cred){
      const uid = cred.user.uid;
      return updateProfile(cred.user, { displayName: displayName || clean })
        .catch(function(){})
        .then(function(){ return signOut(secondaryAuth); })
        .then(function(){ return deleteApp(secondary); })
        .then(function(){
          return setDoc(doc(db, STUDENTS_COLLECTION, uid), {
            username: clean,
            displayName: displayName || clean,
            createdAt: new Date().toISOString(),
            createdBy: (auth.currentUser && auth.currentUser.email) || null,
            progress: {}
          });
        })
        .then(function(){ return { uid: uid, username: clean, email: email }; });
    })
    .catch(function(err){
      return deleteApp(secondary).catch(function(){}).then(function(){ throw err; });
    });
}

/* Sends Firebase's own password-reset email wherever this account's
   real login currently resolves to: the admin's own inbox (via the
   +tag) for an ordinary account, or straight to the student's own
   email if they graduated to one at sign-up — either way it's the same
   trusted Firebase reset-email flow, just reaching whoever actually
   controls that account's current address. */
function adminSendPasswordReset(username){
  return resolveLoginEmail(username).then(function(email){
    return sendPasswordResetEmail(auth, email);
  });
}

/* Self-service "forgot password" for an admin's OWN login, straight to
   their real email (admins never use synthetic addressing the way
   student accounts do) — the same official Firebase reset-email flow,
   just triggered from the sign-in screen instead of needing the
   Firebase console. */
function adminForgotPassword(email){
  return sendPasswordResetEmail(auth, normalizeEmail(email));
}

function adminListStudents(){
  return getDocs(query(collection(db, STUDENTS_COLLECTION), orderBy('createdAt', 'desc')))
    .then(function(snap){
      const out = [];
      snap.forEach(function(d){ out.push(Object.assign({ uid: d.id }, d.data())); });
      return out;
    });
}

/* "Reset username" = migrate to a new account under the new name,
   carrying progress across, then remove the old one. Needs the
   student's CURRENT password once (typed by the admin) since deleting
   a Firebase Auth user requires a recent sign-in as that user — done on
   the same disposable secondary app instance as account creation. */
function adminRenameStudent(oldUsername, oldPassword, newUsername, oldUid){
  const cleanNew = normalizeUsername(newUsername);
  if(!cleanNew) return Promise.reject(new Error('Enter a new username.'));
  const secondary = initializeApp(firebaseConfig, 'admin-rename-' + Date.now());
  const secondaryAuth = getAuth(secondary);
  return resolveLoginEmail(oldUsername).then(function(oldEmail){
    return signInWithEmailAndPassword(secondaryAuth, oldEmail, oldPassword)
    .then(function(cred){
      return getDoc(doc(db, STUDENTS_COLLECTION, oldUid)).then(function(oldSnap){
        const oldData = oldSnap.exists() ? oldSnap.data() : { progress:{} };
        const graduatedEmail = oldEmail !== usernameToEmail(oldUsername) ? oldEmail : '';
        return createUserWithEmailAndPassword(secondaryAuth, usernameToEmail(cleanNew), oldPassword)
          .then(function(newCred){
            const newUid = newCred.user.uid;
            return setDoc(doc(db, STUDENTS_COLLECTION, newUid), {
              username: cleanNew,
              displayName: oldData.displayName || cleanNew,
              contactEmail: oldData.contactEmail || '',
              createdAt: oldData.createdAt || new Date().toISOString(),
              createdBy: (auth.currentUser && auth.currentUser.email) || null,
              progress: oldData.progress || {}
            }).then(function(){
              return deleteUser(cred.user).catch(function(){});
            }).then(function(){
              return deleteDoc(doc(db, STUDENTS_COLLECTION, oldUid)).catch(function(){});
            }).then(function(){
              return graduatedEmail
                ? updateEmail(newCred.user, graduatedEmail)
                    .then(function(){ return setDoc(doc(db, USERNAMES_COLLECTION, cleanNew), { email: graduatedEmail, uid: newUid }); })
                    .catch(function(){ return null; })
                : null;
            }).then(function(){
              return deleteDoc(doc(db, USERNAMES_COLLECTION, normalizeUsername(oldUsername))).catch(function(){});
            }).then(function(){
              return signOut(secondaryAuth);
            }).then(function(){
              return deleteApp(secondary);
            }).then(function(){
              return { uid: newUid, username: cleanNew };
            });
          });
      });
    });
  })
    .catch(function(err){
      return deleteApp(secondary).catch(function(){}).then(function(){ throw err; });
    });
}

function adminDeleteStudent(uid){
  return deleteDoc(doc(db, STUDENTS_COLLECTION, uid));
}

/* "Restrict" a student without deleting their progress: a disabled
   account is signed out immediately (if active) and blocked from
   logging back in until an admin re-enables it. */
function adminSetStudentDisabled(uid, disabled){
  return setDoc(doc(db, STUDENTS_COLLECTION, uid), { disabled: !!disabled }, { merge:true });
}
function adminUpdateStudentGameProgress(uid, gameKey, profileObj){
  if(!uid || !gameKey) return Promise.reject(new Error('Student and course are required.'));
  const patch = { progress: {}, lastTeacherUpdateAt: new Date().toISOString() };
  patch.progress[gameKey] = profileObj;
  return setDoc(doc(db, STUDENTS_COLLECTION, uid), patch, { merge:true });
}
function adminUpdateStudentNames(uid, displayName, fullName){
  return setDoc(doc(db, STUDENTS_COLLECTION, uid), {
    displayName: String(displayName || '').trim(),
    fullName: String(fullName || displayName || '').trim()
  }, { merge:true });
}

/* Everything else worth keeping on file for a student besides their
   name — a small photo (already resized to a thumbnail data URL by the
   caller before this is called, so it stays well under Firestore's
   per-document size limit), date of birth, a contact email, and a
   parent/guardian name + phone for the admin or teacher to reach out
   to. Any field left out of `details` is left untouched, so a partial
   edit (just the photo, say) never blanks out the others. */
function adminUpdateStudentDetails(uid, details){
  if(!uid) return Promise.reject(new Error('Missing student.'));
  const d = details || {};
  const patch = {};
  if('photoUrl' in d) patch.photoUrl = String(d.photoUrl || '');
  if('dob' in d) patch.dob = String(d.dob || '');
  if('contactEmail' in d) patch.contactEmail = normalizeEmail(d.contactEmail || '');
  if('guardianName' in d) patch.guardianName = String(d.guardianName || '').trim();
  if('guardianPhone' in d) patch.guardianPhone = String(d.guardianPhone || '').trim();
  if('notes' in d) patch.notes = String(d.notes || '').trim();
  return setDoc(doc(db, STUDENTS_COLLECTION, uid), patch, { merge:true });
}

/* ---- teacher-written quizzes ---- */
/* One doc per quiz in kids_quest_quizzes. Any signed-in account can read
   them (students need to, to take them); only a listed admin, super admin
   or teacher can write. A student's answers never go here — they're saved
   into that student's own progress record (under the game's key) through
   the normal saveProgress, so no new write permission is needed for them
   and the teacher portal already reads them with the rest of the student. */
function listQuizzes(game){
  return getDocs(collection(db, QUIZZES_COLLECTION)).then(function(snap){
    const out = [];
    snap.forEach(function(d){
      const data = d.data();
      if(!game || data.game === game) out.push(Object.assign({ id: d.id }, data));
    });
    out.sort(function(a, b){ return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
    return out;
  });
}
function adminSaveQuiz(quiz){
  const q = quiz || {};
  const ref = q.id ? doc(db, QUIZZES_COLLECTION, q.id) : doc(collection(db, QUIZZES_COLLECTION));
  const user = auth.currentUser;
  const now = new Date().toISOString();
  const data = {
    title: String(q.title || '').trim() || 'Untitled quiz',
    game: String(q.game || ''),
    map: Number.isInteger(q.map) ? q.map : -1,
    instructions: String(q.instructions || '').trim(),
    passPercent: Math.min(100, Math.max(0, Number(q.passPercent) || 70)),
    published: !!q.published,
    questions: (Array.isArray(q.questions) ? q.questions : []).map(function(item){
      return {
        q: String(item.q || '').trim(),
        choices: (Array.isArray(item.choices) ? item.choices : []).map(function(c){ return String(c || '').trim(); }),
        answer: Number(item.answer) || 0,
        explain: String(item.explain || '').trim()
      };
    }),
    updatedAt: now,
    updatedBy: (user && user.email) || null
  };
  if(!q.id){
    data.createdAt = now;
    data.createdBy = (user && user.email) || null;
    data.createdByName = String(q.createdByName || '').trim();
  }
  return setDoc(ref, data, { merge:true }).then(function(){ return ref.id; });
}
function adminDeleteQuiz(id){
  return deleteDoc(doc(db, QUIZZES_COLLECTION, id));
}

window.KidsCloud = {
  usernameToEmail: usernameToEmail,
  normalizeUsername: normalizeUsername,
  studentLogin: studentLogin,
  studentSignUp: studentSignUp,
  studentForgotPassword: studentForgotPassword,
  onStudentAuth: onStudentAuth,
  studentLogout: studentLogout,
  getIdToken: getIdToken,
  saveProgress: saveProgress,
  getStudentProfile: getStudentProfile,
  setFullName: setFullName,
  adminSignIn: adminSignIn,
  adminSignUp: adminSignUp,
  teacherUsernameToEmail: teacherUsernameToEmail,
  teacherSignIn: teacherSignIn,
  teacherSignUp: teacherSignUp,
  adminSignOut: adminSignOut,
  onAdminAuth: onAdminAuth,
  adminCreateStudent: adminCreateStudent,
  adminSendPasswordReset: adminSendPasswordReset,
  adminForgotPassword: adminForgotPassword,
  adminListStudents: adminListStudents,
  adminRenameStudent: adminRenameStudent,
  adminDeleteStudent: adminDeleteStudent,
  adminSetStudentDisabled: adminSetStudentDisabled,
  adminUpdateStudentGameProgress: adminUpdateStudentGameProgress,
  adminUpdateStudentNames: adminUpdateStudentNames,
  adminUpdateStudentDetails: adminUpdateStudentDetails,
  superListAdmins: superListAdmins,
  superAddAdmin: superAddAdmin,
  superSetAdminRole: superSetAdminRole,
  superRemoveAdmin: superRemoveAdmin,
  adminAddTeacher: adminAddTeacher,
  adminRemoveTeacher: adminRemoveTeacher,
  adminListTeachers: adminListTeachers,
  listQuizzes: listQuizzes,
  adminSaveQuiz: adminSaveQuiz,
  adminDeleteQuiz: adminDeleteQuiz,
  ADMIN_EMAIL: ADMIN_EMAIL
};
window.dispatchEvent(new Event('kidscloud-ready'));
