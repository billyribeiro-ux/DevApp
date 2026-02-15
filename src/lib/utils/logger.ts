/**
 * Structured logging utility for DevVault
 * Apple Principal Engineer ICT Level 7 Standards
 */

export enum LogLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
}

export interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: Date;
	context?: Record<string, unknown>;
	error?: Error;
}

class Logger {
	private isDevelopment: boolean;

	constructor() {
		this.isDevelopment = import.meta.env.DEV;
	}

	private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date(),
			context,
			error,
		};

		// In development, use console with colors
		if (this.isDevelopment) {
			const styles: Record<LogLevel, string> = {
				[LogLevel.DEBUG]: 'color: #6B7280',
				[LogLevel.INFO]: 'color: #3B82F6',
				[LogLevel.WARN]: 'color: #F59E0B',
				[LogLevel.ERROR]: 'color: #EF4444; font-weight: bold',
			};

			const timestamp = entry.timestamp.toISOString();
			const prefix = `[${timestamp}] [${level}]`;

			console.log(`%c${prefix} ${message}`, styles[level]);

			if (context) {
				console.log('Context:', context);
			}

			if (error) {
				console.error('Error:', error);
			}
		} else {
			// In production, use structured JSON logging
			console.log(JSON.stringify(entry));
		}

		// TODO: Send to error tracking service (Sentry) in production
		if (!this.isDevelopment && level === LogLevel.ERROR) {
			this.sendToErrorTracking(entry);
		}
	}

	private sendToErrorTracking(entry: LogEntry) {
		// TODO: Integrate with Sentry or similar service
		// For now, just log to console
		console.error('Error tracking:', entry);
	}

	debug(message: string, context?: Record<string, unknown>) {
		if (this.isDevelopment) {
			this.log(LogLevel.DEBUG, message, context);
		}
	}

	info(message: string, context?: Record<string, unknown>) {
		this.log(LogLevel.INFO, message, context);
	}

	warn(message: string, context?: Record<string, unknown>) {
		this.log(LogLevel.WARN, message, context);
	}

	error(message: string, error?: Error, context?: Record<string, unknown>) {
		this.log(LogLevel.ERROR, message, context, error);
	}

	/**
	 * Log performance metrics
	 */
	performance(operation: string, duration: number, context?: Record<string, unknown>) {
		this.info(`Performance: ${operation}`, {
			...context,
			duration_ms: duration,
		});
	}

	/**
	 * Create a performance timer
	 */
	startTimer(operation: string): () => void {
		const start = performance.now();
		return () => {
			const duration = performance.now() - start;
			this.performance(operation, duration);
		};
	}
}

// Export singleton instance
export const logger = new Logger();

/**
 * Decorator for logging function calls (for future use)
 */
export function logCall(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
	const originalMethod = descriptor.value;

	descriptor.value = async function (...args: unknown[]) {
		const endTimer = logger.startTimer(`${propertyKey}`);
		try {
			const result = await originalMethod.apply(this, args);
			endTimer();
			return result;
		} catch (error) {
			logger.error(`Error in ${propertyKey}`, error as Error);
			endTimer();
			throw error;
		}
	};

	return descriptor;
}

