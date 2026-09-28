# Audio editor tests

Browser tests for `audio-editor/`, run with Playwright in Chromium, Firefox and WebKit (Safari's engine),
plus phone profiles (Pixel 5, iPhone 13). GitHub Actions runs them on every pull request that changes the editor
(`.github/workflows/audio-editor-tests.yml`).

```sh
cd audio-editor/tests
npm ci
npx playwright install --with-deps   # first time only
npm test                             # all browsers
npx playwright test --project=chromium
```

The tests serve the repository root on port 8765 (like GitHub Pages) and make their own audio, so there
are no sound files in the repo. Downloads from CDNs (speech model, AI noise remover) are not needed: the
transcript test uses a stand-in model.
