use axum::extract::ws::{Message, WebSocket};
use axum::extract::{Multipart, Path, Query, State, WebSocketUpgrade};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Extension, Json, Router};
use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::{self, Claims};
use crate::error::AppError;
use crate::models::*;
use crate::storage;
use crate::AppState;

// ============================================
// ROUTE BUILDERS
// ============================================

pub fn health_routes() -> Router<Arc<AppState>> {
    Router::new().route("/health", get(health_check))
}

pub fn auth_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
}

/// All routes that require authentication — state applied via `from_fn_with_state` at merge time
pub fn sync_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/auth/me", get(get_me))
        .route("/api/sync/push", post(sync_push))
        .route("/api/sync/pull", post(sync_pull))
}

pub fn file_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/files/upload", post(file_upload))
        .route("/api/files/{file_id}", get(file_download))
        .route("/api/files/{file_id}", axum::routing::delete(file_delete))
        .route("/api/files", get(list_files))
}

pub fn ws_routes() -> Router<Arc<AppState>> {
    Router::new().route("/ws", get(ws_handler))
}

// ============================================
// HEALTH
// ============================================

async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "devvault-sync",
        "version": "0.1.0",
        "timestamp": Utc::now().to_rfc3339()
    }))
}

// ============================================
// AUTH HANDLERS
// ============================================

async fn register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> Result<impl IntoResponse, AppError> {
    auth::validate_email(&req.email)?;
    auth::validate_password(&req.password)?;

    // Check if email already exists
    let existing: Option<(String,)> =
        sqlx::query_as("SELECT id FROM users WHERE email = $1")
            .bind(&req.email)
            .fetch_optional(&state.db)
            .await?;

    if existing.is_some() {
        return Err(AppError::Conflict("Email already registered".into()));
    }

    let user_id = Uuid::new_v4().to_string();
    let password_hash = auth::hash_password(&req.password)?;

    sqlx::query("INSERT INTO users (id, email, password_hash, display_name) VALUES ($1, $2, $3, $4)")
        .bind(&user_id)
        .bind(&req.email)
        .bind(&password_hash)
        .bind(&req.display_name)
        .execute(&state.db)
        .await?;

    let token = auth::generate_token(&user_id, &req.email, &state.config)?;

    tracing::info!("User registered: {}", &req.email);

    Ok((
        StatusCode::CREATED,
        Json(AuthResponse {
            token,
            user: UserInfo {
                id: user_id,
                email: req.email,
                display_name: req.display_name,
            },
        }),
    ))
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user: User = sqlx::query_as("SELECT * FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid email or password".into()))?;

    if !auth::verify_password(&req.password, &user.password_hash)? {
        return Err(AppError::Unauthorized("Invalid email or password".into()));
    }

    let token = auth::generate_token(&user.id, &user.email, &state.config)?;

    tracing::info!("User logged in: {}", &req.email);

    Ok(Json(AuthResponse {
        token,
        user: UserInfo {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
        },
    }))
}

async fn get_me(Extension(claims): Extension<Claims>) -> impl IntoResponse {
    Json(UserInfo {
        id: claims.sub,
        email: claims.email,
        display_name: None,
    })
}

// ============================================
// SYNC HANDLERS
// ============================================

