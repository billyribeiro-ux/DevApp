// ============================================
// DevVault Sync Client
// Connects to our self-hosted devvault-sync Rust server
// ============================================

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:8090';

let authToken: string | null = null;
let ws: WebSocket | null = null;

// ============================================
// CONFIG
// ============================================

export interface SyncConfig {
  url: string;
  isConfigured: boolean;
}

export function getSyncConfig(): SyncConfig {
  return {
    url: SYNC_SERVER_URL,
    isConfigured: Boolean(SYNC_SERVER_URL),
  };
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SYNC_SERVER_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...options.headers as Record<string, string> },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ============================================
// AUTH
// ============================================

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; display_name: string | null };
}

export async function register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  authToken = res.token;
  localStorage.setItem('devvault_token', res.token);
  localStorage.setItem('devvault_user', JSON.stringify(res.user));
  return res;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  authToken = res.token;
  localStorage.setItem('devvault_token', res.token);
  localStorage.setItem('devvault_user', JSON.stringify(res.user));
  return res;
}

export function logout(): void {
  authToken = null;
  localStorage.removeItem('devvault_token');
  localStorage.removeItem('devvault_user');
  disconnectRealtime();
}

export function restoreSession(): boolean {
  const token = localStorage.getItem('devvault_token');
  if (token) {
    authToken = token;
    return true;
  }
  return false;
}

export function getStoredUser(): { id: string; email: string; display_name: string | null } | null {
  const raw = localStorage.getItem('devvault_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAuthenticated(): boolean {
  return Boolean(authToken);
}

export async function getMe(): Promise<{ id: string; email: string; display_name: string | null }> {
  return api('/api/auth/me');
}

// ============================================
// SYNC — PUSH
// ============================================

export interface SyncRecord {
  entity_type: string;
  entity_id: string;
  action: 'upsert' | 'delete';
  data: Record<string, unknown>;
  client_updated_at: string;
}

export interface PushResponse {
  accepted: number;
  conflicts: Array<{
    entity_type: string;
    entity_id: string;
    server_version: number;
    server_data: Record<string, unknown>;
  }>;
  server_timestamp: string;
}

export async function pushToCloud(records: SyncRecord[]): Promise<PushResponse> {
  return api<PushResponse>('/api/sync/push', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

// Convenience: push a single entity
export async function pushEntity(entityType: string, entityId: string, data: Record<string, unknown>, action: 'upsert' | 'delete' = 'upsert'): Promise<PushResponse> {
  return pushToCloud([{
    entity_type: entityType,
    entity_id: entityId,
    action,
    data,
    client_updated_at: new Date().toISOString(),
  }]);
}

// ============================================
// SYNC — PULL
// ============================================

export interface PullResponse {
  records: Array<{
    id: string;
    user_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    data: string;
    client_updated_at: string;
    server_received_at: string;
    version: number;
  }>;
  server_timestamp: string;
  has_more: boolean;
}

export async function pullFromCloud(since?: string | null, entityTypes?: string[]): Promise<PullResponse> {
  return api<PullResponse>('/api/sync/pull', {
    method: 'POST',
    body: JSON.stringify({
      since: since ?? undefined,
      entity_types: entityTypes ?? undefined,
    }),
  });
}

// ============================================
// FILE STORAGE
// ============================================

export interface FileUploadResult {
  id: string;
  filename: string;
  size_bytes: number;
  content_hash: string;
  url: string;
}

export async function uploadFile(file: File): Promise<FileUploadResult[]> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${SYNC_SERVER_URL}/api/files/upload`, {
    method: 'POST',
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: HTTP ${res.status}`);
  }

  return res.json();
}

export async function downloadFile(fileId: string): Promise<Blob> {
  const res = await fetch(`${SYNC_SERVER_URL}/api/files/${fileId}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });

  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  return res.blob();
}

export async function deleteCloudFile(fileId: string): Promise<void> {
  await api(`/api/files/${fileId}`, { method: 'DELETE' });
}

export async function listCloudFiles(page = 1, limit = 50): Promise<FileUploadResult[]> {
  return api(`/api/files?page=${page}&limit=${limit}`);
}

// ============================================
// REALTIME WEBSOCKET
// ============================================

export interface RealtimeEvent {
  event_type: string;
  entity_type: string;
  entity_id: string;
  action: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

type RealtimeCallback = (event: RealtimeEvent) => void;

let realtimeCallbacks: RealtimeCallback[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export function connectRealtime(): void {
  if (!authToken) return;
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const wsUrl = SYNC_SERVER_URL.replace(/^http/, 'ws');

  if (!wsUrl.startsWith('wss:') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
    console.warn('[DevVault Sync] WebSocket using insecure ws:// — configure VITE_SYNC_SERVER_URL with https://');
  }

  ws = new WebSocket(`${wsUrl}/ws?token=${encodeURIComponent(authToken)}`);

  ws.onopen = () => {
    console.log('[DevVault Sync] Realtime connected');
    reconnectAttempts = 0;
  };

  ws.onmessage = (event) => {
    try {
      const data: RealtimeEvent = JSON.parse(event.data);
      for (const cb of realtimeCallbacks) cb(data);
    } catch (e) {
      console.warn('[DevVault Sync] Failed to parse realtime event:', e);
    }
  };

  ws.onclose = () => {
    console.log('[DevVault Sync] Realtime disconnected');
    if (authToken) scheduleReconnect();
  };

  ws.onerror = (err) => {
    console.error('[DevVault Sync] WebSocket error:', err);
  };
}

function scheduleReconnect(): void {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn('[DevVault Sync] Max reconnect attempts reached');
    return;
  }
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => connectRealtime(), delay);
}

export function disconnectRealtime(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.onmessage = null;
    ws.close();
    ws = null;
  }
  reconnectAttempts = 0;
  realtimeCallbacks = [];
}

export function onRealtimeEvent(callback: RealtimeCallback): () => void {
  realtimeCallbacks.push(callback);
  return () => {
    realtimeCallbacks = realtimeCallbacks.filter(cb => cb !== callback);
  };
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${SYNC_SERVER_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
