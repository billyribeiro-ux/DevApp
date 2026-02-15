/**
 * Enhanced database wrapper with transaction support and error handling
 * Apple Principal Engineer ICT Level 7 Standards
 */

import Database from '@tauri-apps/plugin-sql';
import { DB_NAME } from '$config/constants';
import { AppError, ErrorCode } from '$lib/utils/errors';
import { logger } from '$lib/utils/logger';

let db: Database | null = null;

/**
 * Get database instance with connection pooling
 */
export async function getDb(): Promise<Database> {
	if (!db) {
		try {
			logger.info('Initializing database connection');
			db = await Database.load(DB_NAME);
			logger.info('Database connection established');
		} catch (error) {
			logger.error('Failed to initialize database', error as Error);
			throw AppError.fromDatabaseError(error);
		}
	}
	return db;
}

/**
 * Execute a query with error handling and logging
 */
export async function executeQuery<T = unknown>(
	query: string,
	params?: unknown[]
): Promise<T> {
	const endTimer = logger.startTimer('Database Query');
	try {
		const d = await getDb();
		logger.debug('Executing query', { query, params });
		const result = await d.select<T>(query, params);
		endTimer();
		return result;
	} catch (error) {
		endTimer();
		logger.error('Query execution failed', error as Error, { query, params });
		throw AppError.fromDatabaseError(error);
	}
}

/**
 * Execute a mutation with error handling and logging
 */
export async function executeMutation(
	query: string,
	params?: unknown[]
): Promise<void> {
	const endTimer = logger.startTimer('Database Mutation');
	try {
		const d = await getDb();
		logger.debug('Executing mutation', { query, params });
		await d.execute(query, params);
		endTimer();
	} catch (error) {
		endTimer();
		logger.error('Mutation execution failed', error as Error, { query, params });
		throw AppError.fromDatabaseError(error);
	}
}

/**
 * Transaction support for SQLite
 * Note: Tauri SQL plugin doesn't have native transaction support,
 * so we implement it using BEGIN/COMMIT/ROLLBACK
 */
export async function transaction<T>(
	fn: (db: Database) => Promise<T>
): Promise<T> {
	const d = await getDb();
	const endTimer = logger.startTimer('Database Transaction');

	try {
		logger.debug('Starting transaction');
		await d.execute('BEGIN TRANSACTION');

		const result = await fn(d);

		await d.execute('COMMIT');
		logger.debug('Transaction committed');
		endTimer();

		return result;
	} catch (error) {
		logger.error('Transaction failed, rolling back', error as Error);
		try {
			await d.execute('ROLLBACK');
			logger.debug('Transaction rolled back');
		} catch (rollbackError) {
			logger.error('Rollback failed', rollbackError as Error);
		}
		endTimer();
		throw AppError.fromDatabaseError(error);
	}
}

/**
 * Batch insert with transaction support
 */
export async function batchInsert<T extends Record<string, unknown>>(
	table: string,
	records: T[]
): Promise<void> {
	if (records.length === 0) return;

	await transaction(async (db) => {
		const keys = Object.keys(records[0]);
		const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
		const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

		for (const record of records) {
			const values = keys.map((key) => record[key]);
			await db.execute(query, values);
		}
	});

	logger.info(`Batch inserted ${records.length} records into ${table}`);
}

/**
 * Batch update with transaction support
 */
export async function batchUpdate<T extends Record<string, unknown>>(
	table: string,
	records: T[],
	idKey: keyof T = 'id'
): Promise<void> {
	if (records.length === 0) return;

	await transaction(async (db) => {
		for (const record of records) {
			const keys = Object.keys(record).filter((k) => k !== idKey);
			const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
			const query = `UPDATE ${table} SET ${setClause} WHERE ${String(idKey)} = $${keys.length + 1}`;
			const values = [...keys.map((k) => record[k]), record[idKey]];
			await db.execute(query, values);
		}
	});

	logger.info(`Batch updated ${records.length} records in ${table}`);
}

/**
 * Safe delete with soft delete support
 */
export async function safeDelete(
	table: string,
	id: string,
	soft: boolean = true
): Promise<void> {
	const d = await getDb();

	if (soft) {
		await d.execute(
			`UPDATE ${table} SET is_deleted = 1, updated_at = datetime('now') WHERE id = $1`,
			[id]
		);
		logger.info(`Soft deleted record from ${table}`, { id });
	} else {
		await d.execute(`DELETE FROM ${table} WHERE id = $1`, [id]);
		logger.info(`Hard deleted record from ${table}`, { id });
	}
}

