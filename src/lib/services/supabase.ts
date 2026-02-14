// Supabase client initialization
// This will be configured when the user connects their Supabase project

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface SyncConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSyncConfig(): SyncConfig {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  };
}

// Sync operations will be implemented when Supabase is configured
// For now, the app works fully offline with SQLite

export async function pushToCloud(_entityType: string, _entityId: string, _data: unknown): Promise<boolean> {
  const config = getSyncConfig();
  if (!config.isConfigured) return false;

  // TODO: Implement Supabase push sync
  // 1. Authenticate with stored JWT
  // 2. Upsert entity data to PostgreSQL
  // 3. Upload file chunks to Supabase Storage
  // 4. Update sync_queue status

  return false;
}

export async function pullFromCloud(_lastSyncAt: string | null): Promise<unknown[]> {
  const config = getSyncConfig();
  if (!config.isConfigured) return [];

  // TODO: Implement Supabase pull sync
  // 1. Query changes since lastSyncAt
  // 2. Download updated metadata
  // 3. Download new/changed file chunks
  // 4. Apply changes to local SQLite

  return [];
}

export async function subscribeToRealtimeChanges(_callback: (change: unknown) => void): Promise<void> {
  const config = getSyncConfig();
  if (!config.isConfigured) return;

  // TODO: Implement Supabase Realtime subscription
  // 1. Connect to Realtime WebSocket
  // 2. Subscribe to user's changes table
  // 3. On change, call callback to trigger local sync
}
