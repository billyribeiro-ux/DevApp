<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { vault, ui, nav, toasts } from '$stores/app.svelte';
	import { getFolders, getSubfolders, getFiles, createFile, createFolder, deleteFile, updateFile } from '$services/database';
	import { formatFileSize, formatRelativeDate, getExtension } from '$utils/formatters';
	import { getFileTypeInfo, FOLDER_TYPE_META } from '$config/constants';
	import type { Folder, VaultFile } from '$types';
	import { v4 as uuid } from 'uuid';

	let currentFiles = $state<VaultFile[]>([]);
	let subfolders = $state<Folder[]>([]);
	let breadcrumbs = $state<{ id: string | null; name: string }[]>([{ id: null, name: 'Vault' }]);
	let dragOver = $state(false);
	let sortBy = $state<'name' | 'date' | 'size' | 'type'>('name');
	let sortAsc = $state(true);
	let showNewFolderInput = $state(false);
	let newFolderName = $state('');

	let sortedFiles = $derived(() => {
		const files = [...currentFiles];
		files.sort((a, b) => {
			let cmp = 0;
			if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
			else if (sortBy === 'date') cmp = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
			else if (sortBy === 'size') cmp = b.size_bytes - a.size_bytes;
			else if (sortBy === 'type') cmp = (a.extension ?? '').localeCompare(b.extension ?? '');
			return sortAsc ? cmp : -cmp;
		});
		return files;
	});

	async function loadFolder(folderId: string | null) {
		vault.currentFolderId = folderId;
		if (folderId) {
			currentFiles = await getFiles(folderId);
			subfolders = await getSubfolders(folderId);
		} else {
			currentFiles = [];
			subfolders = vault.rootFolders;
		}
	}

	async function navigateToFolder(folderId: string, name: string) {
		const idx = breadcrumbs.findIndex(b => b.id === folderId);
		if (idx >= 0) {
			breadcrumbs = breadcrumbs.slice(0, idx + 1);
		} else {
			breadcrumbs = [...breadcrumbs, { id: folderId, name }];
		}
		await loadFolder(folderId);
	}

	async function navigateToBreadcrumb(index: number) {
		breadcrumbs = breadcrumbs.slice(0, index + 1);
		await loadFolder(breadcrumbs[index].id);
	}

	async function handleFileDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (!e.dataTransfer?.files.length || !vault.currentFolderId) return;

		for (const file of Array.from(e.dataTransfer.files)) {
			const ext = getExtension(file.name);
			const id = uuid();
			await createFile({
				id,
				folder_id: vault.currentFolderId,
				name: file.name,
				extension: ext || null,
				mime_type: file.type || null,
				size_bytes: file.size,
			});
		}
		toasts.success('Files Added', `${e.dataTransfer.files.length} file(s) added to vault`);
		await loadFolder(vault.currentFolderId);
	}

	async function handleCreateFolder() {
		if (!newFolderName.trim() || !vault.currentWorkspaceId) return;
		await createFolder({
			id: uuid(),
			workspace_id: vault.currentWorkspaceId,
			parent_id: vault.currentFolderId,
			name: newFolderName.trim(),
			folder_type: 'general',
			sort_order: subfolders.length
		});
		newFolderName = '';
		showNewFolderInput = false;
		toasts.success('Folder Created');
		// Reload
		if (vault.currentFolderId) {
			subfolders = await getSubfolders(vault.currentFolderId);
		} else {
			vault.folders = await getFolders(vault.currentWorkspaceId);
			subfolders = vault.rootFolders;
		}
	}

	async function handleDeleteFile(id: string) {
		await deleteFile(id);
		toasts.success('File Moved to Trash');
		if (vault.currentFolderId) await loadFolder(vault.currentFolderId);
	}

	async function toggleFavorite(file: VaultFile) {
		await updateFile(file.id, { is_favorited: file.is_favorited ? 0 : 1 });
		if (vault.currentFolderId) await loadFolder(vault.currentFolderId);
	}

	onMount(async () => {
		nav.navigate('/vault');
		subfolders = vault.rootFolders;
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col h-full overflow-hidden"
	ondragover={(e) => { e.preventDefault(); dragOver = true; }}
	ondragleave={() => { dragOver = false; }}
	ondrop={handleFileDrop}
>
	<!-- Header -->
	<div class="flex items-center justify-between px-8 py-5 border-b shrink-0" style="border-color: var(--border-default);">
		<div class="flex items-center gap-2">
			{#each breadcrumbs as crumb, i}
				{#if i > 0}
					<Icon icon="ph:caret-right" width={14} height={14} style="color: var(--text-tertiary);" />
				{/if}
				<button
					onclick={() => navigateToBreadcrumb(i)}
					class="text-[14px] font-medium px-1.5 py-0.5 rounded-md transition-colors"
					style="color: {i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)'};"
				>
					{crumb.name}
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-2">
			<button onclick={() => { showNewFolderInput = !showNewFolderInput; }} class="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-colors" style="border-color: var(--border-default); color: var(--text-secondary);">
				<Icon icon="ph:folder-plus-bold" width={16} height={16} />
				New Folder
			</button>
			<button onclick={() => ui.setViewMode(ui.viewMode === 'grid' ? 'list' : 'grid')} class="rounded-xl border p-2 transition-colors" style="border-color: var(--border-default); color: var(--text-secondary);" title="Toggle view">
				<Icon icon={ui.viewMode === 'grid' ? 'ph:list-bold' : 'ph:grid-four-bold'} width={18} height={18} />
			</button>
		</div>
	</div>

	<!-- New folder input -->
	{#if showNewFolderInput}
		<div class="flex items-center gap-2 px-8 py-3 border-b animate-slide-down" style="border-color: var(--border-default); background: var(--bg-surface);">
			<Icon icon="ph:folder-bold" width={18} height={18} style="color: var(--text-accent);" />
			<input
				type="text"
				bind:value={newFolderName}
				placeholder="Folder name..."
				class="input-field-sm flex-1"
				style="color: var(--text-primary);"
				onkeydown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') showNewFolderInput = false; }}
			/>
			<button onclick={handleCreateFolder} class="rounded-xl px-4 py-2 text-sm font-medium text-white" style="background: var(--color-primary-600);">Create</button>
			<button onclick={() => { showNewFolderInput = false; }} class="rounded-xl px-3 py-2 text-sm" style="color: var(--text-tertiary);">Cancel</button>
		</div>
	{/if}

	<!-- Content -->
	<div class="flex-1 overflow-y-auto px-8 py-6">
		{#if dragOver}
			<div class="flex flex-col items-center justify-center h-full rounded-2xl border-2 border-dashed transition-all" style="border-color: var(--color-primary-500); background: var(--bg-active);">
				<Icon icon="ph:upload-bold" width={56} height={56} style="color: var(--color-primary-500);" />
				<p class="mt-3 text-xl font-medium" style="color: var(--text-accent);">Drop files here</p>
				<p class="text-sm" style="color: var(--text-secondary);">Files will be added to the current folder</p>
			</div>
		{:else}
			<!-- Subfolders -->
			{#if subfolders.length > 0}
				<div class="mb-6">
					<h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--text-tertiary);">Folders</h3>
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
						{#each subfolders as folder}
							{@const meta = FOLDER_TYPE_META[folder.folder_type] ?? FOLDER_TYPE_META.general}
							<button
								onclick={() => navigateToFolder(folder.id, folder.name)}
								class="flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-150 hover:shadow-sm"
								style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);"
							>
								<div class="rounded-lg p-2 shrink-0" style="background: {folder.color ?? meta.color}15;">
									<Icon icon={folder.icon ?? meta.icon} width={22} height={22} style="color: {folder.color ?? meta.color};" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium truncate" style="color: var(--text-primary);">{folder.name}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">{folder.folder_type.replace('_', ' ')}</p>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Files -->
			{#if currentFiles.length > 0}
				<div>
					<div class="flex items-center justify-between mb-3">
						<h3 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">Files ({currentFiles.length})</h3>
						<div class="flex items-center gap-1">
							{#each ['name', 'date', 'size', 'type'] as s}
								<button
									onclick={() => { if (sortBy === s) sortAsc = !sortAsc; else { sortBy = s as typeof sortBy; sortAsc = true; } }}
									class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
									style="color: {sortBy === s ? 'var(--text-accent)' : 'var(--text-tertiary)'}; background: {sortBy === s ? 'var(--bg-active)' : 'transparent'};"
								>
									{s.charAt(0).toUpperCase() + s.slice(1)}
									{#if sortBy === s}
										<Icon icon={sortAsc ? 'ph:arrow-up' : 'ph:arrow-down'} width={10} height={10} style="display: inline;" />
									{/if}
								</button>
							{/each}
						</div>
					</div>

					{#if ui.viewMode === 'grid'}
						<div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
							{#each sortedFiles() as file (file.id)}
								{@const typeInfo = getFileTypeInfo(file.extension)}
								<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
								<div
									class="group relative flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all duration-150 hover:shadow-md cursor-pointer"
									style="background: var(--bg-card); border-color: {vault.selectedFileIds.has(file.id) ? 'var(--color-primary-500)' : 'var(--border-default)'}; box-shadow: var(--shadow-card);"
									onclick={(e) => vault.selectFile(file.id, e.metaKey || e.ctrlKey)}
									role="button"
									tabindex="0"
								>
									{#if file.is_favorited}
										<div class="absolute top-2 right-2">
											<Icon icon="ph:star-fill" width={14} height={14} style="color: var(--color-warning);" />
										</div>
									{/if}
									<div class="rounded-xl p-3" style="background: {typeInfo.color}10;">
										<Icon icon={typeInfo.icon} width={36} height={36} style="color: {typeInfo.color};" />
									</div>
									<p class="text-xs font-medium text-center truncate w-full" style="color: var(--text-primary);">{file.name}</p>
									<p class="text-[10px]" style="color: var(--text-tertiary);">{formatFileSize(file.size_bytes)}</p>
									<!-- Hover actions -->
									<div class="absolute bottom-2 right-2 hidden group-hover:flex items-center gap-1">
										<button onclick={(e) => { e.stopPropagation(); toggleFavorite(file); }} class="rounded-md p-1" style="background: var(--bg-surface-raised);">
											<Icon icon={file.is_favorited ? 'ph:star-fill' : 'ph:star'} width={12} height={12} style="color: var(--color-warning);" />
										</button>
										<button onclick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} class="rounded-md p-1" style="background: var(--bg-surface-raised);">
											<Icon icon="ph:trash" width={12} height={12} style="color: var(--color-error);" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<!-- List view -->
						<div class="rounded-2xl border overflow-hidden" style="border-color: var(--border-default);">
							<div class="grid grid-cols-[1fr,80px,80px,100px,60px] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider border-b" style="color: var(--text-tertiary); border-color: var(--border-default); background: var(--bg-surface);">
								<span>Name</span><span>Size</span><span>Type</span><span>Modified</span><span></span>
							</div>
							{#each sortedFiles() as file (file.id)}
								{@const typeInfo = getFileTypeInfo(file.extension)}
								<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
								<div
									class="grid grid-cols-[1fr,80px,80px,100px,60px] items-center px-4 py-3 border-b transition-colors cursor-pointer"
									style="border-color: var(--border-default); background: {vault.selectedFileIds.has(file.id) ? 'var(--bg-active)' : 'transparent'};"
									onclick={(e) => vault.selectFile(file.id, e.metaKey || e.ctrlKey)}
									role="button"
									tabindex="0"
								>
									<div class="flex items-center gap-2 min-w-0">
										<Icon icon={typeInfo.icon} width={16} height={16} style="color: {typeInfo.color};" />
										<span class="text-sm truncate" style="color: var(--text-primary);">{file.name}</span>
										{#if file.is_favorited}
											<Icon icon="ph:star-fill" width={12} height={12} style="color: var(--color-warning);" />
										{/if}
									</div>
									<span class="text-xs" style="color: var(--text-tertiary);">{formatFileSize(file.size_bytes)}</span>
									<span class="text-xs uppercase" style="color: var(--text-tertiary);">{file.extension ?? '—'}</span>
									<span class="text-xs" style="color: var(--text-tertiary);">{formatRelativeDate(file.updated_at)}</span>
									<div class="flex items-center gap-1">
										<button onclick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} class="rounded-md p-1 opacity-0 hover:opacity-100 transition-opacity">
											<Icon icon="ph:trash" width={14} height={14} style="color: var(--color-error);" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if !subfolders.length}
				<!-- Empty state -->
				<div class="flex flex-col items-center justify-center h-full">
					<div class="rounded-2xl p-6" style="background: var(--bg-surface-raised);">
						<Icon icon="ph:upload" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.5;" />
					</div>
					<p class="mt-4 text-xl font-medium" style="color: var(--text-primary);">This folder is empty</p>
					<p class="text-sm mt-1" style="color: var(--text-tertiary);">Drag & drop files here or click Upload</p>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Status bar -->
	<div class="flex items-center justify-between px-8 py-3 border-t text-[12px] shrink-0" style="border-color: var(--border-default); color: var(--text-tertiary); background: var(--bg-surface);">
		<span>{currentFiles.length} file{currentFiles.length !== 1 ? 's' : ''} &middot; {subfolders.length} folder{subfolders.length !== 1 ? 's' : ''}</span>
		<span>{vault.selectedFileIds.size > 0 ? `${vault.selectedFileIds.size} selected` : ''}</span>
	</div>
</div>

<style>
	button:not(.btn-primary):not(.btn-secondary):not(.btn-ghost):hover {
		background: var(--bg-card-hover);
	}
</style>
