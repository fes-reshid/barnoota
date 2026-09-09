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
  updateProfile
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

/* ===================== Student-facing API ===================== */

/* Logs a child in with their plain username + password. Resolves with
   the Firestore profile doc (creating a blank one on first-ever login,
   in case an admin-created account hasn't been touched yet). */
function studentLogin(username, password){
  const email = usernameToEmail(username);
  return signInWithEmailAndPassword(auth, email, password)
    .then(function(cred){
      return ensureStudentDoc(cred.user, username).then(function(data){
        return { uid: cred.user.uid, username: data.username, displayName: data.displayName || data.username, fullName: data.fullName || '', progress: data.progress || {} };
      });
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
      cb({ uid: user.uid, username: data.username, displayName: data.displayName || data.username, fullName: data.fullName || '', progress: data.progress || {} });
    }).catch(function(){ cb(null); });
  });
}

function studentLogout(){ return signOut(auth); }

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
/* Who is allowed in kids-admin.html is decided entirely by whether a doc
   exists at kids_quest_admins/{their email} — not by any email hardcoded
   in this file. Two roles: 'admin' can manage students; 'super' can also
   manage other admins. The very first admin doc has to be created by
   hand in the Firebase console (nothing can grant that role from inside
   the app before it exists) — see kids-admin.html's setup instructions.
   Every check here is re-enforced server-side by the Firestore rules the
   project owner adds; a client-side bypass still hits a denied write. */

function adminSignIn(email, password){
  return signInWithEmailAndPassword(auth, email, password);
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

/* ---- super-admin only: managing the admin roster itself ---- */
function superListAdmins(){
  return getDocs(collection(db, ADMINS_COLLECTION)).then(function(snap){
    const out = [];
    snap.forEach(function(d){ out.push(d.data()); });
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

/* Sends Firebase's own password-reset email to the admin's real inbox
   (via the +tag). The admin opens it, sets a new password, then tells
   the child what it is — same trusted flow Firebase already runs for
   every "forgot password" link on the web, just redirected to whoever
   controls the base address. */
function adminSendPasswordReset(username){
  return sendPasswordResetEmail(auth, usernameToEmail(username));
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
  return signInWithEmailAndPassword(secondaryAuth, usernameToEmail(oldUsername), oldPassword)
    .then(function(cred){
      return getDoc(doc(db, STUDENTS_COLLECTION, oldUid)).then(function(oldSnap){
        const oldData = oldSnap.exists() ? oldSnap.data() : { progress:{} };
        return createUserWithEmailAndPassword(secondaryAuth, usernameToEmail(cleanNew), oldPassword)
          .then(function(newCred){
            const newUid = newCred.user.uid;
            return setDoc(doc(db, STUDENTS_COLLECTION, newUid), {
              username: cleanNew,
              displayName: oldData.displayName || cleanNew,
              createdAt: oldData.createdAt || new Date().toISOString(),
              createdBy: (auth.currentUser && auth.currentUser.email) || null,
              progress: oldData.progress || {}
            }).then(function(){
              return deleteUser(cred.user).catch(function(){});
            }).then(function(){
              return deleteDoc(doc(db, STUDENTS_COLLECTION, oldUid)).catch(function(){});
            }).then(function(){
              return signOut(secondaryAuth);
            }).then(function(){
              return deleteApp(secondary);
            }).then(function(){
              return { uid: newUid, username: cleanNew };
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

window.KidsCloud = {
  usernameToEmail: usernameToEmail,
  normalizeUsername: normalizeUsername,
  studentLogin: studentLogin,
  onStudentAuth: onStudentAuth,
  studentLogout: studentLogout,
  saveProgress: saveProgress,
  setFullName: setFullName,
  adminSignIn: adminSignIn,
  adminSignUp: adminSignUp,
  adminSignOut: adminSignOut,
  onAdminAuth: onAdminAuth,
  adminCreateStudent: adminCreateStudent,
  adminSendPasswordReset: adminSendPasswordReset,
  adminListStudents: adminListStudents,
  adminRenameStudent: adminRenameStudent,
  adminDeleteStudent: adminDeleteStudent,
  superListAdmins: superListAdmins,
  superAddAdmin: superAddAdmin,
  superSetAdminRole: superSetAdminRole,
  superRemoveAdmin: superRemoveAdmin,
  ADMIN_EMAIL: ADMIN_EMAIL
};
window.dispatchEvent(new Event('kidscloud-ready'));
