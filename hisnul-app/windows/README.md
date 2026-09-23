# Hisnul Muslim - Windows desktop app

An Electron shell around the same web app in `../../hisnul-muslim`, the same
idea as the Android/iOS Capacitor wrappers in `../android` and `../ios` but
for Windows desktop.

## Building

```sh
npm install
npm run dist:win
```

`npm run dist:win` runs `sync.js` first (copies `../../hisnul-muslim` into
`./www`, the same role `npx cap sync` plays for the mobile wrappers) and then
produces two files under `dist/`:

- `Hisnul Muslim Setup <version>.exe` - a normal NSIS installer (Start Menu
  shortcut, uninstaller, lets the user pick the install directory).
- `Hisnul Muslim <version>.exe` - a portable build, no installation needed.

Never edit anything under `./www` directly - it's regenerated from
`../../hisnul-muslim` and gitignored, same reasoning as
`../android/app/src/main/assets/public/`.

## Building on Linux

Building a Windows target from Linux needs Wine (both `wine32:i386` and
`wine64`/`wine`) for `electron-builder` to inject the icon/version info into
the `.exe` and to run `makensis` for the installer:

```sh
dpkg --add-architecture i386 && apt-get update
apt-get install -y wine64 wine wine32:i386
```

## Code signing

The current build is **unsigned** - Windows SmartScreen will show an
"Unknown publisher" warning on first run (users need to click "More info" ->
"Run anyway"). Getting rid of that requires buying a code-signing
certificate (EV certs avoid the warning immediately; a standard OV cert
still shows the warning until the app has enough install reputation with
Microsoft). Not set up yet.

## Icon

`build/icon.ico` is generated from `../../hisnul-muslim/icons/icon-512.png`,
resized down to the classic NSIS-friendly sizes (16/32/48/64/128 as raw
bitmaps, 256 as the modern PNG-compressed frame) - a naive single-source
`.ico` conversion produces a file NSIS's old icon loader rejects with
"invalid icon file size".
