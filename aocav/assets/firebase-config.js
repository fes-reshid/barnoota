/* ==========================================================================
   AOCAV — Firebase connection settings
   --------------------------------------------------------------------------
   PASTE YOUR FIREBASE CONFIG BELOW.

   Where to find it:
     1. Go to https://console.firebase.google.com and open your project
     2. Click the gear icon (top left) -> Project settings
     3. Scroll down to "Your apps" -> the web app (</> icon)
     4. Choose "Config" — you will see a block that looks exactly like the one
        below. Copy the values across.

   These values are NOT secret. Google designs them to be public and every
   Firebase website on the internet ships them in plain sight. What keeps your
   data safe is the security rules in firestore.rules and storage.rules, which
   only let signed-in committee members write anything.

   UNTIL YOU FILL THIS IN the website still works perfectly — it simply reads
   the events from assets/events.js instead, and the admin page shows setup
   instructions rather than a login box.
   ========================================================================== */

window.AOCAV_FIREBASE = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "PASTE_YOUR_PROJECT_ID",
  storageBucket:     "PASTE_YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId:             "PASTE_YOUR_APP_ID"
};
