use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::str::FromStr;

pub async fn init_db(database_url: &str) -> SqlitePool {
    let options = SqliteConnectOptions::from_str(database_url)
        .expect("Invalid DATABASE_URL")
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .busy_timeout(std::time::Duration::from_secs(30));

    SqlitePoolOptions::new()
        .max_connections(10)
        .connect_with(options)
        .await
        .expect("Failed to connect to database")
}

pub async fn run_migrations(pool: &SqlitePool) {
    sqlx::raw_sql(
        r#"
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            created_at DATETIME NOT NULL DEFAULT (datetime('now')),
            updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        );

        -- Sync entries — every change pushed by any client
        CREATE TABLE IF NOT EXISTS sync_entries (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL DEFAULT 'upsert',
            data TEXT NOT NULL DEFAULT '{}',
            client_updated_at TEXT NOT NULL,
            server_received_at DATETIME NOT NULL DEFAULT (datetime('now')),
            version INTEGER NOT NULL DEFAULT 1
        );

        -- Stored files metadata
        CREATE TABLE IF NOT EXISTS stored_files (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            filename TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            size_bytes INTEGER NOT NULL DEFAULT 0,
            mime_type TEXT,
            storage_path TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        );

        -- Refresh tokens for token rotation
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            token_hash TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_sync_user ON sync_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_sync_type ON sync_entries(entity_type);
        CREATE INDEX IF NOT EXISTS idx_sync_entity ON sync_entries(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_sync_received ON sync_entries(server_received_at);
        CREATE INDEX IF NOT EXISTS idx_sync_user_received ON sync_entries(user_id, server_received_at);
        CREATE INDEX IF NOT EXISTS idx_files_user ON stored_files(user_id);
        CREATE INDEX IF NOT EXISTS idx_files_hash ON stored_files(content_hash);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_unique_entity
            ON sync_entries(user_id, entity_type, entity_id);
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run migrations");

    tracing::info!("Database migrations complete");
}
