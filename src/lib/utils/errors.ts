/**
 * Structured error handling system for DevVault
 * Apple Principal Engineer ICT Level 7 Standards
 */

export enum ErrorCode {
	// File System Errors
	FILE_NOT_FOUND = 'FILE_NOT_FOUND',
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	INVALID_PATH = 'INVALID_PATH',
	PATH_TRAVERSAL = 'PATH_TRAVERSAL',
	FILE_TOO_LARGE = 'FILE_TOO_LARGE',
	INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
	IO_ERROR = 'IO_ERROR',

	// Database Errors
	DATABASE_ERROR = 'DATABASE_ERROR',
	QUERY_FAILED = 'QUERY_FAILED',
	TRANSACTION_FAILED = 'TRANSACTION_FAILED',

	// Network Errors
	NETWORK_ERROR = 'NETWORK_ERROR',
	TIMEOUT = 'TIMEOUT',
	SYNC_FAILED = 'SYNC_FAILED',

	// Validation Errors
	INVALID_INPUT = 'INVALID_INPUT',
	VALIDATION_FAILED = 'VALIDATION_FAILED',

	// Auth Errors
	UNAUTHORIZED = 'UNAUTHORIZED',
	FORBIDDEN = 'FORBIDDEN',
	SESSION_EXPIRED = 'SESSION_EXPIRED',

	// Generic Errors
	OPERATION_FAILED = 'OPERATION_FAILED',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorDetails {
	code: ErrorCode;
	message: string;
	details?: string;
	timestamp?: Date;
	context?: Record<string, unknown>;
}

export class AppError extends Error {
	public readonly code: ErrorCode;
	public readonly details?: string;
	public readonly timestamp: Date;
	public readonly context?: Record<string, unknown>;

	constructor(code: ErrorCode, message: string, details?: string, context?: Record<string, unknown>) {
		super(message);
		this.name = 'AppError';
		this.code = code;
		this.details = details;
		this.timestamp = new Date();
		this.context = context;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AppError);
		}
	}

	toJSON(): ErrorDetails {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
			timestamp: this.timestamp,
			context: this.context,
		};
	}

	static fromTauriError(error: unknown): AppError {
		if (typeof error === 'object' && error !== null) {
			const err = error as { code?: string; message?: string };
			const code = (err.code as ErrorCode) || ErrorCode.UNKNOWN_ERROR;
			const message = err.message || 'An unknown error occurred';
			return new AppError(code, message);
		}
		return new AppError(ErrorCode.UNKNOWN_ERROR, String(error));
	}

	static fromDatabaseError(error: unknown): AppError {
		const message = error instanceof Error ? error.message : String(error);
		return new AppError(ErrorCode.DATABASE_ERROR, 'Database operation failed', message);
	}

	static fromNetworkError(error: unknown): AppError {
		const message = error instanceof Error ? error.message : String(error);
		return new AppError(ErrorCode.NETWORK_ERROR, 'Network request failed', message);
	}
}

/**
 * Error severity levels for logging and user feedback
 */
export enum ErrorSeverity {
	INFO = 'info',
	WARNING = 'warning',
	ERROR = 'error',
	CRITICAL = 'critical',
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
	const messages: Record<ErrorCode, string> = {
		[ErrorCode.FILE_NOT_FOUND]: 'The requested file could not be found.',
		[ErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
		[ErrorCode.INVALID_PATH]: 'The file path is invalid.',
		[ErrorCode.PATH_TRAVERSAL]: 'Invalid file path detected.',
		[ErrorCode.FILE_TOO_LARGE]: 'The file is too large to process.',
		[ErrorCode.INVALID_FILE_TYPE]: 'This file type is not supported.',
		[ErrorCode.IO_ERROR]: 'An error occurred while accessing the file system.',
		[ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
		[ErrorCode.QUERY_FAILED]: 'Failed to retrieve data. Please try again.',
		[ErrorCode.TRANSACTION_FAILED]: 'Failed to save changes. Please try again.',
		[ErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
		[ErrorCode.TIMEOUT]: 'The operation timed out. Please try again.',
		[ErrorCode.SYNC_FAILED]: 'Failed to sync data. Please try again later.',
		[ErrorCode.INVALID_INPUT]: 'The provided input is invalid.',
		[ErrorCode.VALIDATION_FAILED]: 'Validation failed. Please check your input.',
		[ErrorCode.UNAUTHORIZED]: 'You must be logged in to perform this action.',
		[ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
		[ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
		[ErrorCode.OPERATION_FAILED]: 'The operation failed. Please try again.',
		[ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
	};

	return messages[error.code] || error.message;
}

/**
 * Get error severity based on error code
 */
export function getErrorSeverity(code: ErrorCode): ErrorSeverity {
	const criticalErrors = [
		ErrorCode.DATABASE_ERROR,
		ErrorCode.TRANSACTION_FAILED,
		ErrorCode.PERMISSION_DENIED,
	];

	const warningErrors = [
		ErrorCode.FILE_NOT_FOUND,
		ErrorCode.TIMEOUT,
		ErrorCode.SYNC_FAILED,
	];

	if (criticalErrors.includes(code)) {
		return ErrorSeverity.CRITICAL;
	} else if (warningErrors.includes(code)) {
		return ErrorSeverity.WARNING;
	} else {
		return ErrorSeverity.ERROR;
	}
}

