<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getTrashFiles, restoreFile, permanentDeleteFile } from '$services/database';
	import { formatFileSize, formatRelativeDate } from '$utils/formatters';
	import { handleError } from '$lib/utils/error-handler';
	import { getFileTypeInfo } from '$config/constants';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import type { VaultFile } from '$types';

	let trashFiles = $state<VaultFile[]>([]);
	let confirmDeleteOpen = $state(false);
	let confirmEmptyOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);

	async function handleRestore(id: string) {
		try {
			await restoreFile(id);
			trashFiles = await getTrashFiles();
			toasts.success('File Restored');
		} catch (err) { handleError(err, 'Restore File'); }
	}

	function requestDelete(id: string) {
		pendingDeleteId = id;
		confirmDeleteOpen = true;
	}

	async function handlePermanentDelete() {
		if (!pendingDeleteId) return;
		const id = pendingDeleteId;
		pendingDeleteId = null;
		try {
			await permanentDeleteFile(id);
			trashFiles = await getTrashFiles();
			toasts.success('File Permanently Deleted');
		} catch (err) { handleError(err, 'Delete File'); }
	}

	async function emptyTrash() {
		try {
			for (const file of trashFiles) {
				await permanentDeleteFile(file.id);
			}
			trashFiles = [];
			toasts.success('Trash Emptied');
		} catch (err) {
			trashFiles = await getTrashFiles();
			handleError(err, 'Empty Trash');
		}
	}

	onMount(async () => {
		nav.navigate('/trash');
		try { trashFiles = await getTrashFiles(); }
		catch (err) { handleError(err, 'Load Trash'); }
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="page-header">
		<div class="flex items-center gap-3">
			<Icon icon="ph:trash-bold" width={24} height={24} style="color: var(--color-error);" />
			<h1>Trash</h1>
			<span class="rounded-full px-2.5 py-0.5 font-semibold" style="font-size: var(--text-xs); background: var(--color-error-light); color: var(--color-error);">{trashFiles.length}</span>
		</div>
		{#if trashFiles.length > 0}
			<button onclick={() => { confirmEmptyOpen = true; }} class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium" style="color: var(--color-error); border: 1px solid var(--color-error);">
				<Icon icon="ph:trash-bold" width={16} height={16} /> Empty Trash
			</button>
		{/if}
	</div>

	<div class="page-content">
		{#if trashFiles.length > 0}
			<p class="mb-5" style="font-size: var(--text-sm); color: var(--text-tertiary);">Items in trash will be permanently deleted after 30 days.</p>
			<div class="space-y-3">
				{#each trashFiles as file (file.id)}
					{@const typeInfo = getFileTypeInfo(file.extension)}
					<div class="flex items-center gap-4 rounded-2xl border p-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
						<div class="rounded-xl p-2.5 shrink-0" style="background: {typeInfo.color}12;">
							<Icon icon={typeInfo.icon} width={20} height={20} style="color: {typeInfo.color};" />
						</div>
						<div class="flex-1 min-w-0">
							<p class="font-medium truncate" style="font-size: var(--text-base); color: var(--text-primary);">{file.name}</p>
							<p class="mt-0.5" style="font-size: var(--text-sm); color: var(--text-tertiary);">{formatFileSize(file.size_bytes)} &middot; Deleted {formatRelativeDate(file.updated_at)}</p>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<button onclick={() => handleRestore(file.id)} class="rounded-xl px-3 py-1.5 font-medium transition-colors" style="font-size: var(--text-xs); color: var(--text-accent);">Restore</button>
							<button onclick={() => requestDelete(file.id)} class="rounded-xl px-3 py-1.5 font-medium transition-colors" style="font-size: var(--text-xs); color: var(--color-error);">Delete</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-24">
				<Icon icon="ph:trash" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
				<p class="mt-4 text-sm font-medium" style="color: var(--text-tertiary);">Trash is empty</p>
				<p class="text-xs mt-1" style="color: var(--text-tertiary);">Deleted items will appear here</p>
			</div>
		{/if}
	</div>
</div>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Permanently Delete"
	description="This file will be permanently deleted. This cannot be undone."
	confirmLabel="Delete Forever"
	variant="danger"
	onconfirm={handlePermanentDelete}
/>

<ConfirmDialog
	bind:open={confirmEmptyOpen}
	title="Empty Trash"
	description="All {trashFiles.length} items will be permanently deleted. This cannot be undone."
	confirmLabel="Empty Trash"
	variant="danger"
	onconfirm={emptyTrash}
/>
