<script lang="ts">
	/**
	 * Error Boundary Component
	 * Apple Principal Engineer ICT Level 7 Standards
	 * Catches and handles errors in child components
	 */
	import { onMount } from 'svelte';
	import { logger } from '$lib/utils/logger';
	import { handleError } from '$lib/utils/error-handler';

	interface Props {
		children: import('svelte').Snippet;
		fallback?: import('svelte').Snippet<[Error]>;
		onError?: (error: Error) => void;
		context?: string;
	}

	let { children, fallback, onError, context = 'ErrorBoundary' }: Props = $props();

	let error = $state<Error | null>(null);
	let errorInfo = $state<string>('');

	onMount(() => {
		const handleGlobalError = (event: ErrorEvent) => {
			const err = event.error instanceof Error ? event.error : new Error(String(event.error));
			logger.error(`Error caught in ${context}`, err);
			handleError(event.error, context);
			handleComponentError(err);
			event.preventDefault();
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
			logger.error(`Unhandled rejection in ${context}`, err);
			handleError(event.reason, context);
			handleComponentError(err);
			event.preventDefault();
		};

		window.addEventListener('error', handleGlobalError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleGlobalError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	function handleComponentError(err: Error) {
		error = err;
		errorInfo = err.stack || '';
		logger.error(`Error in ${context}`, err);
		handleError(err, context);
		onError?.(err);
	}

	function reset() {
		error = null;
		errorInfo = '';
	}
</script>

{#if error}
	{#if fallback}
		{@render fallback(error)}
	{:else}
		<div
			style="
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				min-height: 400px;
				padding: var(--content-padding);
				background: var(--bg-card);
				border-radius: var(--radius-lg);
				border: 1px solid var(--border-default);
			"
		>
			<div
				style="
					font-size: 48px;
					margin-bottom: 16px;
				"
			>
				⚠️
			</div>
			<h2
				style="
					font-size: var(--text-xl);
					font-weight: 600;
					color: var(--text-primary);
					margin-bottom: 8px;
				"
			>
				Something went wrong
			</h2>
			<p
				style="
					font-size: var(--text-sm);
					color: var(--text-secondary);
					margin-bottom: 24px;
					text-align: center;
					max-width: 500px;
				"
			>
				An unexpected error occurred. Please try refreshing the page or contact support if the
				problem persists.
			</p>
			<button
				onclick={reset}
				style="
					padding: 10px 20px;
					background: var(--color-primary-500);
					color: white;
					border: none;
					border-radius: var(--radius-md);
					font-size: var(--text-sm);
					font-weight: 500;
					cursor: pointer;
					transition: background var(--transition-fast);
				"
			>
				Try Again
			</button>
			{#if import.meta.env.DEV}
				<details
					style="
						margin-top: 24px;
						padding: 16px;
						background: var(--bg-surface);
						border-radius: var(--radius-md);
						max-width: 600px;
						width: 100%;
					"
				>
					<summary
						style="
							cursor: pointer;
							font-size: var(--text-sm);
							font-weight: 500;
							color: var(--text-secondary);
						"
					>
						Error Details (Development Only)
					</summary>
					<pre
						style="
							margin-top: 12px;
							padding: 12px;
							background: var(--bg-app);
							border-radius: var(--radius-sm);
							font-size: 11px;
							color: var(--text-tertiary);
							overflow-x: auto;
							font-family: 'JetBrains Mono', monospace;
						"
					>{errorInfo}</pre>
				</details>
			{/if}
		</div>
	{/if}
{:else}
	{@render children()}
{/if}

