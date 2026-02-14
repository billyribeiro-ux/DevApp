mod commands;
mod db;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Create vault directory on startup
            let app_data = app.path().app_data_dir().expect("Failed to get app data dir");
            let vault_path = app_data.join("vault");
            if !vault_path.exists() {
                std::fs::create_dir_all(&vault_path).expect("Failed to create vault directory");
            }

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
