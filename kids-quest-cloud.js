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

/* The one real inbox every kid account's login email resolves to.
   Change this one line if the admin's email is different. */
const ADMIN_EMAIL = "fesbackups@gmail.com";
const ADMIN_LOCAL = ADMIN_EMAIL.split('@')[0];
const ADMIN_DOMAIN = ADMIN_EMAIL.split('@')[1];

const STUDENTS_COLLECTION = 'kids_quest_students';

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

/* ===================== Student-facing API ===================== */

/* Logs a child in with their plain username + password. Resolves with
   the Firestore profile doc (creating a blank one on first-ever login,
   in case an admin-created account hasn't been touched yet). */
function studentLogin(username, password){
  const email = usernameToEmail(username);
  return signInWithEmailAndPassword(auth, email, password)
    .then(function(cred){
      return ensureStudentDoc(cred.user, username).then(function(data){
        return { uid: cred.user.uid, username: data.username, progress: data.progress || {} };
      });
    });
}

function ensureStudentDoc(user, usernameHint){
  const ref = doc(db, STUDENTS_COLLECTION, user.uid);
  return getDoc(ref).then(function(snap){
    if(snap.exists()) return snap.data();
    const data = {
      username: normalizeUsername(usernameHint || user.email),
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
      cb({ uid: user.uid, username: data.username, progress: data.progress || {} });
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

/* ===================== Admin-facing API ===================== */
/* All admin calls require being signed in to the SAME Firebase project
   as ADMIN_EMAIL — enforced again server-side by the Firestore rules
   the project owner must add (see kids-admin.html for the exact text). */

function adminSignIn(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}
function adminSignOut(){ return signOut(auth); }
function onAdminAuth(cb){
  return onAuthStateChanged(auth, function(user){
    cb(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? user : null);
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
            createdBy: ADMIN_EMAIL,
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
              createdBy: ADMIN_EMAIL,
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
  adminSignIn: adminSignIn,
  adminSignOut: adminSignOut,
  onAdminAuth: onAdminAuth,
  adminCreateStudent: adminCreateStudent,
  adminSendPasswordReset: adminSendPasswordReset,
  adminListStudents: adminListStudents,
  adminRenameStudent: adminRenameStudent,
  adminDeleteStudent: adminDeleteStudent,
  ADMIN_EMAIL: ADMIN_EMAIL
};
window.dispatchEvent(new Event('kidscloud-ready'));
