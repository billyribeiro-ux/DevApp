<script lang="ts">
  import type { VaultFile } from '$types';
  import { getFileTypeInfo } from '$config/constants';
  import { formatFileSize, formatRelativeDate, getExtension } from '$utils/formatters';
  import Icon from '@iconify/svelte';

  let {
    files,
    selectedIds,
    onselect,
    onopen,
  }: {
    files: VaultFile[];
    selectedIds: Set<string>;
    onselect: (id: string, multi: boolean) => void;
    onopen: (id: string) => void;
  } = $props();

  /** Sort state */
  type SortKey = 'name' | 'size_bytes' | 'extension' | 'updated_at';
  type SortDirection = 'asc' | 'desc';

  let sortKey = $state<SortKey>('name');
  let sortDirection = $state<SortDirection>('asc');

  /** Sorted files derived from current sort state */
  let sortedFiles = $derived.by(() => {
    const sorted = [...files];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'size_bytes':
          cmp = a.size_bytes - b.size_bytes;
          break;
        case 'extension': {
          const extA = a.extension ?? getExtension(a.name);
          const extB = b.extension ?? getExtension(b.name);
          cmp = extA.localeCompare(extB, undefined, { sensitivity: 'base' });
          break;
        }
        case 'updated_at':
          cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = 'asc';
    }
  }

  function getSortIcon(key: SortKey): string {
    if (sortKey !== key) return 'ph:caret-up-down';
    return sortDirection === 'asc' ? 'ph:caret-up-fill' : 'ph:caret-down-fill';
  }

  function handleRowClick(e: MouseEvent, fileId: string) {
    onselect(fileId, e.ctrlKey || e.metaKey);
  }

  function handleRowDblClick(fileId: string) {
    onopen(fileId);
  }

  function handleRowKeydown(e: KeyboardEvent, fileId: string) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onopen(fileId);
    }
    if (e.key === ' ') {
      e.preventDefault();
      onselect(fileId, false);
    }
  }

  function handleFavorite(e: MouseEvent, _fileId: string) {
    e.stopPropagation();
    // Placeholder: toggle favorite via service
    console.debug('[FileList] toggle favorite:', _fileId);
  }

  function handleOpenInSystem(e: MouseEvent, _fileId: string) {
    e.stopPropagation();
    // Placeholder: open file in system default app via Tauri shell
    console.debug('[FileList] open in system:', _fileId);
  }

  function handleDelete(e: MouseEvent, _fileId: string) {
    e.stopPropagation();
    // Placeholder: soft-delete file
    console.debug('[FileList] delete:', _fileId);
  }

  /** Column definitions for the header */
  const columns: { key: SortKey; label: string; class: string }[] = [
    { key: 'name', label: 'Name', class: 'flex-1 min-w-0' },
    { key: 'size_bytes', label: 'Size', class: 'w-24 shrink-0 text-right' },
    { key: 'extension', label: 'Type', class: 'w-20 shrink-0' },
    { key: 'updated_at', label: 'Modified', class: 'w-32 shrink-0' },
  ];
</script>

{#if files.length === 0}
  <!-- Empty state -->
  <div class="flex flex-col items-center justify-center py-20 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-surface-raised)] mb-4">
      <Icon icon="ph:cloud-arrow-up" class="text-3xl text-[var(--text-tertiary)]" />
    </div>
    <h3 class="text-base font-semibold text-[var(--text-primary)] mb-1">No files yet</h3>
    <p class="text-sm text-[var(--text-tertiary)] max-w-xs">
      Drag &amp; drop or upload files to get started.
    </p>
  </div>
{:else}
  <div class="w-full overflow-x-auto" role="table" aria-label="File list">
    <!-- Header row -->
    <div
      class="flex items-center gap-3 border-b border-[var(--border-default)] px-3 py-2 text-xs font-medium
        uppercase tracking-wider text-[var(--text-tertiary)] select-none"
      role="row"
    >
      {#each columns as col (col.key)}
        <button
          class="flex items-center gap-1 {col.class} hover:text-[var(--text-secondary)] transition-colors"
          onclick={() => handleSort(col.key)}
          role="columnheader"
          aria-sort={sortKey === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <span>{col.label}</span>
          <Icon icon={getSortIcon(col.key)} class="text-[11px]" />
        </button>
      {/each}
      <!-- Actions column header -->
      <div class="w-24 shrink-0 text-right" role="columnheader">
        <span>Actions</span>
      </div>
    </div>

    <!-- File rows -->
    <div class="flex flex-col" role="rowgroup">
      {#each sortedFiles as file (file.id)}
        {@const ext = file.extension ?? getExtension(file.name)}
        {@const typeInfo = getFileTypeInfo(ext)}
        {@const isSelected = selectedIds.has(file.id)}

        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-100 cursor-pointer
            {isSelected
              ? 'bg-[var(--color-primary-600)]/10 text-[var(--text-primary)]'
              : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]'}
          "
          role="row"
          tabindex="0"
          aria-selected={isSelected}
          onclick={(e) => handleRowClick(e, file.id)}
          ondblclick={() => handleRowDblClick(file.id)}
          onkeydown={(e) => handleRowKeydown(e, file.id)}
        >
          <!-- Name cell with icon -->
          <div class="flex flex-1 min-w-0 items-center gap-2.5">
            <Icon
              icon={typeInfo.icon}
              class="shrink-0 text-lg"
              style="color: {typeInfo.color}"
            />
            <span class="truncate text-sm" title={file.name}>
              {file.name}
            </span>
            {#if file.is_favorited === 1}
              <Icon icon="ph:star-fill" class="shrink-0 text-xs text-amber-400" />
            {/if}
          </div>

          <!-- Size -->
          <div class="w-24 shrink-0 text-right text-xs text-[var(--text-tertiary)]">
            {formatFileSize(file.size_bytes)}
          </div>

          <!-- Type -->
          <div class="w-20 shrink-0 text-xs text-[var(--text-tertiary)] uppercase">
            {ext || '--'}
          </div>

          <!-- Modified -->
          <div class="w-32 shrink-0 text-xs text-[var(--text-tertiary)]">
            {formatRelativeDate(file.updated_at)}
          </div>

          <!-- Actions -->
          <div class="w-24 shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="inline-flex items-center justify-center w-7 h-7 rounded-md
                hover:bg-[var(--bg-surface-raised)] text-[var(--text-tertiary)] hover:text-amber-400
                transition-colors"
              title={file.is_favorited === 1 ? 'Unfavorite' : 'Favorite'}
              onclick={(e) => handleFavorite(e, file.id)}
            >
              <Icon icon={file.is_favorited === 1 ? 'ph:star-fill' : 'ph:star'} class="text-sm" />
            </button>

            <button
              class="inline-flex items-center justify-center w-7 h-7 rounded-md
                hover:bg-[var(--bg-surface-raised)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]
                transition-colors"
              title="Open in system"
              onclick={(e) => handleOpenInSystem(e, file.id)}
            >
              <Icon icon="ph:arrow-square-out" class="text-sm" />
            </button>

            <button
              class="inline-flex items-center justify-center w-7 h-7 rounded-md
                hover:bg-[var(--color-error)]/10 text-[var(--text-tertiary)] hover:text-[var(--color-error)]
                transition-colors"
              title="Delete"
              onclick={(e) => handleDelete(e, file.id)}
            >
              <Icon icon="ph:trash" class="text-sm" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
