use std::collections::HashMap;
use tokio::sync::{broadcast, RwLock};

use crate::models::RealtimeEvent;

const CHANNEL_CAPACITY: usize = 256;

/// Manages WebSocket connections per user. Each user gets a broadcast channel
/// so multiple devices receive the same realtime events.
pub struct RealtimeHub {
    /// Map of user_id -> broadcast sender
    channels: RwLock<HashMap<String, broadcast::Sender<RealtimeEvent>>>,
}

impl RealtimeHub {
    pub fn new() -> Self {
        Self {
            channels: RwLock::new(HashMap::new()),
        }
    }

    /// Get or create a broadcast channel for a user.
    pub async fn subscribe(&self, user_id: &str) -> broadcast::Receiver<RealtimeEvent> {
        let mut channels = self.channels.write().await;
        let sender = channels
            .entry(user_id.to_string())
            .or_insert_with(|| broadcast::channel(CHANNEL_CAPACITY).0);
        sender.subscribe()
    }

    /// Broadcast an event to all of a user's connected devices.
    pub async fn broadcast(&self, user_id: &str, event: RealtimeEvent) {
        let channels = self.channels.read().await;
        if let Some(sender) = channels.get(user_id) {
            // Ignore send errors (no receivers connected)
            let _ = sender.send(event);
        }
    }

    /// Remove a user's channel if no receivers are left.
    pub async fn cleanup(&self, user_id: &str) {
        let mut channels = self.channels.write().await;
        if let Some(sender) = channels.get(user_id) {
            if sender.receiver_count() == 0 {
                channels.remove(user_id);
            }
        }
    }
}
