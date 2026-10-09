# Connecting the AOCAV admin page to Firebase

The admin page lets committee members add and edit events from a browser
instead of editing code. This guide sets it up once. Allow about 15 minutes.

**The website works right now without any of this.** Until Firebase is
connected the site reads events from `assets/events.js`, and `admin.html`
shows these instructions instead of a login box. Nothing breaks.

---

## Before you start

Check the name of your Firebase site. You mentioned **`aucav.web.app`** — note
that is `a-u-c-a-v`, while the association is **AOCAV** (`a-o-c-a-v`) and your
domain is `aocav.com`. If that was a typo, create a site called `aocav`
instead (Firebase Hosting → Add another site) and change the `"site"` value in
`firebase.json`. If `aucav` is deliberate, leave it as it is.

---

## 1. Turn on the three Firebase services

In the [Firebase console](https://console.firebase.google.com), open your
project.

| Service | Where | What to do |
|---|---|---|
| **Authentication** | Build → Authentication → Get started | Sign-in method → **Email/Password** → Enable → Save |
| **Firestore Database** | Build → Firestore Database → Create database | Choose a location near Australia (`australia-southeast1`). Start in **production mode** — the rules in this folder replace the defaults. |
| **Storage** | Build → Storage → Get started | Only needed if you want to upload event posters from the admin page. Same location. |

## 2. Copy your web config into the code

Firebase console → the gear icon → **Project settings** → scroll to **Your
apps**. If there is no web app yet, click the `</>` icon and register one
(nickname: `AOCAV website`, no hosting checkbox needed here).

Choose **Config** and you will see something like:

```js
const firebaseConfig = {
  apiKey: "AIza…",
  authDomain: "aucav.firebaseapp.com",
  projectId: "aucav",
  storageBucket: "aucav.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123"
};
```

Open `aocav/assets/firebase-config.js` and paste those six values in, replacing
the `PASTE_…` placeholders. **Copy them exactly** — do not guess the
`storageBucket`, as older projects end in `.appspot.com` and newer ones in
`.firebasestorage.app`.

These values are not secret. Every Firebase website publishes them. What
protects your data is step 3.

## 3. Publish the security rules

This is the step that actually protects your events. Without it, Firestore's
default rules will either block the website or (in test mode) let anyone on the
internet edit your events.

Install the Firebase tools once:

```bash
npm install -g firebase-tools
firebase login
```

Then, from inside the `aocav` folder:

```bash
cd aocav
firebase use YOUR_PROJECT_ID          # or edit .firebaserc
firebase deploy --only firestore:rules,storage
```

Alternatively, paste the contents of `firestore.rules` and `storage.rules` into
the **Rules** tab of Firestore and Storage in the console, and press Publish.

What the rules say:

- Anyone may **read** events that are marked as published. Drafts stay private.
- Only someone listed in the `admins` collection may **create, edit or delete**
  an event, or upload a poster.
- Nobody can add themselves to `admins` from the web.

## 4. Create the committee accounts

For each person who should be able to edit events:

1. **Authentication → Users → Add user.** Enter their email and a temporary
   password. (They can change it later with "Forgot your password?" on the
   login screen.)
2. Copy the **User UID** shown in the list — a long string like
   `k3Jd8sLm2nP...`.
3. **Firestore Database → Start collection** → collection ID `admins`.
4. Add a document whose **Document ID is that UID** (paste it; do not press
   "Auto-ID"). Give it one field: `email` (string) with their address, so you
   can tell later who is who.

Repeat step 4 for each extra person. Removing someone's access later is just
deleting their document from `admins`.

## 5. Move your events into Firebase

Open `admin.html`, sign in, and press **Import bundled events**. That copies
the events currently in `assets/events.js` into Firestore, once. From then on,
the admin page is in charge and `events.js` is only a fallback.

Keep the fallback fresh now and then: press **Export events.js**, and replace
`aocav/assets/events.js` in GitHub with the downloaded file. That way the site
still shows the right events if Firebase is ever unreachable.

## 6. Publish the website

From inside the `aocav` folder:

```bash
firebase deploy --only hosting
```

Your site appears at `https://<your-site>.web.app`. To use `aocav.com`
instead: Hosting → Add custom domain, and follow the DNS instructions.

If you publish through GitHub Pages rather than Firebase Hosting, nothing
changes — the admin page talks to Firebase directly from the browser, so it
works on any host.

---

## Day-to-day use

Go to `/admin.html` on your site and sign in. There are three tabs.

### Events

- **New** — add an event. The name, a date and a venue are enough.
- Click any event in the left-hand list to edit it. The preview on the right is
  exactly what visitors will see.
- **Visible on the website** — turn it off to keep an event as a draft.
- **Make this the banner event** — the big card at the top of the home and
  events pages. Turning it on for one event turns it off for the others.
- **Ctrl+S** (or **Cmd+S**) saves.
- Deleting asks first, and cannot be undone.

- **YouTube link** — paste any YouTube address. The card shows a picture with a
  play button and only loads YouTube when someone presses it.
- **Photos** — add as many as you like. Tap the × on one to remove it.
- **Afaan Oromoo** — optional translations for that event. Blank means English.

Past events sort themselves to the bottom once their date passes. You never
need to delete them.

### Website text

Every phrase on every page, found automatically. For each one you get the words
the page shows now, a box to change the English, and a box for the Afaan
Oromoo. Tick **Needs translating** to see only what still has no translation.
Changes are not live until you press **Save changes**.

Over 400 phrases are listed. Do not try to do them in one sitting — the English
keeps showing wherever a translation is missing, so a half-finished translation
never looks broken.

### Links

The government and community services on `links.html`. Each one has a name, a
description, a web address and/or a phone number, a section, and optional Afaan
Oromoo wording. Press **Import bundled links** once to load the starting set.

Only `https://` addresses are accepted. Please check a link still works before
you add it.

---

## If something goes wrong

| What you see | What it means |
|---|---|
| The setup instructions instead of a login box | `firebase-config.js` still has `PASTE_…` placeholders in it. |
| "That email and password do not match" | Wrong password, or the account was never created in Authentication → Users. |
| "Firebase refused that. Your account is probably not in the admins collection" | Step 4 is missing or the document ID is not exactly the user's UID. |
| "Email sign-in is switched off" | Authentication → Sign-in method → enable Email/Password. |
| The upload button fails | Storage is not enabled, or `storage.rules` was never published. |
| The website shows old events | Press **Export events.js** and replace `assets/events.js`, or check that the events are marked visible. |
| The Website text tab is empty | It reads the real pages over the network. Make sure you opened the admin page from your website, not from a file on your computer. |
| A translation did not appear | Press **Save changes**, then reload the public page and switch to AFO. |

---

## A note on security

Anyone can open `admin.html` — it is a public file. That is fine and normal.
The login screen is a convenience; the real protection is `firestore.rules`,
which Firebase enforces on its own servers. As long as those rules are
published, a stranger who opens the admin page can look at the login box and
nothing else.

Two things to keep true:

- Never put a password, API secret or private key in any file in this folder.
  Everything here is downloaded by every visitor.
- Keep the `admins` list short, and remove people when they leave the
  committee.
