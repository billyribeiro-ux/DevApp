<script lang="ts">
  import type { VaultFile } from '$types';
  import { open } from '@tauri-apps/plugin-dialog';
  import { readFile, stat } from '@tauri-apps/plugin-fs';
  import { getExtension } from '$utils/formatters';
  import Icon from '@iconify/svelte';
  import DropZone from '$components/ui/DropZone.svelte';
  import { v4 as uuid } from 'uuid';

  let {
    folderId,
    onupload,
  }: {
    folderId: string;
    onupload: (files: VaultFile[]) => void;
  } = $props();

  /** Track individual file upload progress */
  interface UploadEntry {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    error?: string;
  }

  let uploads = $state<UploadEntry[]>([]);
  let isUploading = $state(false);

  let hasActiveUploads = $derived(uploads.some(u => u.status === 'pending' || u.status === 'uploading'));

  /**
   * Open the native file dialog via Tauri and process selected files.
   */
  async function handleBrowse() {
    try {
      const selected = await open({
        multiple: true,
        title: 'Select files to upload',
      });

      if (!selected || selected.length === 0) return;

      // Convert selected paths to upload entries
      const entries: UploadEntry[] = [];
      for (const filePath of selected) {
        const pathStr = typeof filePath === 'string' ? filePath : filePath.path;
        const name = pathStr.split(/[\\/]/).pop() ?? pathStr;
        let size = 0;
        try {
          const fileStat = await stat(pathStr);
          size = fileStat.size;
        } catch {
          // Fallback: size unknown
        }
        entries.push({
          id: uuid(),
          name,
          size,
          progress: 0,
          status: 'pending',
        });
      }

      uploads = [...uploads, ...entries];
      await processUploads(entries, selected);
    } catch (err) {
      console.error('[FileUploader] browse error:', err);
    }
  }

  /**
   * Handle files dropped via the DropZone component.
   */
  function handleFileDrop(droppedFiles: File[]) {
    if (droppedFiles.length === 0) return;

    const entries: UploadEntry[] = droppedFiles.map(f => ({
      id: uuid(),
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'pending' as const,
    }));

    uploads = [...uploads, ...entries];
    processDroppedFiles(entries, droppedFiles);
  }

  /**
   * Process files selected through the native dialog (Tauri paths).
   */
  async function processUploads(entries: UploadEntry[], selected: (string | { path: string })[]) {
    isUploading = true;
    const completedFiles: VaultFile[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const filePath = selected[i];
      const pathStr = typeof filePath === 'string' ? filePath : filePath.path;

      // Update status to uploading
      updateEntry(entry.id, { status: 'uploading', progress: 10 });

      try {
        // Read the file to simulate/process upload
        await readFile(pathStr);
        updateEntry(entry.id, { progress: 50 });

        // Simulate processing delay for visual feedback
        await delay(150);
        updateEntry(entry.id, { progress: 90 });

        const ext = getExtension(entry.name);
        const now = new Date().toISOString();

        const vaultFile: VaultFile = {
          id: entry.id,
          folder_id: folderId,
          name: entry.name,
          extension: ext || null,
          mime_type: null,
          size_bytes: entry.size,
          local_path: pathStr,
          cloud_path: null,
          content_hash: null,
          thumbnail_path: null,
          is_favorited: 0,
          is_pinned: 0,
          open_count: 0,
          last_opened_at: null,
          created_at: now,
          updated_at: now,
          synced_at: null,
          is_deleted: 0,
        };

        completedFiles.push(vaultFile);
        updateEntry(entry.id, { status: 'complete', progress: 100 });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        updateEntry(entry.id, { status: 'error', error: message, progress: 0 });
      }
    }

    isUploading = false;

    if (completedFiles.length > 0) {
      onupload(completedFiles);
    }

    // Clear completed entries after a short delay
    setTimeout(() => {
      uploads = uploads.filter(u => u.status !== 'complete');
    }, 2000);
  }

  /**
   * Process files dropped from the OS (browser File objects).
   */
  async function processDroppedFiles(entries: UploadEntry[], droppedFiles: File[]) {
    isUploading = true;
    const completedFiles: VaultFile[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const file = droppedFiles[i];

      updateEntry(entry.id, { status: 'uploading', progress: 10 });

      try {
        // Read the file as ArrayBuffer to simulate processing
        await file.arrayBuffer();
        updateEntry(entry.id, { progress: 50 });

        await delay(150);
        updateEntry(entry.id, { progress: 90 });

        const ext = getExtension(entry.name);
        const now = new Date().toISOString();

        const vaultFile: VaultFile = {
          id: entry.id,
          folder_id: folderId,
          name: entry.name,
          extension: ext || null,
          mime_type: file.type || null,
          size_bytes: file.size,
          local_path: null,
          cloud_path: null,
          content_hash: null,
          thumbnail_path: null,
          is_favorited: 0,
          is_pinned: 0,
          open_count: 0,
          last_opened_at: null,
          created_at: now,
          updated_at: now,
          synced_at: null,
          is_deleted: 0,
        };

        completedFiles.push(vaultFile);
        updateEntry(entry.id, { status: 'complete', progress: 100 });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        updateEntry(entry.id, { status: 'error', error: message, progress: 0 });
      }
    }

    isUploading = false;

    if (completedFiles.length > 0) {
      onupload(completedFiles);
    }

    setTimeout(() => {
      uploads = uploads.filter(u => u.status !== 'complete');
    }, 2000);
  }

  /** Update a single upload entry by id */
  function updateEntry(id: string, patch: Partial<UploadEntry>) {
    uploads = uploads.map(u => (u.id === id ? { ...u, ...patch } : u));
  }

  function removeEntry(id: string) {
    uploads = uploads.filter(u => u.id !== id);
  }

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getStatusIcon(status: UploadEntry['status']): string {
    switch (status) {
      case 'pending': return 'ph:clock';
      case 'uploading': return 'ph:spinner';
      case 'complete': return 'ph:check-circle-fill';
      case 'error': return 'ph:warning-circle-fill';
    }
  }

  function getStatusColor(status: UploadEntry['status']): string {
    switch (status) {
      case 'pending': return 'var(--text-tertiary)';
      case 'uploading': return 'var(--color-primary-500)';
      case 'complete': return 'var(--color-success)';
      case 'error': return 'var(--color-error)';
    }
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Upload button + Drop zone -->
  <DropZone onfiledrop={handleFileDrop}>
    <div class="flex flex-col items-center gap-3 py-10 px-6">
      <div
        class="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-200"
        style="background: var(--bg-surface-raised);"
      >
        <Icon
          icon="ph:upload-simple"
          width={28}
          height={28}
          style="color: var(--text-tertiary);"
        />
      </div>

      <div class="text-center">
        <p class="text-sm font-semibold" style="color: var(--text-primary);">
          Drop files here
        </p>
        <p class="text-xs mt-1" style="color: var(--text-tertiary);">
          or click the button below to browse
        </p>
      </div>

      <button
        class="mt-2 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
          transition-all duration-150
          bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)]
          active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        onclick={handleBrowse}
        disabled={isUploading}
      >
        <Icon icon="ph:folder-open" class="text-base" />
        {isUploading ? 'Uploading...' : 'Upload Files'}
      </button>
    </div>
  </DropZone>

  <!-- Upload progress list -->
  {#if uploads.length > 0}
    <div class="flex flex-col gap-2">
      <h4 class="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
        Uploads ({uploads.filter(u => u.status === 'complete').length}/{uploads.length})
      </h4>

      {#each uploads as entry (entry.id)}
        <div
          class="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5"
        >
          <!-- Status icon -->
          <Icon
            icon={getStatusIcon(entry.status)}
            class="shrink-0 text-base {entry.status === 'uploading' ? 'animate-spin' : ''}"
            style="color: {getStatusColor(entry.status)};"
          />

          <!-- File info -->
          <div class="flex-1 min-w-0">
            <p class="truncate text-sm text-[var(--text-primary)]">{entry.name}</p>
            {#if entry.error}
              <p class="text-xs text-[var(--color-error)] mt-0.5">{entry.error}</p>
            {/if}
          </div>

          <!-- Progress bar -->
          {#if entry.status === 'uploading' || entry.status === 'pending'}
            <div class="w-20 h-1.5 rounded-full bg-[var(--bg-surface-raised)] overflow-hidden shrink-0">
              <div
                class="h-full rounded-full transition-all duration-300 ease-out"
                style="width: {entry.progress}%; background: var(--color-primary-500);"
              ></div>
            </div>
          {/if}

          <!-- Remove button (for completed/errored) -->
          {#if entry.status === 'complete' || entry.status === 'error'}
            <button
              class="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md
                hover:bg-[var(--bg-surface-raised)] text-[var(--text-tertiary)]
                hover:text-[var(--text-secondary)] transition-colors"
              title="Dismiss"
              onclick={() => removeEntry(entry.id)}
            >
              <Icon icon="ph:x" class="text-xs" />
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
