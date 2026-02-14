use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand_core::OsRng;
use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,   // user id
    pub email: String,
    pub exp: usize,    // expiry timestamp
    pub iat: usize,    // issued at
}

/// Hash a password with Argon2id.
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))
}

/// Verify a password against its hash.
pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AppError::Internal(format!("Invalid password hash: {}", e)))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

/// Generate a JWT token for a user.
pub fn generate_token(user_id: &str, email: &str, config: &Config) -> Result<String, AppError> {
    let now = Utc::now();
    let exp = now + chrono::Duration::hours(config.jwt_expiry_hours);

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        exp: exp.timestamp() as usize,
        iat: now.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Token generation failed: {}", e)))
}

/// Validate and decode a JWT token. Returns the claims if valid.
pub fn validate_token(token: &str, config: &Config) -> Result<Claims, AppError> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.jwt_secret.as_bytes()),
        &Validation::default(),
    )?;
    Ok(token_data.claims)
}

/// Validate password strength — at least 8 chars.
pub fn validate_password(password: &str) -> Result<(), AppError> {
    if password.len() < 8 {
        return Err(AppError::BadRequest(
            "Password must be at least 8 characters".into(),
        ));
    }
    Ok(())
}

/// Validate email format (basic).
pub fn validate_email(email: &str) -> Result<(), AppError> {
    if !email.contains('@') || !email.contains('.') || email.len() < 5 {
        return Err(AppError::BadRequest("Invalid email address".into()));
    }
    Ok(())
}
