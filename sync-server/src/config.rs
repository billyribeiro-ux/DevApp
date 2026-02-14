use std::env;

#[derive(Clone)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiry_hours: i64,
    pub storage_path: String,
    pub max_file_size_mb: u64,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            port: env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(8090),
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "sqlite:devvault-sync.db?mode=rwc".into()),
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| {
                tracing::warn!("JWT_SECRET not set, using generated random secret");
                use rand_core::{OsRng, RngCore};
                let mut bytes = [0u8; 32];
                OsRng.fill_bytes(&mut bytes);
                bytes.iter().map(|b| format!("{:02x}", b)).collect()
            }),
            jwt_expiry_hours: env::var("JWT_EXPIRY_HOURS")
                .ok()
                .and_then(|h| h.parse().ok())
                .unwrap_or(720), // 30 days
            storage_path: env::var("STORAGE_PATH")
                .unwrap_or_else(|_| "./vault-storage".into()),
            max_file_size_mb: env::var("MAX_FILE_SIZE_MB")
                .ok()
                .and_then(|m| m.parse().ok())
                .unwrap_or(100),
        }
    }
}