async fn sync_push(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<PushRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = &claims.sub;
    let mut accepted = 0;
    let mut conflicts = Vec::new();

    for record in &req.records {
        // Check for existing entry with newer server version
        let existing: Option<SyncEntry> = sqlx::query_as(
            "SELECT * FROM sync_entries WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3",
        )
        .bind(user_id)
        .bind(&record.entity_type)
        .bind(&record.entity_id)
        .fetch_optional(&state.db)
        .await?;

        if let Some(existing_entry) = &existing {
            // Last-write-wins: compare client_updated_at timestamps
            if existing_entry.client_updated_at > record.client_updated_at {
                conflicts.push(SyncConflict {
                    entity_type: record.entity_type.clone(),
                    entity_id: record.entity_id.clone(),
                    server_version: existing_entry.version,
                    server_data: serde_json::from_str(&existing_entry.data).unwrap_or_default(),
                });
                continue;
            }
        }

        let new_version = existing.as_ref().map(|e| e.version + 1).unwrap_or(1);
        let data_str = serde_json::to_string(&record.data).unwrap_or_default();
        let action_str = match record.action {
            SyncAction::Upsert => "upsert",
            SyncAction::Delete => "delete",
        };

        // Upsert the sync entry
        sqlx::query(
            r#"INSERT INTO sync_entries (id, user_id, entity_type, entity_id, action, data, client_updated_at, version)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT(user_id, entity_type, entity_id) DO UPDATE SET
                 action = excluded.action,
                 data = excluded.data,
                 client_updated_at = excluded.client_updated_at,
                 server_received_at = datetime('now'),
                 version = excluded.version"#,
        )
        .bind(Uuid::new_v4().to_string())
        .bind(user_id)
        .bind(&record.entity_type)
        .bind(&record.entity_id)
        .bind(action_str)
        .bind(&data_str)
        .bind(&record.client_updated_at)
        .bind(new_version)
        .execute(&state.db)
        .await?;

        accepted += 1;

        // Broadcast to other connected devices
        state
            .realtime
            .broadcast(
                user_id,
                RealtimeEvent {
                    event_type: "sync".into(),
                    entity_type: record.entity_type.clone(),
                    entity_id: record.entity_id.clone(),
                    action: action_str.into(),
                    data: Some(record.data.clone()),
                    timestamp: Utc::now().to_rfc3339(),
                },
            )
            .await;
    }

    Ok(Json(PushResponse {
        accepted,
        conflicts,
        server_timestamp: Utc::now().to_rfc3339(),
    }))
}

async fn sync_pull(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<PullRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = &claims.sub;
    let limit = 500;

    let records: Vec<SyncEntry> = if let Some(since) = &req.since {
        if let Some(entity_types) = &req.entity_types {
            // Filter by types and time
            let types_placeholder: Vec<String> = entity_types.iter().map(|t| format!("'{}'", t.replace('\'', ""))).collect();
            let types_str = types_placeholder.join(",");
            let query = format!(
                "SELECT * FROM sync_entries WHERE user_id = $1 AND server_received_at > $2 AND entity_type IN ({}) ORDER BY server_received_at ASC LIMIT $3",
                types_str
            );
            sqlx::query_as(&query)
                .bind(user_id)
                .bind(since)
                .bind(limit)
                .fetch_all(&state.db)
                .await?
        } else {
            sqlx::query_as(
                "SELECT * FROM sync_entries WHERE user_id = $1 AND server_received_at > $2 ORDER BY server_received_at ASC LIMIT $3",
            )
            .bind(user_id)
            .bind(since)
            .bind(limit)
            .fetch_all(&state.db)
            .await?
        }
    } else {
        // Full pull — first sync
        sqlx::query_as(
            "SELECT * FROM sync_entries WHERE user_id = $1 ORDER BY server_received_at ASC LIMIT $2",
        )
        .bind(user_id)
        .bind(limit)
        .fetch_all(&state.db)
        .await?
    };

    let has_more = records.len() as i32 >= limit;

    Ok(Json(PullResponse {
        records,
        server_timestamp: Utc::now().to_rfc3339(),
        has_more,
    }))
}

// ============================================
// FILE HANDLERS
// ============================================

