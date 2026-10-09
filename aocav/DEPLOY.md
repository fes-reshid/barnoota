# Putting the website live on Firebase

The target is **https://aucav.web.app**.

It currently says *"Site Not Found"* because the site exists in Firebase but
nothing has been uploaded to it yet. The page says so itself: *"You haven't
deployed an app yet."* One upload replaces that with the website.

**GitHub is not involved.** You are uploading a folder of files.

## The quickest way — all in your browser, 4 lines

Nothing to install, no zip to upload, no Netlify. Your code is already on
GitHub in a public repository, so Cloud Shell can fetch it directly.

1. Open **https://shell.cloud.google.com** and sign in with the **same Google
   account** that owns the Firebase project. Click **Continue** if it offers to
   start the machine.

2. Paste these four lines in, one at a time:

   ```
   git clone --branch claude/stoic-bell-wo79sa https://github.com/fes-reshid/barnoota.git
   cd barnoota/aocav
   firebase login --no-localhost
   firebase deploy --only hosting
   ```

   On the third line it prints a long link. Open it, sign in, copy the code it
   gives back, paste it into the shell and press Enter.

   If it says `firebase: command not found`, run `npm install -g firebase-tools`
   first — that works in Cloud Shell without any admin rights.

3. The last line finishes with:

   ```
   Hosting URL: https://aucav.web.app
   ```

   Open it. The website is live.

**To update it later**, come back to Cloud Shell and run:

```
cd ~/barnoota && git pull && cd aocav && firebase deploy --only hosting
```

---

Or pick whichever other route suits your computer:

- **Route 1 — your own computer.** Needs Node.js installed.
- **Route 2 — Cloud Shell with the zip**, if you would rather upload the folder
  than pull it from GitHub.

Every route ends in the same place.

---

## Route 1 — from your own computer

### 1. Check for Node.js

Open Terminal (Mac) or Command Prompt (Windows):

```
node --version
```

A version number like `v20.11.0` means you are set. "Command not found" means
install it from **https://nodejs.org** (the LTS button), then close and reopen
the terminal. If you are not allowed to install it, skip to Route 2.

### 2. Install the Firebase tool

```
npm install -g firebase-tools
```

Mac may need `sudo npm install -g firebase-tools` and your password.

### 3. Sign in

```
firebase login
```

A browser opens. Use the **same Google account** that owns the Firebase
project, and allow access.

### 4. Go to the folder and upload

Unzip the website first, then point the terminal at that folder:

```
cd ~/Desktop/aocav
firebase deploy --only hosting
```

Windows looks more like `cd C:\Users\YourName\Desktop\aocav`.

A minute later it prints:

```
Hosting URL: https://aucav.web.app
```

Open it. You are live.

---

## Route 2 — Google Cloud Shell, nothing to install

A free Linux terminal that runs in your browser, on your Google account. The
Firebase tool is already there.

1. Go to **https://shell.cloud.google.com** and sign in with the **same Google
   account** that owns the Firebase project. Click **Continue** if it asks to
   start the machine.

2. Upload the website zip: the **⋮** (three dots) menu at the top right of the
   shell → **Upload** → **File** → choose `aocav-website.zip`. It lands in your
   home folder.

3. In the shell, type:

   ```
   unzip aocav-website.zip
   cd aocav
   ```

4. Sign in to Firebase:

   ```
   firebase login --no-localhost
   ```

   It prints a long link. Open it, sign in, copy the code it gives you, paste
   it back into the shell and press Enter.

   If it says `firebase: command not found`, run
   `npm install -g firebase-tools` first — it works here without any admin
   rights.

5. Upload:

   ```
   firebase deploy --only hosting
   ```

   It prints `Hosting URL: https://aucav.web.app`. Done.

Cloud Shell wipes itself after a while of not being used. That does not affect
the website — once deployed, it stays up.

---

## If a command gives an error

| Message | What to do |
|---|---|
| `Failed to get Firebase project aucav` / `project not found` | The project has a different name from the site. Run `firebase projects:list`, find the **Project ID**, run `firebase use THAT-ID`, deploy again. |
| `Specified site does not exist` | Run `firebase hosting:sites:list`, then open `firebase.json` and change `"site": "aucav"` to the name it shows. |
| `command not found: firebase` | The install did not finish. Close the terminal, reopen, try again. |
| `Error: Not in a Firebase project directory` | Wrong folder. `ls` should show `firebase.json`. If not, `cd` into the folder that does. |
| `HTTP Error: 403` | Signed in with the wrong Google account. `firebase logout`, then `firebase login` again. |

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

Do this once the site is up and you have access to your domain's DNS.

1. Firebase console → **Hosting** → the **aucav** site → **Add custom domain**
2. Enter `aocav.com`. Accept the `www` redirect if offered.
3. Firebase shows the DNS records to create — usually one **TXT** to prove
   ownership, then two **A** records.

   **Use the exact values Firebase shows you.** Not ones from a guide or an old
   screenshot; they are specific to your site and they do change.

4. Add them at your registrar, then press **Verify** in Firebase.

Ownership usually verifies within the hour. The security certificate can take
up to 24 hours after that, and browsers may warn the connection is not private
until it is issued — normal, and it clears by itself.

`aucav.web.app` keeps working throughout, so you can keep showing people.

---

## Updating the site later

Change the files, run `firebase deploy --only hosting` again. Nothing to
rebuild.
