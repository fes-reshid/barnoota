// Copies ../../hisnul-muslim (the single source of truth for the web app)
// into ./www, the same way `npx cap sync` refreshes android/app/src/main/
// assets/public and ios/App/App/public for the mobile wrappers. Run before
// every `npm start` / `npm run dist:win` - never edit anything under www/
// directly, it's regenerated and gitignored.
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "hisnul-muslim");
const dest = path.join(__dirname, "www");

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Synced hisnul-muslim -> " + dest);
