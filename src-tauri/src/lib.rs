use std::io::{Read, Write};
use std::process::Child;
#[cfg(not(debug_assertions))]
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg(all(target_os = "windows", not(debug_assertions)))]
use std::os::windows::process::CommandExt;

struct AppState {
    child_process: Mutex<Option<Child>>,
}

/// Poll the backend /health endpoint until it responds, up to `timeout` total.
/// Returns true when the backend is ready, false on timeout.
fn wait_for_backend_ready(timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    let mut last_err = String::from("never attempted");

    while Instant::now() < deadline {
        // Fresh TCP connection each attempt so a not-yet-bound port fails fast.
        match std::net::TcpStream::connect_timeout(
            &"127.0.0.1:3000".parse().expect("valid addr"),
            Duration::from_millis(1500),
        ) {
            Ok(mut stream) => {
                // Port is open; verify it is actually our API with a raw HTTP/1.0 GET.
                let req = b"GET /health HTTP/1.0\r\nHost: 127.0.0.1:3000\r\n\r\n";
                if stream.write_all(req).is_ok() {
                    let mut buf = [0u8; 512];
                    let read_len = stream.read(&mut buf).unwrap_or(0);
                    let body = String::from_utf8_lossy(&buf[..read_len]);
                    if body.contains("200") || body.contains("\"status\"") {
                        return true;
                    }
                    last_err = format!("health check returned: {}", body.lines().next().unwrap_or("empty"));
                } else {
                    last_err = String::from("failed writing health request");
                }
            }
            Err(e) => {
                last_err = format!("connect failed: {}", e);
            }
        }
        std::thread::sleep(Duration::from_millis(500));
    }

    log::error!("Backend not ready after {:?}: {}", timeout, last_err);
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        child_process: Mutex::new(None),
    };

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            // 1. Logging: always enabled (file logs in release too, so future
            //    desktop failures leave a diagnostic trail instead of failing silently).
            let mut log_builder = tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: Some("whatsaman".into()) }),
                ]);
            if cfg!(debug_assertions) {
                log_builder = log_builder.level(log::LevelFilter::Debug);
            }
            app.handle().plugin(log_builder.build())?;

            // 2. Start the local background engine silently in release mode.
            // In debug mode, beforeDevCommand already starts the backend server.
            #[cfg(not(debug_assertions))]
            {
                #[cfg(target_os = "windows")]
                {
                    const CREATE_NO_WINDOW: u32 = 0x08000000;
                    let mut cmd = Command::new("node");
                    cmd.arg("dist/index.js");
                    cmd.creation_flags(CREATE_NO_WINDOW);

                    match cmd.spawn() {
                        Ok(child) => {
                            let state = app.state::<AppState>();
                            if let Ok(mut lock) = state.child_process.lock() {
                                *lock = Some(child);
                            }
                            log::info!("WhatsApp Local Core engine started silently in background");
                        }
                        Err(e) => {
                            log::warn!("Could not auto-start node backend: {}. (If already running or compiled, ignore).", e);
                        }
                    }
                }
                #[cfg(not(target_os = "windows"))]
                {
                    let mut cmd = Command::new("node");
                    cmd.arg("dist/index.js");
                    match cmd.spawn() {
                        Ok(child) => {
                            let state = app.state::<AppState>();
                            if let Ok(mut lock) = state.child_process.lock() {
                                *lock = Some(child);
                            }
                            log::info!("WhatsApp Local Core engine started in background");
                        }
                        Err(e) => {
                            log::warn!("Could not auto-start node backend: {}.", e);
                        }
                    }
                }
            }

            #[cfg(debug_assertions)]
            {
                log::info!("WhatsApp Local Core engine running via beforeDevCommand in debug mode");
            }

            // 3. FIX for the blank-window bug: the webview previously loaded the bundled
            //    frontendDist assets with a tauri:// origin, so every relative fetch('/api/...')
            //    went to the wrong origin and the UI rendered permanently empty.
            //    Now the window navigates to the Express server itself (same origin as the
            //    API), and we only navigate once /health actually responds.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
                let backend_ready = wait_for_backend_ready(Duration::from_secs(30));
                if backend_ready {
                    let url = "http://127.0.0.1:3000/";
                    log::info!("Backend healthy; navigating window to {}", url);
                    if let Err(e) = window.navigate(url.parse().expect("valid url")) {
                        log::error!("Failed to navigate to backend URL: {}", e);
                        let _ = window.show();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                } else {
                    // Fail loudly with a native dialog instead of showing a blank window forever.
                    log::error!("Backend engine did not become ready within 30s");
                    let _ = rfd::MessageDialog::new()
                        .set_title("WhatsAman")
                        .set_description(
                            "Gagal menjalankan engine lokal (backend) dalam 30 detik.\n\n\
                             Kemungkinan penyebab:\n\
                             \u{2022} Node.js tidak ditemukan di sistem ini\n\
                             \u{2022} Port 3000 sudah dipakai aplikasi lain\n\
                             \u{2022} Antivirus memblokir proses engine\n\n\
                             Silakan jalankan server manual (npm start) lalu buka http://127.0.0.1:3000 di browser.\n\
                             Detail tersedia di file log aplikasi.",
                        )
                        .set_buttons(rfd::MessageButtons::Ok)
                        .set_level(rfd::MessageLevel::Error)
                        .show();
                    // Still show the window (its static page will show a clear error state
                    // rather than nothing), but do not navigate away from the bundled page.
                    let _ = window.show();
                }
            }

            // 4. Create System Tray Menu (PRD requirement for persistent background automation)
            let quit_i = MenuItem::with_id(app, "quit", "Keluar Aplikasi", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Buka Dashboard", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Sembunyikan ke Tray", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("WhatsApp Local Hub — Automation Active")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        // Kill child process before exit
                        let state = app.state::<AppState>();
                        if let Ok(mut lock) = state.child_process.lock() {
                            if let Some(mut child) = lock.take() {
                                let _ = child.kill();
                            }
                        }
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // 5. Intercept window close event: minimize to tray instead of quitting
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
