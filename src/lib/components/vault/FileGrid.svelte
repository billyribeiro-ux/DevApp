<script lang="ts">
  import type { VaultFile } from '$types';
  import { staggerChildren } from '$utils/animations';
  import Icon from '@iconify/svelte';
  import FileCard from './FileCard.svelte';

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

  let gridEl: HTMLElement | undefined = $state();

  /** Stagger animation on mount and when files change */
  $effect(() => {
    // Depend on files array reference so the effect re-runs on change
    const _len = files.length;
    if (gridEl && _len > 0) {
      // Use a microtask so the DOM has rendered the new children
      queueMicrotask(() => {
        staggerChildren(gridEl!, '[data-file-card]', 0.25, 0.04);
      });
    }
  });
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
  <!-- Grid of file cards -->
  <div
    bind:this={gridEl}
    class="grid gap-3"
    style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));"
    role="listbox"
    aria-label="File grid"
    aria-multiselectable="true"
  >
    {#each files as file (file.id)}
      <div data-file-card>
        <FileCard
          {file}
          selected={selectedIds.has(file.id)}
          {onselect}
          {onopen}
        />
      </div>
    {/each}
  </div>
{/if}
