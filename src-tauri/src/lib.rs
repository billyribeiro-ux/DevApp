mod commands;
mod db;
mod error;
mod validation;

use tauri::Manager;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tracing subscriber for structured logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(if cfg!(debug_assertions) {
            Level::DEBUG
        } else {
            Level::INFO
        })
        .with_target(false)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .finish();

    tracing::subscriber::set_global_default(subscriber).expect("Failed to set tracing subscriber");

    info!("Starting DevVault application");

    let migrations = db::get_migrations();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:devvault.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            info!("Running application setup");

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Create vault directory on startup
            let app_data = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            let vault_path = app_data.join("vault");
            if !vault_path.exists() {
                info!("Creating vault directory: {:?}", vault_path);
                std::fs::create_dir_all(&vault_path).expect("Failed to create vault directory");
            }

            info!("Application setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_vault_path,
            commands::hash_file,
            commands::copy_file_to_vault,
            commands::delete_vault_file,
            commands::ensure_directory,
            commands::read_file_bytes,
            commands::get_file_size,
            commands::list_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
