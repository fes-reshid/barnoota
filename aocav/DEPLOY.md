# Putting the website live on Firebase

Your Firebase project is **`aocav-e5490`** (display name *aocav*). Deploying
puts the site at:

> **https://aocav-e5490.web.app**

A note on the name: **`aucav.web.app` is not yours.** That is a different,
empty Firebase site, which is why it always showed *"Site Not Found"* no matter
what. Your project is spelled correctly — a-o-c-a-v. See *A shorter address*
below if you want `aocav.web.app` instead of the long default.

**GitHub is not involved in hosting.** You are uploading a folder of files.

---

## The quickest way — all in your browser

Nothing to install. Your code is in a public GitHub repository, so Cloud Shell
can fetch it directly.

1. Open **https://shell.cloud.google.com** and sign in with the **same Google
   account** that owns the Firebase project.

2. Paste these in, one line at a time:

   ```
   rm -rf ~/barnoota
   git clone --branch claude/stoic-bell-wo79sa https://github.com/fes-reshid/barnoota.git
   cd ~/barnoota/aocav
   firebase login --no-localhost
   firebase deploy --only hosting
   ```

   The first line clears any earlier half-finished copy, so you do not end up
   with a clone inside a clone — that would upload the wrong files.

   On the `firebase login` line it prints a long link. Open it, sign in, copy
   the code it gives back, paste it into the shell, press Enter.

   If it says `firebase: command not found`, run `npm install -g firebase-tools`
   first — that works in Cloud Shell without admin rights.

3. The deploy prints:

   ```
   ✔ hosting: found 34 files in .
   ✔ Deploy complete!
   Hosting URL: https://aocav-e5490.web.app
   ```

   Open that address. The website is live.

**To update it later:**

```
cd ~/barnoota && git pull && cd aocav && firebase deploy --only hosting
```

---

## From your own computer instead

Only if you can install software.

```
node --version                      # need a version number; if not, nodejs.org
npm install -g firebase-tools       # Mac may need sudo
firebase login
cd ~/Desktop/aocav                  # wherever you unzipped it
firebase deploy --only hosting
```

---

## If a command gives an error

| Message | What to do |
|---|---|
| `Failed to get Firebase project` / `project not found` | Run `firebase use --add`, pick **aocav** from the menu, deploy again. |
| `Specified site does not exist` | Run `firebase hosting:sites:list` and use a name it shows, or remove the `"site"` line from `firebase.json` to use the project default. |
| `command not found: firebase` | Run `npm install -g firebase-tools`, then try again. |
| `Error: Not in a Firebase project directory` | Wrong folder. `ls` should show `firebase.json`. If not, `cd ~/barnoota/aocav`. |
| `HTTP Error: 403` | Signed in with the wrong Google account. `firebase logout`, then `firebase login` again. |
| It says **0 files** | Wrong folder. `pwd` should end in `/barnoota/aocav`. |

---

## A shorter address, if you want one

The default is `aocav-e5490.web.app`. It works, but it is not pretty.

For a clean **`aocav.web.app`**:

1. Firebase console → **Hosting** → **Add another site**
2. Name it `aocav`
3. In `firebase.json`, add the site back at the top of the hosting block:

   ```json
   "hosting": {
     "site": "aocav",
     "public": ".",
   ```

4. Deploy again.

---

## What is live the moment you deploy

Every page, both languages, the events, the useful links. No further setup.

## What is not working yet

**The admin page.** `/admin.html` shows setup instructions instead of a login
box until you paste your Firebase settings into `assets/firebase-config.js` —
see `ADMIN-SETUP.md`. Until then, events and links are edited in
`assets/events.js` and `assets/links.js`.

---

## Later: pointing aocav.com at it

1. Firebase console → **Hosting** → your site → **Add custom domain**
2. Enter `aocav.com`. Accept the `www` redirect if offered.
3. Firebase shows the DNS records to create — usually one **TXT** to prove
   ownership, then two **A** records.

   **Use the exact values Firebase shows you.** Not ones from a guide or an old
   screenshot; they are specific to your site and they do change.

4. Add them at your registrar, then press **Verify** in Firebase.

Ownership usually verifies within the hour. The certificate can take up to 24
hours after that, and browsers may warn the connection is not private until it
is issued — normal, and it clears by itself.

The `.web.app` address keeps working throughout, so you can keep showing
people.
