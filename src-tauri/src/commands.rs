use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileHashResult {
    pub hash: String,
    pub size: u64,
}

#[tauri::command]
pub fn get_vault_path(app: AppHandle) -> Result<String, String> {
    let app_data = app
        .path_resolver()
        .app_data_dir()
        .ok_or("Could not get app data directory")?;
    let vault_path = app_data.join("vault");
    if !vault_path.exists() {
        fs::create_dir_all(&vault_path).map_err(|e| e.to_string())?;
    }
    Ok(vault_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn hash_file(path: String) -> Result<FileHashResult, String> {
    let data = fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    let hash = blake3::hash(&data);
    let size = data.len() as u64;
    Ok(FileHashResult {
        hash: hash.to_hex().to_string(),
        size,
    })
}

#[tauri::command]
pub fn copy_file_to_vault(
    source: String,
    dest_folder: String,
    filename: String,
) -> Result<String, String> {
    let dest_dir = PathBuf::from(&dest_folder);
    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    }
    let dest_path = dest_dir.join(&filename);
    fs::copy(&source, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;
    Ok(dest_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn delete_vault_file(path: String) -> Result<(), String> {
    if PathBuf::from(&path).exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn ensure_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn get_file_size(path: String) -> Result<u64, String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("Failed to get metadata: {}", e))?;
    Ok(metadata.len())
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;
    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            files.push(entry.path().to_string_lossy().to_string());
        }
    }
    Ok(files)
}
