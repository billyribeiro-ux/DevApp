use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Structured error type for all Tauri commands
#[derive(Error, Debug)]
pub enum CommandError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Path traversal attempt detected: {0}")]
    PathTraversal(String),

    #[error("File too large: {size} bytes (max: {max} bytes)")]
    FileTooLarge { size: u64, max: u64 },

    #[error("Invalid file type: {0}")]
    InvalidFileType(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Operation failed: {0}")]
    OperationFailed(String),
}

/// Serializable error response for frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl From<CommandError> for ErrorResponse {
    fn from(error: CommandError) -> Self {
        let (code, message) = match &error {
            CommandError::FileNotFound(_) => ("FILE_NOT_FOUND", error.to_string()),
            CommandError::PermissionDenied(_) => ("PERMISSION_DENIED", error.to_string()),
            CommandError::InvalidPath(_) => ("INVALID_PATH", error.to_string()),
            CommandError::PathTraversal(_) => ("PATH_TRAVERSAL", error.to_string()),
            CommandError::FileTooLarge { .. } => ("FILE_TOO_LARGE", error.to_string()),
            CommandError::InvalidFileType(_) => ("INVALID_FILE_TYPE", error.to_string()),
            CommandError::Io(_) => ("IO_ERROR", error.to_string()),
            CommandError::Database(_) => ("DATABASE_ERROR", error.to_string()),
            CommandError::Serialization(_) => ("SERIALIZATION_ERROR", error.to_string()),
            CommandError::InvalidInput(_) => ("INVALID_INPUT", error.to_string()),
            CommandError::OperationFailed(_) => ("OPERATION_FAILED", error.to_string()),
        };

        ErrorResponse {
            code: code.to_string(),
            message,
            details: None,
        }
    }
}

// Implement Serialize for CommandError to work with Tauri
impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let response = ErrorResponse::from(self.clone());
        response.serialize(serializer)
    }
}

// Manual Clone implementation
impl Clone for CommandError {
    fn clone(&self) -> Self {
        match self {
            CommandError::FileNotFound(s) => CommandError::FileNotFound(s.clone()),
            CommandError::PermissionDenied(s) => CommandError::PermissionDenied(s.clone()),
            CommandError::InvalidPath(s) => CommandError::InvalidPath(s.clone()),
            CommandError::PathTraversal(s) => CommandError::PathTraversal(s.clone()),
            CommandError::FileTooLarge { size, max } => CommandError::FileTooLarge {
                size: *size,
                max: *max,
            },
            CommandError::InvalidFileType(s) => CommandError::InvalidFileType(s.clone()),
            CommandError::Io(e) => CommandError::Io(std::io::Error::new(e.kind(), e.to_string())),
            CommandError::Database(s) => CommandError::Database(s.clone()),
            CommandError::Serialization(e) => CommandError::OperationFailed(e.to_string()),
            CommandError::InvalidInput(s) => CommandError::InvalidInput(s.clone()),
            CommandError::OperationFailed(s) => CommandError::OperationFailed(s.clone()),
        }
    }
}

pub type CommandResult<T> = Result<T, CommandError>;
