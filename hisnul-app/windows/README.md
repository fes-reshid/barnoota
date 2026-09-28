# Hisnul Muslim - Windows desktop app

A Tauri shell around the same web app in `../../hisnul-muslim`, the same idea
as the Android/iOS Capacitor wrappers in `../android` and `../ios` but for
Windows desktop. Uses Windows' built-in WebView2 runtime instead of bundling
a whole Chromium (unlike Electron), which is why the whole app - code plus
the entire local audio library - fits in a single ~68MB portable `.exe`
instead of ~130MB.

`src-tauri/tauri.conf.json`'s `build.frontendDist` points straight at
`../../../hisnul-muslim` - there's no separate synced copy step like the
mobile wrappers' `npx cap sync` or the old Electron build's `sync.js`, Tauri
embeds whatever that path contains directly into the compiled binary.

## Building

```sh
npm install
npm run dist:win
```

This produces a single self-contained binary:
`src-tauri/target/x86_64-pc-windows-gnu/release/hisnul-muslim-desktop.exe`

No installer is built - `npm run dist:win` requests an NSIS bundle
(`--bundles nsis`), but that step fails when cross-compiling from Linux (see
below), and the raw exe is already portable (no separate resource folder to
ship alongside it), so a plain double-click-to-run file is what actually
gets published - see `../../downloads/Hisnul-Muslim-Windows.exe`, which is a
manually-copied snapshot of that build output (re-copy it there after every
`npm run dist:win` if you want the website's download link to serve the new
version - there's no CI here to automate that step).

## Building on Linux

Cross-compiling to Windows from Linux needs `mingw-w64` for the linker and
the Rust `x86_64-pc-windows-gnu` target:

```sh
apt-get install -y mingw-w64 mingw-w64-tools
update-alternatives --set x86_64-w64-mingw32-gcc /usr/bin/x86_64-w64-mingw32-gcc-posix
update-alternatives --set x86_64-w64-mingw32-g++ /usr/bin/x86_64-w64-mingw32-g++-posix
rustup target add x86_64-pc-windows-gnu
```

(The `update-alternatives --set ... -posix` step matters - Rust's std needs
the POSIX threading model variant of the mingw-w64 toolchain, not the
default win32/single-threaded one Ubuntu's `mingw-w64` package points at.)

### Why there's no NSIS installer

Tauri's NSIS bundler needs to run the real Windows `makensis.exe` (via Wine)
rather than a native Linux NSIS build, because its installer script loads a
Windows-only plugin DLL (`nsis_tauri_utils.dll`) that a Linux ELF `makensis`
can't `dlopen`. Getting an actual Windows NSIS binary onto this build
machine would mean downloading it from nsis.sourceforge.io, which isn't
reachable from this sandbox's restricted network - so installer bundling is
left for whenever this is built on a real Windows machine or CI runner
instead (`npm run dist:win` would then also produce
`src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/*.exe`).

## Code signing

The current build is **unsigned** - Windows SmartScreen will show an
"Unknown publisher" warning on first run (users need to click "More info" ->
"Run anyway"). Getting rid of that requires buying a code-signing
certificate (EV certs avoid the warning immediately; a standard OV cert
still shows the warning until the app has enough install reputation with
Microsoft). Not set up yet.

## Icons

`src-tauri/icons/` holds the icon set Tauri's bundler expects (`32x32.png`,
`128x128.png`, `128x128@2x.png`, `icon.ico`, `icon.png`), all generated from
`../../hisnul-muslim/icons/icon-512.png`. `icon.ico` in particular needs to
be a properly multi-resolution file (16/32/48/64/128 as raw bitmap frames,
256 as a PNG-compressed frame) - a naive single-source `.ico` conversion
produces a file NSIS's icon loader rejects with "invalid icon file size".
