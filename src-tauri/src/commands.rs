use crate::error::{CommandError, CommandResult};
use crate::validation::{
    sanitize_filename, validate_file_extension, validate_file_size, validate_filename,
    validate_path,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tracing::{info, warn};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileHashResult {
    pub hash: String,
    pub size: u64,
}

/// Get the vault path, creating it if it doesn't exist
#[tauri::command]
pub fn get_vault_path(app: AppHandle) -> CommandResult<String> {
    info!("Getting vault path");

    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| CommandError::OperationFailed(format!("Failed to get app data dir: {}", e)))?;

    let vault_path = app_data.join("vault");

    if !vault_path.exists() {
        info!("Creating vault directory: {:?}", vault_path);
        fs::create_dir_all(&vault_path)?;
    }

    Ok(vault_path.to_string_lossy().to_string())
}

/// Hash a file using Blake3 and return hash + size
#[tauri::command]
pub fn hash_file(path: String, app: AppHandle) -> CommandResult<FileHashResult> {
    info!("Hashing file: {}", path);

    // Get vault path for validation
    let vault_path = get_vault_base_path(&app)?;

    // Validate path
    let validated_path = validate_path(&path, &vault_path)?;

    // Check if file exists
    if !validated_path.exists() {
        return Err(CommandError::FileNotFound(path));
    }

    // Validate file size via metadata BEFORE loading into memory
    let metadata = fs::metadata(&validated_path)?;
    validate_file_size(metadata.len())?;

    // Read and hash file
    let data = fs::read(&validated_path)?;
    let size = data.len() as u64;

    let hash = blake3::hash(&data);

    info!("File hashed successfully: {} bytes", size);

    Ok(FileHashResult {
        hash: hash.to_hex().to_string(),
        size,
    })
}

/// Copy a file to the vault with validation
#[tauri::command]
pub fn copy_file_to_vault(
    source: String,
    dest_folder: String,
    filename: String,
    app: AppHandle,
) -> CommandResult<String> {
    info!(
        "Copying file to vault: {} -> {}/{}",
        source, dest_folder, filename
    );

    // Validate filename
    let validated_filename = validate_filename(&filename)?;
    validate_file_extension(&validated_filename)?;
    let safe_filename = sanitize_filename(&validated_filename);

    // Get vault path
    let vault_path = get_vault_base_path(&app)?;

    // Validate destination folder
    let dest_dir = validate_path(&dest_folder, &vault_path)?;

    // Create destination directory if needed
    if !dest_dir.exists() {
        info!("Creating destination directory: {:?}", dest_dir);
        fs::create_dir_all(&dest_dir)?;
    }

    // Validate source file — canonicalize to resolve symlinks and prevent traversal
    let source_path = PathBuf::from(&source)
        .canonicalize()
        .map_err(|_| CommandError::FileNotFound(source.clone()))?;
    if !source_path.is_file() {
        return Err(CommandError::InvalidPath(
            "Source must be a regular file".to_string(),
        ));
    }

    // Check source file size
    let metadata = fs::metadata(&source_path)?;
    validate_file_size(metadata.len())?;

    // Copy file
    let dest_path = dest_dir.join(&safe_filename);
    fs::copy(&source_path, &dest_path)?;

    info!("File copied successfully to: {:?}", dest_path);

    Ok(dest_path.to_string_lossy().to_string())
}

/// Delete a file from the vault
#[tauri::command]
pub fn delete_vault_file(path: String, app: AppHandle) -> CommandResult<()> {
    info!("Deleting vault file: {}", path);

    // Get vault path for validation
    let vault_path = get_vault_base_path(&app)?;

    // Validate path
    let validated_path = validate_path(&path, &vault_path)?;

    if validated_path.exists() {
        fs::remove_file(&validated_path)?;
        info!("File deleted successfully");
    } else {
        warn!("File not found, skipping deletion: {}", path);
    }

    Ok(())
}

/// Ensure a directory exists in the vault
#[tauri::command]
pub fn ensure_directory(path: String, app: AppHandle) -> CommandResult<()> {
    info!("Ensuring directory exists: {}", path);

    // Reject path traversal sequences before any path construction
    if path.contains("..") {
        return Err(CommandError::PathTraversal(format!(
            "Path contains '..' which is not allowed: {}",
            path
        )));
    }

    // Get vault path for validation
    let vault_path = get_vault_base_path(&app)?;

    // Only allow relative paths within the vault — reject absolute paths
    let path_buf = PathBuf::from(&path);
    if path_buf.is_absolute() {
        return Err(CommandError::PathTraversal(format!(
            "Absolute paths are not allowed: {}",
            path
        )));
    }

    let target_path = vault_path.join(&path_buf);

    // Ensure the resolved path is within vault (defense in depth)
    if !target_path.starts_with(&vault_path) {
        return Err(CommandError::PathTraversal(format!(
            "Path is outside vault: {}",
            path
        )));
    }

    fs::create_dir_all(&target_path)?;
    info!("Directory created successfully");

    Ok(())
}

/// Read file bytes from vault
#[tauri::command]
pub fn read_file_bytes(path: String, app: AppHandle) -> CommandResult<Vec<u8>> {
    info!("Reading file bytes: {}", path);

    // Get vault path for validation
    let vault_path = get_vault_base_path(&app)?;

    // Validate path
    let validated_path = validate_path(&path, &vault_path)?;

    if !validated_path.exists() {
        return Err(CommandError::FileNotFound(path));
    }

    // Validate size via metadata before loading into memory
    let metadata = fs::metadata(&validated_path)?;
    validate_file_size(metadata.len())?;

    let data = fs::read(&validated_path)?;

    info!("File read successfully: {} bytes", data.len());

    Ok(data)
}

/// Get file size
#[tauri::command]
pub fn get_file_size(path: String, app: AppHandle) -> CommandResult<u64> {
    info!("Getting file size: {}", path);

    // Get vault path for validation
    let vault_path = get_vault_base_path(&app)?;

    // Validate path
    let validated_path = validate_path(&path, &vault_path)?;

    if !validated_path.exists() {
        return Err(CommandError::FileNotFound(path));
    }

    let metadata = fs::metadata(&validated_path)?;
    let size = metadata.len();

    info!("File size: {} bytes", size);

    Ok(size)
}

/// List directory contents
#[tauri::command]
pub fn list_directory(path: String, app: AppHandle) -> CommandResult<Vec<String>> {
    info!("Listing directory: {}", path);

    // Get vault path for validation
    let vault_path = get_vault_base_path(&app)?;

    // Validate path
    let validated_path = validate_path(&path, &vault_path)?;

    if !validated_path.exists() {
        return Err(CommandError::FileNotFound(path));
    }

    if !validated_path.is_dir() {
        return Err(CommandError::InvalidPath(format!(
            "Path is not a directory: {}",
            path
        )));
    }

    let entries = fs::read_dir(&validated_path)?;
    let mut files = Vec::new();

    for entry in entries {
        if let Ok(entry) = entry {
            files.push(entry.path().to_string_lossy().to_string());
        }
    }

    info!("Listed {} entries", files.len());

    Ok(files)
}

/// Helper function to get vault base path
fn get_vault_base_path(app: &AppHandle) -> CommandResult<PathBuf> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| CommandError::OperationFailed(format!("Failed to get app data dir: {}", e)))?;

    Ok(app_data.join("vault"))
}
