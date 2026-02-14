use std::path::{Path, PathBuf};
use tokio::fs;
use tokio::io::AsyncWriteExt;

/// Ensure the storage root directory exists.
pub fn ensure_storage_dir(path: &str) {
    std::fs::create_dir_all(path).expect("Failed to create storage directory");
}

/// Get the user-specific storage directory.
fn user_dir(storage_root: &str, user_id: &str) -> PathBuf {
    Path::new(storage_root).join(user_id)
}

/// Save a file to disk. Returns the storage path relative to the root.
pub async fn save_file(
    storage_root: &str,
    user_id: &str,
    file_id: &str,
    data: &[u8],
) -> Result<String, std::io::Error> {
    let dir = user_dir(storage_root, user_id);
    fs::create_dir_all(&dir).await?;

    let file_path = dir.join(file_id);
    let mut file = fs::File::create(&file_path).await?;
    file.write_all(data).await?;
    file.flush().await?;

    Ok(format!("{}/{}", user_id, file_id))
}

/// Read a file from disk.
pub async fn read_file(storage_root: &str, relative_path: &str) -> Result<Vec<u8>, std::io::Error> {
    let full_path = Path::new(storage_root).join(relative_path);
    fs::read(full_path).await
}

/// Delete a file from disk.
pub async fn delete_file(
    storage_root: &str,
    relative_path: &str,
) -> Result<(), std::io::Error> {
    let full_path = Path::new(storage_root).join(relative_path);
    if full_path.exists() {
        fs::remove_file(full_path).await?;
    }
    Ok(())
}

/// Get the total storage used by a user in bytes.
#[allow(dead_code)]
pub async fn get_user_storage_size(storage_root: &str, user_id: &str) -> u64 {
    let dir = user_dir(storage_root, user_id);
    if !dir.exists() {
        return 0;
    }

    let mut total: u64 = 0;
    if let Ok(mut entries) = fs::read_dir(&dir).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            if let Ok(metadata) = entry.metadata().await {
                total += metadata.len();
            }
        }
    }
    total
}
