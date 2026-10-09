# Putting the website online

**You do not need GitHub for any of this.** The website is just a folder of
files. Whichever way you choose, you are uploading that folder.

`aucav.web.app` currently says **Site Not Found**. That is normal — the site
exists in Firebase, but nothing has been uploaded to it yet. The page even says
so: *"You haven't deployed an app yet."* Once you do the upload below, that
message is replaced by the website.

---

## Option A — a link to share in two minutes, nothing to install

Best if you just want to show the committee today, or if your computer will not
let you install software.

1. Unzip the file so you have a folder called **`aocav`** on your Desktop.
2. Go to **https://app.netlify.com/drop**
3. Drag the whole **`aocav` folder** onto that page.

You get a public link straight away, something like
`https://quiet-tree-12345.netlify.app`. Send that to anyone.

It is free, and you can claim the site later to give it a nicer name. This does
not touch your Firebase project, so you can still do Option B afterwards.

---

## Option B — your own Firebase address, `aucav.web.app`

This is the proper home for the site. It needs a terminal, once.

### 1. Check you have Node.js

Open Terminal (Mac) or Command Prompt (Windows) and type:

```
node --version
```

If you get a version number like `v20.11.0`, carry on. If it says the command
is not found, install it first from **https://nodejs.org** (choose the LTS
version), then close and reopen the terminal.

> On a work computer you may not be allowed to install Node.js. If so, use
> Option A instead — it does the same job.

### 2. Install the Firebase tool

```
npm install -g firebase-tools
```

On Mac you may need `sudo npm install -g firebase-tools` and your password.

### 3. Sign in to Firebase

```
firebase login
```

A browser window opens. Sign in with the same Google account you used to make
the Firebase project, and allow access.

### 4. Go into the folder and upload

Replace the path below with wherever you unzipped the folder:

```
cd ~/Desktop/aocav
firebase deploy --only hosting
```

Windows users, the folder line looks more like:

```
cd C:\Users\YourName\Desktop\aocav
```

After a minute it prints:

```
Hosting URL: https://aucav.web.app
```

Open that and your website is live.

### If step 4 gives an error

| Message | What to do |
|---|---|
| `Failed to get Firebase project aucav` or `project not found` | Your project has a different name from the site. Run `firebase projects:list`, find the **Project ID**, then run `firebase use THAT-ID` and try the deploy again. |
| `Specified site does not exist` | Run `firebase hosting:sites:list` to see the real site name, then open `firebase.json` and change `"site": "aucav"` to that name. |
| `command not found: firebase` | Step 2 did not finish. Close the terminal, open it again, and retry. |
| `Error: Not in a Firebase project directory` | You are in the wrong folder. Make sure `cd` took you to the folder that contains `firebase.json`. |

---

## The name is staying as `aucav`

That is settled — nothing to change. `aucav.web.app` is only Firebase's own
address for the site. Once `aocav.com` points at it (next section), that is the
address you give people, and the spelling of the Firebase one stops mattering.

The pages already tell search engines their proper home is
`https://www.aocav.com/`, so nothing needs editing when the domain goes live.

---

## Pointing aocav.com at the site

Do this once the site is uploaded.

1. Firebase console → **Hosting** → select the **aucav** site → **Add custom
   domain**
2. Enter `aocav.com`. Tick the option to also redirect `www.aocav.com` if it
   offers it.
3. Firebase shows you the DNS records to create — usually one **TXT** record to
   prove you own the domain, then two **A** records.

   **Use the exact values Firebase shows you.** Do not copy them from a guide or
   an old screenshot; they are specific to your site and they do change.

4. Add those records wherever you bought `aocav.com` (the registrar's control
   panel, under DNS or Name Servers).
5. Back in Firebase, press **Verify**.

Then wait. Ownership usually verifies within an hour. The security certificate
can take up to 24 hours after that — until it is issued the browser may warn
that the connection is not private. That is normal and clears by itself.

While you wait, `aucav.web.app` keeps working, so you can still show people.

---

## What works the moment it is live

- Every page, both languages, the events, the links — all of it. No setup.

## What does not work yet

- **The admin page.** Opening `/admin.html` shows setup instructions instead of
  a login box until you paste your Firebase settings into
  `assets/firebase-config.js`. Follow `ADMIN-SETUP.md` when you are ready. Until
  then, events and links are edited in `assets/events.js` and `assets/links.js`.

## Updating the site later

Change the files, then run `firebase deploy --only hosting` again — or drag the
folder onto Netlify Drop again. There is nothing to rebuild.
