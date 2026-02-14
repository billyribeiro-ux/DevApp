<script lang="ts">
  import Icon from '@iconify/svelte';
  import { vault, sync } from '$stores/app.svelte';
  import { formatFileSize } from '$utils/formatters';

  let currentFolderPath = $derived(() => {
    if (!vault.currentFolder) return 'DevVault';
    const folder = vault.currentFolder;
    return folder.name;
  });

  let fileCount = $derived(vault.files.length);

  let storageUsed = $derived(() => {
    return vault.files.reduce((acc, f) => acc + (f.size_bytes ?? 0), 0);
  });

  const syncIconMap: Record<string, string> = {
    synced: 'ph:cloud-check',
    syncing: 'ph:cloud-arrow-up',
    offline: 'ph:cloud-slash',
    error: 'ph:cloud-warning',
  };

  const syncLabelMap: Record<string, string> = {
    synced: 'Synced',
    syncing: 'Syncing...',
    offline: 'Offline',
    error: 'Error',
  };

  let syncIcon = $derived(syncIconMap[sync.status] ?? 'ph:cloud-slash');
  let syncLabel = $derived(syncLabelMap[sync.status] ?? 'Unknown');

  let syncColor = $derived(
    sync.status === 'synced'
      ? 'var(--color-success)'
      : sync.status === 'syncing'
        ? 'var(--color-info)'
        : sync.status === 'error'
          ? 'var(--color-error)'
          : 'var(--text-tertiary)'
  );
</script>

<footer
  class="flex items-center justify-between px-4 text-[11px] font-medium select-none shrink-0"
  style="
    height: var(--statusbar-height);
    background: var(--bg-surface);
    border-top: 1px solid var(--border-default);
    color: var(--text-tertiary);
  "
  role="status"
  aria-label="Status bar"
>
  <!-- Left: Folder path / breadcrumb -->
  <div class="flex items-center gap-1.5 min-w-0 max-w-[40%]">
    <Icon
      icon="ph:folder-simple"
      width={14}
      height={14}
      style="color: var(--text-tertiary); flex-shrink: 0;"
    />
    <span class="truncate">{currentFolderPath()}</span>
  </div>

  <!-- Center: File count -->
  <div class="flex items-center gap-1.5">
    <Icon
      icon="ph:files"
      width={14}
      height={14}
      style="color: var(--text-tertiary); flex-shrink: 0;"
    />
    <span>
      {fileCount} {fileCount === 1 ? 'item' : 'items'}
    </span>
  </div>

  <!-- Right: Sync status + Storage -->
  <div class="flex items-center gap-4 min-w-0 max-w-[40%]">
    <!-- Sync status -->
    <div class="flex items-center gap-1.5">
      <Icon
        icon={syncIcon}
        width={14}
        height={14}
        class={sync.status === 'syncing' ? 'animate-spin' : ''}
        style="color: {syncColor}; flex-shrink: 0;"
      />
      <span>{syncLabel}</span>
      {#if sync.pendingCount > 0}
        <span
          class="px-1 py-px rounded text-[10px] leading-none"
          style="background: var(--bg-surface-raised); color: var(--text-secondary);"
        >
          {sync.pendingCount} pending
        </span>
      {/if}
    </div>

    <!-- Storage usage -->
    <div class="flex items-center gap-1.5">
      <Icon
        icon="ph:hard-drives"
        width={14}
        height={14}
        style="color: var(--text-tertiary); flex-shrink: 0;"
      />
      <span>{formatFileSize(storageUsed())}</span>
    </div>
  </div>
</footer>
