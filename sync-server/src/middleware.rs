use axum::extract::{Request, State};
use axum::http::header::AUTHORIZATION;
use axum::middleware::Next;
use axum::response::Response;
use std::sync::Arc;

use crate::auth::validate_token;
use crate::error::AppError;
use crate::AppState;

/// Extract and validate JWT from the Authorization header.
/// Sets the Claims in request extensions for downstream handlers.
pub async fn require_auth(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".into()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid authorization format".into()))?;

    let claims = validate_token(token, &state.config)?;

    // Store claims in request extensions for handlers to access
    request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}

