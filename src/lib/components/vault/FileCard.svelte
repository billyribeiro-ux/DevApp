<script lang="ts">
  import type { VaultFile } from '$types';
  import { getFileTypeInfo } from '$config/constants';
  import { formatFileSize, formatRelativeDate, getExtension } from '$utils/formatters';
  import Icon from '@iconify/svelte';
  import gsap from 'gsap';

  let {
    file,
    selected,
    onselect,
    onopen,
  }: {
    file: VaultFile;
    selected: boolean;
    onselect: (id: string, multi: boolean) => void;
    onopen: (id: string) => void;
  } = $props();

  let cardEl: HTMLElement | undefined = $state();

  /** Derived file metadata */
  let ext = $derived(file.extension ?? getExtension(file.name));
  let typeInfo = $derived(getFileTypeInfo(ext));
  let formattedSize = $derived(formatFileSize(file.size_bytes));
  let relativeDate = $derived(formatRelativeDate(file.updated_at));
  let isFavorited = $derived(file.is_favorited === 1);

  function handleClick(e: MouseEvent) {
    onselect(file.id, e.ctrlKey || e.metaKey);
  }

  function handleDblClick() {
    onopen(file.id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onopen(file.id);
    }
    if (e.key === ' ') {
      e.preventDefault();
      // Quick preview - could dispatch a preview event
      onselect(file.id, false);
    }
  }

  function handleMouseEnter() {
    if (cardEl) {
      gsap.to(cardEl, {
        scale: 1.03,
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
        duration: 0.18,
        ease: 'power2.out',
      });
    }
  }

  function handleMouseLeave() {
    if (cardEl) {
      gsap.to(cardEl, {
        scale: 1,
        boxShadow: 'none',
        duration: 0.18,
        ease: 'power2.out',
      });
    }
  }
</script>

<button
  bind:this={cardEl}
  class="group relative flex flex-col items-center gap-2 rounded-xl border p-4
    text-left transition-colors duration-150 outline-none cursor-pointer w-full
    {selected
      ? 'border-[var(--color-primary-500)] ring-2 ring-[var(--color-primary-500)]/30 bg-[var(--bg-active)]'
      : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'}
  "
  onclick={handleClick}
  ondblclick={handleDblClick}
  onkeydown={handleKeydown}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  aria-selected={selected}
  aria-label="File: {file.name}"
  role="option"
>
  <!-- Favorited star overlay -->
  {#if isFavorited}
    <span class="absolute top-2 right-2 z-10">
      <Icon icon="ph:star-fill" class="text-sm text-amber-400" />
    </span>
  {/if}

  <!-- File icon -->
  <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--bg-surface-raised)]">
    <Icon
      icon={typeInfo.icon}
      class="text-2xl"
      style="color: {typeInfo.color}"
    />
  </div>

  <!-- Filename -->
  <span
    class="w-full truncate text-center text-[13px] font-medium text-[var(--text-primary)] leading-tight"
    title={file.name}
  >
    {file.name}
  </span>

  <!-- Meta row: size + date -->
  <div class="flex w-full items-center justify-between gap-1 text-[11px] text-[var(--text-tertiary)]">
    <span class="truncate">{formattedSize}</span>
    <span class="shrink-0">{relativeDate}</span>
  </div>

  <!-- Selection indicator for keyboard focus -->
  {#if selected}
    <span class="absolute -top-px -left-px -right-px -bottom-px rounded-xl ring-2 ring-[var(--color-primary-500)] pointer-events-none"></span>
  {/if}
</button>
