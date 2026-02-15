/**
 * Background Sync Engine
 * Handles automatic syncing of local changes to the cloud
 * Apple Principal Engineer ICT Level 7 Standards
 */

import { pushToCloud, pullFromCloud, isAuthenticated, type SyncRecord } from './supabase';
import { getDb } from './database-wrapper';
import { logger } from '$lib/utils/logger';
import { sync } from '$stores/app.svelte';

interface SyncQueueItem {
	id: string;
	entity_type: string;
	entity_id: string;
	action: 'upsert' | 'delete';
	payload: string | null;
	status: string;
	retry_count: number;
	error_message: string | null;
	created_at: string;
	processed_at: string | null;
}

let syncInterval: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;
const SYNC_INTERVAL_MS = 30000; // 30 seconds
const MAX_RETRIES = 5;

/**
 * Start the background sync engine
 */
export function startSyncEngine(): void {
	if (syncInterval) return;

	logger.info('Starting sync engine');
	
	// Initial sync
	processSyncQueue().catch(err => logger.error('Initial sync failed', err));

	// Periodic sync
	syncInterval = setInterval(() => {
		if (!isSyncing && isAuthenticated()) {
			processSyncQueue().catch(err => logger.error('Sync failed', err));
		}
	}, SYNC_INTERVAL_MS);
}

/**
 * Stop the background sync engine
 */
export function stopSyncEngine(): void {
	if (syncInterval) {
		clearInterval(syncInterval);
		syncInterval = null;
		logger.info('Sync engine stopped');
	}
}

/**
 * Process pending items in the sync queue
 */
async function processSyncQueue(): Promise<void> {
	if (!isAuthenticated()) {
		sync.status = 'offline';
		return;
	}

	isSyncing = true;
	sync.status = 'syncing';

	try {
		const db = await getDb();
		
		// Get pending items
		const pending = await db.select<SyncQueueItem[]>(
			`SELECT * FROM sync_queue 
			 WHERE status = 'pending' AND retry_count < $1 
			 ORDER BY created_at ASC 
			 LIMIT 50`,
			[MAX_RETRIES]
		);

		if (pending.length === 0) {
			sync.status = 'synced';
			sync.lastSyncedAt = new Date().toISOString();
			isSyncing = false;
			return;
		}

		sync.pendingCount = pending.length;
		logger.info(`Processing ${pending.length} sync queue items`);

		// Convert to sync records
		const records: SyncRecord[] = pending.map(item => ({
			entity_type: item.entity_type,
			entity_id: item.entity_id,
			action: item.action,
			data: item.payload ? JSON.parse(item.payload) : {},
			client_updated_at: item.created_at
		}));

		// Push to cloud
		const result = await pushToCloud(records);

		// Mark as completed
		for (const item of pending) {
			await db.execute(
				`UPDATE sync_queue SET status = 'completed', processed_at = datetime('now') WHERE id = $1`,
				[item.id]
			);
		}

		// Handle conflicts
		if (result.conflicts.length > 0) {
			logger.warn(`${result.conflicts.length} conflicts detected`, { conflicts: result.conflicts });
			// TODO: Implement conflict resolution UI
		}

		sync.status = 'synced';
		sync.lastSyncedAt = new Date().toISOString();
		sync.pendingCount = 0;
		logger.info(`Synced ${result.accepted} items successfully`);

	} catch (error) {
		logger.error('Sync queue processing failed', error as Error);
		sync.status = 'error';
		
		// Mark failed items
		const db = await getDb();
		await db.execute(
			`UPDATE sync_queue 
			 SET retry_count = retry_count + 1, 
			     error_message = $1,
			     status = CASE WHEN retry_count + 1 >= $2 THEN 'failed' ELSE 'pending' END
			 WHERE status = 'pending'`,
			[(error as Error).message, MAX_RETRIES]
		);
	} finally {
		isSyncing = false;
	}
}

/**
 * Add an item to the sync queue
 */
export async function queueSync(
	entityType: string,
	entityId: string,
	action: 'upsert' | 'delete',
	data: Record<string, unknown>
): Promise<void> {
	const db = await getDb();
	await db.execute(
		`INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status)
		 VALUES ($1, $2, $3, $4, $5, 'pending')`,
		[crypto.randomUUID(), entityType, entityId, action, JSON.stringify(data)]
	);
	logger.debug('Queued sync', { entityType, entityId, action });
}

