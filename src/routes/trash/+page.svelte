<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getTrashFiles, restoreFile, permanentDeleteFile } from '$services/database';
	import { formatFileSize, formatRelativeDate } from '$utils/formatters';
	import { getFileTypeInfo } from '$config/constants';
	import type { VaultFile } from '$types';

	let trashFiles = $state<VaultFile[]>([]);

	async function handleRestore(id: string) {
		await restoreFile(id);
		trashFiles = await getTrashFiles();
		toasts.success('File Restored');
	}

	async function handlePermanentDelete(id: string) {
		await permanentDeleteFile(id);
		trashFiles = await getTrashFiles();
		toasts.success('File Permanently Deleted');
	}

	async function emptyTrash() {
		for (const file of trashFiles) {
			await permanentDeleteFile(file.id);
		}
		trashFiles = [];
		toasts.success('Trash Emptied');
	}

	onMount(async () => {
		nav.navigate('/trash');
		trashFiles = await getTrashFiles();
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="flex items-center justify-between px-6 py-4 border-b shrink-0" style="border-color: var(--border-default);">
		<div class="flex items-center gap-3">
			<Icon icon="ph:trash-bold" width={22} height={22} style="color: var(--color-error);" />
			<h1 class="text-lg font-bold" style="color: var(--text-primary);">Trash</h1>
			<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" style="background: var(--color-error-light); color: var(--color-error);">{trashFiles.length}</span>
		</div>
		{#if trashFiles.length > 0}
			<button onclick={emptyTrash} class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style="color: var(--color-error); border: 1px solid var(--color-error);">
				<Icon icon="ph:trash-bold" width={14} height={14} /> Empty Trash
			</button>
		{/if}
	</div>

	<div class="flex-1 overflow-y-auto px-6 py-4">
		{#if trashFiles.length > 0}
			<p class="text-xs mb-4" style="color: var(--text-tertiary);">Items in trash will be permanently deleted after 30 days.</p>
			<div class="space-y-2">
				{#each trashFiles as file (file.id)}
					{@const typeInfo = getFileTypeInfo(file.extension)}
					<div class="flex items-center gap-3 rounded-xl border p-3" style="background: var(--bg-card); border-color: var(--border-default);">
						<div class="rounded-lg p-2 shrink-0" style="background: {typeInfo.color}15;">
							<Icon icon={typeInfo.icon} width={18} height={18} style="color: {typeInfo.color};" />
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium truncate" style="color: var(--text-primary);">{file.name}</p>
							<p class="text-xs" style="color: var(--text-tertiary);">{formatFileSize(file.size_bytes)} &middot; Deleted {formatRelativeDate(file.updated_at)}</p>
						</div>
						<div class="flex items-center gap-1 shrink-0">
							<button onclick={() => handleRestore(file.id)} class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors" style="color: var(--text-accent);">Restore</button>
							<button onclick={() => handlePermanentDelete(file.id)} class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors" style="color: var(--color-error);">Delete</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-20">
				<Icon icon="ph:trash" width={48} height={48} style="color: var(--text-tertiary); opacity: 0.3;" />
				<p class="mt-3 text-sm font-medium" style="color: var(--text-tertiary);">Trash is empty</p>
				<p class="text-xs" style="color: var(--text-tertiary);">Deleted items will appear here</p>
			</div>
		{/if}
	</div>
</div>
