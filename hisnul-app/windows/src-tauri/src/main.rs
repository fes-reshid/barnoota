// Desktop shell for the Hisnul Muslim web app (see ../../../hisnul-muslim) -
// same role as the Android/iOS Capacitor wrappers and the window itself
// (size/title/icon) is fully described in tauri.conf.json; there's nothing
// app-specific to do here since the web app doesn't need any native Rust
// commands.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Hisnul Muslim");
}
