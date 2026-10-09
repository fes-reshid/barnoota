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
  assets/
    style.css         All styling (light + dark mode)
    events.js         ← THE ONLY FILE YOU EDIT TO CHANGE EVENTS
    app.js            Menu, filters, calendar export, lightbox
  images/
    aocav-logo.png    The association emblem
    elders-voices-flyer.jpg
    og-cover.jpg      The picture shown when a link is shared
  sitemap.xml
```

## Adding or changing an event

Open `assets/events.js`. Copy one of the blocks, paste it at the top of the list
and change the values. Instructions are written at the top of that file.

Everything else updates itself: the home page banner, the "Also coming up"
cards, the full calendar, the filters, the "Add to calendar" buttons and the
event information Google reads. Past events move to the bottom automatically
once their date passes — you never need to delete them.

Set `featured: true` on **one** event only. That is the big banner card.

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
- Donations are not handled here on purpose: AOCAV is a registered charity but
  is not endorsed as a deductible gift recipient, and the site says so plainly
  rather than implying donations are tax-deductible.
- Committee members other than the President are described by role rather than
  named, so the page does not go stale after each AGM.
- The site follows the visitor's light or dark system setting automatically.
