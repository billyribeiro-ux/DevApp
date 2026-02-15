mod auth;
mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod realtime;
mod storage;

use axum::middleware as axum_middleware;
use axum::Router;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::compression::CompressionLayer;
use tower_http::trace::TraceLayer;
use tower_http::set_header::SetResponseHeaderLayer;
use axum::http::{HeaderValue, header::{CONTENT_SECURITY_POLICY, X_CONTENT_TYPE_OPTIONS, X_FRAME_OPTIONS, STRICT_TRANSPORT_SECURITY}};
use tracing_subscriber::EnvFilter;

pub struct AppState {
    pub db: sqlx::SqlitePool,
    pub config: config::Config,
    pub realtime: realtime::RealtimeHub,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let config = config::Config::from_env();
    let db = db::init_db(&config.database_url).await;
    db::run_migrations(&db).await;

    // Create storage directory
    storage::ensure_storage_dir(&config.storage_path);

    let state = Arc::new(AppState {
        db,
        config: config.clone(),
        realtime: realtime::RealtimeHub::new(),
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let auth_layer = axum_middleware::from_fn_with_state(state.clone(), middleware::require_auth);

    // Security headers
    let security_headers = tower::ServiceBuilder::new()
        .layer(SetResponseHeaderLayer::overriding(
            X_CONTENT_TYPE_OPTIONS,
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            X_FRAME_OPTIONS,
            HeaderValue::from_static("DENY"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            CONTENT_SECURITY_POLICY,
            HeaderValue::from_static("default-src 'self'"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            STRICT_TRANSPORT_SECURITY,
            HeaderValue::from_static("max-age=31536000; includeSubDomains"),
        ));

    let app = Router::new()
        .merge(handlers::auth_routes())
        .merge(
            handlers::sync_routes()
                .route_layer(auth_layer.clone()),
        )
        .merge(
            handlers::file_routes()
                .route_layer(auth_layer),
        )
        .merge(handlers::ws_routes())
        .merge(handlers::health_routes())
        .layer(security_headers)
        .layer(cors)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("{}:{}", config.host, config.port);
    tracing::info!("DevVault Sync Server starting on {}", addr);
    tracing::info!("Storage path: {}", config.storage_path);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
