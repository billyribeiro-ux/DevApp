/**
 * Global error handler for DevVault
 * Apple Principal Engineer ICT Level 7 Standards
 */

import { toasts } from '$lib/stores/app.svelte';
import { AppError, ErrorCode, getUserFriendlyMessage, getErrorSeverity, ErrorSeverity } from './errors';
import { logger } from './logger';

/**
 * Handle errors globally with user feedback and logging
 */
export function handleError(error: unknown, context?: string): void {
	logger.error(`Error${context ? ` in ${context}` : ''}`, error as Error);

	const appError = normalizeError(error);
	const userMessage = getUserFriendlyMessage(appError);
	const severity = getErrorSeverity(appError.code);

	// Show toast notification based on severity
	switch (severity) {
		case ErrorSeverity.CRITICAL:
			toasts.error('Critical Error', userMessage);
			break;
		case ErrorSeverity.ERROR:
			toasts.error('Error', userMessage);
			break;
		case ErrorSeverity.WARNING:
			toasts.warning('Warning', userMessage);
			break;
		case ErrorSeverity.INFO:
			toasts.info('Notice', userMessage);
			break;
	}

	// Log to error tracking service in production
	if (!import.meta.env.DEV) {
		logToErrorTracking(appError, context);
	}
}

/**
 * Normalize any error to AppError
 */
function normalizeError(error: unknown): AppError {
	if (error instanceof AppError) {
		return error;
	}

	if (error instanceof Error) {
		return new AppError(ErrorCode.UNKNOWN_ERROR, error.message);
	}

	if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
		return AppError.fromTauriError(error);
	}

	return new AppError(ErrorCode.UNKNOWN_ERROR, String(error));
}

/**
 * Log error to tracking service (Sentry, etc.)
 */
function logToErrorTracking(error: AppError, context?: string): void {
	// TODO: Integrate with Sentry
	console.error('Error tracking:', {
		error: error.toJSON(),
		context,
	});
}

/**
 * Async error wrapper with automatic error handling
 */
export async function withErrorHandling<T>(
	fn: () => Promise<T>,
	context?: string,
	options?: {
		silent?: boolean;
		fallback?: T;
	}
): Promise<T | undefined> {
	try {
		return await fn();
	} catch (error) {
		if (!options?.silent) {
			handleError(error, context);
		} else {
			logger.error(`Silent error${context ? ` in ${context}` : ''}`, error as Error);
		}
		return options?.fallback;
	}
}

/**
 * Retry wrapper for operations that may fail temporarily
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: {
		maxAttempts?: number;
		delay?: number;
		backoff?: boolean;
		context?: string;
	} = {}
): Promise<T> {
	const { maxAttempts = 3, delay = 1000, backoff = true, context } = options;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			if (attempt < maxAttempts) {
				const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
				logger.warn(`Retry attempt ${attempt}/${maxAttempts}${context ? ` for ${context}` : ''}`, {
					waitTime,
				});
				await new Promise((resolve) => setTimeout(resolve, waitTime));
			}
		}
	}

	// All attempts failed
	handleError(lastError, context);
	throw lastError;
}

/**
 * Debounced error handler to prevent error spam
 */
class DebouncedErrorHandler {
	private errorMap = new Map<string, number>();
	private readonly debounceTime = 5000; // 5 seconds

	handle(error: unknown, context?: string): void {
		const key = `${context || 'global'}-${error instanceof Error ? error.message : String(error)}`;
		const lastTime = this.errorMap.get(key) || 0;
		const now = Date.now();

		if (now - lastTime > this.debounceTime) {
			this.errorMap.set(key, now);
			handleError(error, context);
		} else {
			// Just log, don't show toast
			logger.error(`Debounced error${context ? ` in ${context}` : ''}`, error as Error);
		}
	}
}

export const debouncedErrorHandler = new DebouncedErrorHandler();

