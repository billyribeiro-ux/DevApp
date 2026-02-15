use crate::error::{CommandError, CommandResult};
use std::path::{Path, PathBuf};

/// Maximum file size: 100MB
pub const MAX_FILE_SIZE: u64 = 100 * 1024 * 1024;

/// Allowed file extensions for vault files
pub const ALLOWED_EXTENSIONS: &[&str] = &[
    "txt", "md", "json", "yaml", "yml", "toml", "rs", "js", "ts", "jsx", "tsx",
    "py", "go", "java", "c", "cpp", "h", "hpp", "cs", "rb", "php", "swift",
    "kt", "scala", "sh", "bash", "zsh", "fish", "sql", "html", "css", "scss",
    "sass", "less", "xml", "svg", "pdf", "png", "jpg", "jpeg", "gif", "webp",
    "mp4", "webm", "mp3", "wav", "zip", "tar", "gz", "7z", "rar",
];

/// Validates a file path to prevent path traversal attacks
pub fn validate_path(path: &str, base_path: &Path) -> CommandResult<PathBuf> {
    let path_buf = PathBuf::from(path);

    // Check for path traversal attempts
    if path.contains("..") {
        return Err(CommandError::PathTraversal(format!(
            "Path contains '..' which is not allowed: {}",
            path
        )));
    }

    // Normalize the path
    let canonical = if path_buf.is_absolute() {
        path_buf.canonicalize().map_err(|e| {
            CommandError::InvalidPath(format!("Failed to canonicalize path: {}", e))
        })?
    } else {
        base_path.join(&path_buf).canonicalize().map_err(|e| {
            CommandError::InvalidPath(format!("Failed to canonicalize path: {}", e))
        })?
    };

    // Ensure the path is within the base directory
    if !canonical.starts_with(base_path) {
        return Err(CommandError::PathTraversal(format!(
            "Path is outside allowed directory: {}",
            canonical.display()
        )));
    }

    Ok(canonical)
}

/// Validates a filename to ensure it's safe
pub fn validate_filename(filename: &str) -> CommandResult<String> {
    // Check for empty filename
    if filename.is_empty() {
        return Err(CommandError::InvalidInput("Filename cannot be empty".to_string()));
    }

    // Check for path separators
    if filename.contains('/') || filename.contains('\\') {
        return Err(CommandError::InvalidInput(
            "Filename cannot contain path separators".to_string(),
        ));
    }

    // Check for null bytes
    if filename.contains('\0') {
        return Err(CommandError::InvalidInput(
            "Filename cannot contain null bytes".to_string(),
        ));
    }

    // Check for reserved names on Windows
    let reserved_names = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4",
                          "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2",
                          "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
    
    let name_upper = filename.to_uppercase();
    for reserved in reserved_names {
        if name_upper == reserved || name_upper.starts_with(&format!("{}.", reserved)) {
            return Err(CommandError::InvalidInput(format!(
                "Filename '{}' is reserved on Windows",
                filename
            )));
        }
    }

    Ok(filename.to_string())
}

/// Validates file extension
pub fn validate_file_extension(filename: &str) -> CommandResult<()> {
    let path = Path::new(filename);
    
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_string_lossy().to_lowercase();
        if ALLOWED_EXTENSIONS.contains(&ext_str.as_str()) {
            return Ok(());
        }
    }

    Err(CommandError::InvalidFileType(format!(
        "File type not allowed: {}",
        filename
    )))
}

/// Validates file size
pub fn validate_file_size(size: u64) -> CommandResult<()> {
    if size > MAX_FILE_SIZE {
        return Err(CommandError::FileTooLarge {
            size,
            max: MAX_FILE_SIZE,
        });
    }
    Ok(())
}

/// Sanitizes a string for safe use in filenames
pub fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_path_traversal_detection() {
        let base = PathBuf::from("/tmp/vault");
        assert!(validate_path("../etc/passwd", &base).is_err());
        assert!(validate_path("../../etc/passwd", &base).is_err());
    }

    #[test]
    fn test_filename_validation() {
        assert!(validate_filename("test.txt").is_ok());
        assert!(validate_filename("test/file.txt").is_err());
        assert!(validate_filename("").is_err());
        assert!(validate_filename("CON").is_err());
    }

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("test:file*.txt"), "test_file_.txt");
        assert_eq!(sanitize_filename("normal.txt"), "normal.txt");
    }
}