async fn file_upload(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let user_id = &claims.sub;
    let mut uploaded = Vec::new();

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Multipart error: {}", e)))?
    {
        let filename = field
            .file_name()
            .unwrap_or("unnamed")
            .to_string();
        let content_type = field
            .content_type()
            .map(|ct| ct.to_string());
        let data = field
            .bytes()
            .await
            .map_err(|e| AppError::BadRequest(format!("Failed to read file: {}", e)))?;

        let size = data.len() as i64;
        let max_size = state.config.max_file_size_mb * 1024 * 1024;
        if size as u64 > max_size {
            return Err(AppError::PayloadTooLarge(format!(
                "File exceeds {}MB limit",
                state.config.max_file_size_mb
            )));
        }

        let content_hash = blake3::hash(&data).to_hex().to_string();
        let file_id = Uuid::new_v4().to_string();

        // Check for duplicate by hash (dedup)
        let existing: Option<StoredFile> =
            sqlx::query_as("SELECT * FROM stored_files WHERE user_id = $1 AND content_hash = $2")
                .bind(user_id)
                .bind(&content_hash)
                .fetch_optional(&state.db)
                .await?;

        if let Some(existing_file) = existing {
            // File already exists with same hash — return existing
            let url = format!("/api/files/{}", &existing_file.id);
            uploaded.push(FileUploadResponse {
                id: existing_file.id,
                filename: existing_file.filename,
                size_bytes: existing_file.size_bytes,
                content_hash: existing_file.content_hash,
                url,
            });
            continue;
        }

        let storage_path =
            storage::save_file(&state.config.storage_path, user_id, &file_id, &data)
                .await
                .map_err(|e| AppError::Internal(format!("Storage error: {}", e)))?;

        sqlx::query(
            "INSERT INTO stored_files (id, user_id, filename, content_hash, size_bytes, mime_type, storage_path) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        )
        .bind(&file_id)
        .bind(user_id)
        .bind(&filename)
        .bind(&content_hash)
        .bind(size)
        .bind(&content_type)
        .bind(&storage_path)
        .execute(&state.db)
        .await?;

        uploaded.push(FileUploadResponse {
            id: file_id,
            filename,
            size_bytes: size,
            content_hash,
            url: format!("/api/files/{}", uploaded.len()),
        });
    }

    Ok(Json(uploaded))
}

async fn file_download(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(file_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = &claims.sub;

    let file: StoredFile = sqlx::query_as(
        "SELECT * FROM stored_files WHERE id = $1 AND user_id = $2",
    )
    .bind(&file_id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("File not found".into()))?;

    let data = storage::read_file(&state.config.storage_path, &file.storage_path)
        .await
        .map_err(|e| AppError::Internal(format!("Storage read error: {}", e)))?;

    let content_type = file
        .mime_type
        .unwrap_or_else(|| "application/octet-stream".into());

    Ok((
        [
            ("content-type", content_type),
            (
                "content-disposition",
                format!("attachment; filename=\"{}\"", file.filename),
            ),
        ],
        data,
    ))
}

async fn file_delete(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(file_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = &claims.sub;

    let file: StoredFile = sqlx::query_as(
        "SELECT * FROM stored_files WHERE id = $1 AND user_id = $2",
    )
    .bind(&file_id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("File not found".into()))?;

    storage::delete_file(&state.config.storage_path, &file.storage_path)
        .await
        .map_err(|e| AppError::Internal(format!("Storage delete error: {}", e)))?;

    sqlx::query("DELETE FROM stored_files WHERE id = $1 AND user_id = $2")
        .bind(&file_id)
        .bind(user_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
struct ListFilesQuery {
    page: Option<u32>,
    limit: Option<u32>,
}

async fn list_files(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ListFilesQuery>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = &claims.sub;
    let limit = query.limit.unwrap_or(50).min(200) as i32;
    let offset = ((query.page.unwrap_or(1) - 1) * limit as u32) as i32;

    let files: Vec<StoredFile> = sqlx::query_as(
        "SELECT * FROM stored_files WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    )
    .bind(user_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(files))
}

// ============================================
// WEBSOCKET HANDLER
// ============================================

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
    Query(params): Query<WsParams>,
) -> Result<impl IntoResponse, AppError> {
    // Authenticate via query param token (WebSocket can't use headers)
    let claims = auth::validate_token(&params.token, &state.config)?;

    Ok(ws.on_upgrade(move |socket| handle_ws(socket, state, claims)))
}

#[derive(Deserialize)]
struct WsParams {
    token: String,
}

async fn handle_ws(socket: WebSocket, state: Arc<AppState>, claims: Claims) {
    let user_id = claims.sub.clone();
    let (mut sender, mut receiver) = socket.split();

    // Subscribe to user's realtime channel
    let mut rx = state.realtime.subscribe(&user_id).await;

    tracing::info!("WebSocket connected: user {}", &user_id);

    // Send events from broadcast channel to WebSocket
    let send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&event) {
                if sender.send(Message::Text(json.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    // Receive messages from WebSocket (ping/pong, close)
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                Message::Ping(_) => {
                    // Pong is handled automatically by axum
                }
                _ => {}
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    state.realtime.cleanup(&user_id).await;
    tracing::info!("WebSocket disconnected: user {}", &user_id);
}
