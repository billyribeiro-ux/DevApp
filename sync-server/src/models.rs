use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

// ============================================
// USER / AUTH
// ============================================

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    pub password_hash: String,
    pub display_name: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub display_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub display_name: Option<String>,
}

// ============================================
// SYNC ENTITIES
// ============================================

/// A generic sync record — wraps any entity type for push/pull operations.
#[derive(Debug, Serialize, Deserialize)]
pub struct SyncRecord {
    pub entity_type: String,
    pub entity_id: String,
    pub action: SyncAction,
    pub data: serde_json::Value,
    pub client_updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SyncAction {
    Upsert,
    Delete,
}

/// Stored sync entry in the server database.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SyncEntry {
    pub id: String,
    pub user_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub action: String,
    pub data: String,
    pub client_updated_at: String,
    pub server_received_at: NaiveDateTime,
    pub version: i64,
}

#[derive(Debug, Deserialize)]
pub struct PushRequest {
    pub records: Vec<SyncRecord>,
}

#[derive(Debug, Serialize)]
pub struct PushResponse {
    pub accepted: usize,
    pub conflicts: Vec<SyncConflict>,
    pub server_timestamp: String,
}

#[derive(Debug, Serialize)]
pub struct SyncConflict {
    pub entity_type: String,
    pub entity_id: String,
    pub server_version: i64,
    pub server_data: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct PullRequest {
    pub since: Option<String>,
    pub entity_types: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct PullResponse {
    pub records: Vec<SyncEntry>,
    pub server_timestamp: String,
    pub has_more: bool,
}

// ============================================
// FILE STORAGE
// ============================================

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct StoredFile {
    pub id: String,
    pub user_id: String,
    pub filename: String,
    pub content_hash: String,
    pub size_bytes: i64,
    pub mime_type: Option<String>,
    pub storage_path: String,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Serialize)]
pub struct FileUploadResponse {
    pub id: String,
    pub filename: String,
    pub size_bytes: i64,
    pub content_hash: String,
    pub url: String,
}

// ============================================
// REALTIME
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RealtimeEvent {
    pub event_type: String,
    pub entity_type: String,
    pub entity_id: String,
    pub action: String,
    pub data: Option<serde_json::Value>,
    pub timestamp: String,
}
