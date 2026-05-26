/**
 * Background Sync Engine
 * Handles automatic syncing of local changes to the cloud
 * Apple Principal Engineer ICT Level 7 Standards
 */

import { pushToCloud, pullFromCloud, isAuthenticated, type SyncRecord } from './supabase';
import { getDb } from './database-wrapper';
import { logger } from '$lib/utils/logger';
import { sync } from '$stores/app.svelte';
import type { SyncQueueItem } from '$types';

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
	let pending: SyncQueueItem[] = [];

	try {
		const db = await getDb();

		// Get pending items
		pending = await db.select<SyncQueueItem[]>(
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

		// Convert to sync records, skipping malformed payloads
		const records: SyncRecord[] = [];
		const skippedIds: string[] = [];
		for (const item of pending) {
			try {
				records.push({
					entity_type: item.entity_type,
					entity_id: item.entity_id,
					action: item.action,
					data: item.payload ? JSON.parse(item.payload) : {},
					client_updated_at: item.created_at
				});
			} catch {
				logger.warn('Skipping sync item with malformed payload', { id: item.id });
				skippedIds.push(item.id);
			}
		}

		// Mark malformed items as failed
		for (const id of skippedIds) {
			await db.execute(
				`UPDATE sync_queue SET status = 'failed', error_message = 'Malformed JSON payload' WHERE id = $1`,
				[id]
			);
		}

		if (records.length === 0) {
			sync.status = skippedIds.length > 0 ? 'error' : 'synced';
			isSyncing = false;
			return;
		}

		// Push to cloud
		const result = await pushToCloud(records);

		// Build a set of conflicting entity IDs so we don't mark them as completed
		const conflictIds = new Set(
			result.conflicts.map(c => `${c.entity_type}:${c.entity_id}`)
		);

		// Mark accepted items as completed, leave conflicts as pending
		for (const item of pending) {
			const key = `${item.entity_type}:${item.entity_id}`;
			if (conflictIds.has(key)) {
				await db.execute(
					`UPDATE sync_queue
					 SET retry_count = retry_count + 1,
					     error_message = 'Server conflict — needs resolution',
					     status = CASE WHEN retry_count + 1 >= $1 THEN 'failed' ELSE 'pending' END
					 WHERE id = $2`,
					[MAX_RETRIES, item.id]
				);
			} else {
				await db.execute(
					`UPDATE sync_queue SET status = 'completed', processed_at = datetime('now') WHERE id = $1`,
					[item.id]
				);
			}
		}

		// Handle conflicts
		if (result.conflicts.length > 0) {
			logger.warn(`${result.conflicts.length} conflicts detected`, { conflicts: result.conflicts });
		}

		sync.status = result.conflicts.length > 0 ? 'error' : 'synced';
		sync.lastSyncedAt = new Date().toISOString();
		sync.pendingCount = result.conflicts.length;
		logger.info(`Synced ${result.accepted} items, ${result.conflicts.length} conflicts`);

	} catch (error) {
		logger.error('Sync queue processing failed', error as Error);
		sync.status = 'error';
		
		// Mark only the attempted batch items as failed (not all pending)
		try {
			const db = await getDb();
			const pendingIds = pending.map(p => p.id);
			for (const id of pendingIds) {
				await db.execute(
					`UPDATE sync_queue
					 SET retry_count = retry_count + 1,
					     error_message = $1,
					     status = CASE WHEN retry_count + 1 >= $2 THEN 'failed' ELSE 'pending' END
					 WHERE id = $3`,
					[(error as Error).message, MAX_RETRIES, id]
				);
			}
		} catch (dbError) {
			logger.error('Failed to update sync queue after error', dbError as Error);
		}
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

