# AOCAV website

The website of the **Australian Oromo Community Association in Victoria**.

Plain HTML, CSS and JavaScript — no build step, no framework, no server code.
Open `index.html` in a browser and it works.

```
aocav/
  index.html          Home
  about.html          Our story, mission, Gadaa, leadership, public record
  events.html         Full calendar + the Elders Voices spotlight
  get-involved.html   Membership, volunteering, partnerships, support
  contact.html        Addresses, enquiry form, urgent-help numbers
  admin.html          Committee login — add and edit events
  assets/
    style.css         All styling (light + dark mode)
    admin.css         Styling for the admin page only
    events.js         The events, as a plain file (the fallback copy)
    cards.js          How an event card is drawn — shared by both
    store.js          Where events come from: Firebase, or events.js
    app.js            Menu, filters, calendar export, lightbox
    admin.js          The admin console
    firebase-config.js  ← paste your Firebase settings here
  images/
    aocav-logo.png    The association emblem
    elders-voices-flyer.jpg
    og-cover.jpg      The picture shown when a link is shared
  firebase.json  .firebaserc  firestore.rules  storage.rules
  sitemap.xml
  ADMIN-SETUP.md      How to connect the admin page to Firebase
```

## Adding or changing an event

**The easy way** — open `admin.html`, sign in and use the editor. See
`ADMIN-SETUP.md` to switch this on the first time.

**The code way** — open `assets/events.js`, copy one of the blocks, paste it at
the top of the list and change the values. Instructions are at the top of that
file. This is also the fallback the site falls back to if Firebase is ever
unreachable, so it is worth keeping roughly up to date (the admin page has an
**Export events.js** button that writes it for you).

Either way, everything else updates itself: the home page banner, the "Also
coming up" cards, the full calendar, the filters, the "Add to calendar" buttons
and the event information Google reads. Past events move to the bottom
automatically once their date passes — you never need to delete them.

Only one event can be the banner card. Setting it on one clears the others.

## Changing text, photos or contact details

- **Text** lives directly in the `.html` files — search for the words you want
  to change and type over them.
- **Photos** go in `images/`. Replace a file with one of the same name and the
  site picks it up.
- **Email address** — search the project for `info@aocav.com` and replace it.
- **Facebook link** — search for `facebook.com` and put your page URL in.

## Publishing

Upload the contents of this folder to your web host. There is nothing to build
or install.

The pages currently tell search engines their home is `https://www.aocav.com/`.
If you publish somewhere else, search the `.html` files for `www.aocav.com` and
change it to your address.

## Notes for whoever maintains this

- The enquiry forms have no server behind them. They open the visitor's own
  email app with the message already written. Nothing is stored by the website.
- `admin.html` is a public file, as it has to be. What stops strangers editing
  events is `firestore.rules`, which Firebase enforces on its servers — not the
  login screen. Never put a password or private key in this folder; everything
  here is downloaded by every visitor.
- Event titles and descriptions are treated as plain text and escaped before
  being shown, so nothing typed into the admin page can inject code into the
  public site.
- Donations are not handled here on purpose: AOCAV is a registered charity but
  is not endorsed as a deductible gift recipient, and the site says so plainly
  rather than implying donations are tax-deductible.
- Committee members other than the President are described by role rather than
  named, so the page does not go stale after each AGM.
- The site follows the visitor's light or dark system setting automatically.
