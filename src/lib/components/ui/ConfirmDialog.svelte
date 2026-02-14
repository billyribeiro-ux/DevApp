<script lang="ts">
	import Icon from '@iconify/svelte';

	let {
		open = $bindable(false),
		title = 'Confirm Action',
		description = 'Are you sure? This action cannot be undone.',
		confirmLabel = 'Delete',
		cancelLabel = 'Cancel',
		variant = 'danger' as 'danger' | 'warning' | 'info',
		onconfirm,
		oncancel,
	}: {
		open: boolean;
		title?: string;
		description?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'danger' | 'warning' | 'info';
		onconfirm?: () => void;
		oncancel?: () => void;
	} = $props();

	function handleConfirm() {
		onconfirm?.();
		open = false;
	}

	function handleCancel() {
		oncancel?.();
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') handleCancel();
		if (e.key === 'Enter') handleConfirm();
	}

	const iconMap = {
		danger: 'ph:warning-circle-bold',
		warning: 'ph:warning-bold',
		info: 'ph:info-bold',
	};

	const colorMap = {
		danger: 'var(--color-error)',
		warning: 'var(--color-warning)',
		info: 'var(--color-info)',
	};

	const bgMap = {
		danger: 'var(--color-error-light)',
		warning: 'var(--color-warning-light)',
		info: 'var(--color-info-light)',
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center"
		style="background: var(--bg-overlay);"
		onclick={handleCancel}
		role="presentation"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="w-full max-w-sm rounded-2xl border p-6 animate-scale-in"
			style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-xl);"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
		>
			<div class="flex items-start gap-4 mb-5">
				<div class="rounded-xl p-2.5 shrink-0" style="background: {bgMap[variant]};">
					<Icon icon={iconMap[variant]} width={22} height={22} style="color: {colorMap[variant]};" />
				</div>
				<div>
					<h3 class="text-[16px] font-semibold" style="color: var(--text-primary);">{title}</h3>
					<p class="text-[14px] mt-1 leading-relaxed" style="color: var(--text-secondary);">{description}</p>
				</div>
			</div>
			<div class="flex justify-end gap-2">
				<button onclick={handleCancel} class="btn-ghost">{cancelLabel}</button>
				{#if variant === 'danger'}
					<button
						onclick={handleConfirm}
						class="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer transition-all"
						style="background: var(--color-error);"
					>
						{confirmLabel}
					</button>
				{:else}
					<button onclick={handleConfirm} class="btn-primary">{confirmLabel}</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
