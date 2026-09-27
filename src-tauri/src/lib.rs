use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

struct AppState {
    child_process: Mutex<Option<Child>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        child_process: Mutex::new(None),
    };

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            // 1. Setup logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 2. Start the local background engine silently
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

            // 3. Create System Tray Menu (PRD requirement for persistent background automation)
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
        // 4. Intercept window close event: minimize to tray instead of quitting
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
