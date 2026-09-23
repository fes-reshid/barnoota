// Desktop shell for the Hisnul Muslim web app (see ../../hisnul-muslim) -
// mirrors what the Android/iOS Capacitor wrappers do for mobile, just with
// Electron's BrowserWindow instead of a WebView. The window is sized like a
// phone screen since the app's UI is mobile-first (bottom nav, single
// column), not a desktop layout.
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 430,
    height: 860,
    minWidth: 360,
    minHeight: 600,
    title: "Hisnul Muslim",
    icon: path.join(__dirname, "build", "icon.ico"),
    autoHideMenuBar: true,
    backgroundColor: "#0f5132",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);

  // Keep external links (mailto:, privacy policy target=_blank, etc.) out of
  // the app window and opened in the system's default browser instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadFile(path.join(__dirname, "www", "index.html"), { hash: "/home" });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
