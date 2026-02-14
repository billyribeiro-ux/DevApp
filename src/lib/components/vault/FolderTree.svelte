<script lang="ts">
  import type { Folder } from '$types';
  import { FOLDER_TYPE_META } from '$config/constants';
  import { expandHeight, collapseHeight } from '$utils/animations';
  import Icon from '@iconify/svelte';

  let {
    folders,
    activeFolderId,
    onselect,
  }: {
    folders: Folder[];
    activeFolderId: string | null;
    onselect: (id: string) => void;
  } = $props();

  /** Track which folder IDs are currently expanded */
  let expandedIds = $state<Set<string>>(new Set());

  /** Build a lookup of children by parent_id for efficient recursive rendering */
  let childrenByParent = $derived.by(() => {
    const map = new Map<string | null, Folder[]>();
    for (const folder of folders) {
      if (folder.is_deleted) continue;
      const parentKey = folder.parent_id;
      if (!map.has(parentKey)) {
        map.set(parentKey, []);
      }
      map.get(parentKey)!.push(folder);
    }
    // Sort each group by sort_order
    for (const [, group] of map) {
      group.sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  });

  /** Root-level folders (no parent) */
  let rootFolders = $derived(childrenByParent.get(null) ?? []);

  function getChildren(parentId: string): Folder[] {
    return childrenByParent.get(parentId) ?? [];
  }

  function hasChildren(folderId: string): boolean {
    return (childrenByParent.get(folderId)?.length ?? 0) > 0;
  }

  function isExpanded(folderId: string): boolean {
    return expandedIds.has(folderId);
  }

  function toggleExpand(folderId: string) {
    const next = new Set(expandedIds);
    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }
    expandedIds = next;
  }

  function handleSelect(folderId: string) {
    onselect(folderId);
  }

  function handleContextMenu(e: MouseEvent, folderId: string) {
    e.preventDefault();
    // Context menu placeholder - dispatch a custom event or open a menu component
    // Can be wired up to a context menu store or component later
    console.debug('[FolderTree] context menu requested for folder:', folderId, { x: e.clientX, y: e.clientY });
  }

  function handleKeydown(e: KeyboardEvent, folderId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(folderId);
    }
    if (e.key === 'ArrowRight' && !isExpanded(folderId) && hasChildren(folderId)) {
      e.preventDefault();
      toggleExpand(folderId);
    }
    if (e.key === 'ArrowLeft' && isExpanded(folderId)) {
      e.preventDefault();
      toggleExpand(folderId);
    }
  }

  /** GSAP animation action for expand/collapse of child containers */
  function animateChildren(node: HTMLElement) {
    expandHeight(node, 0.25);
    return {
      destroy() {
        // collapseHeight returns a tween; we let it run or kill on destroy
      },
    };
  }
</script>

{#snippet treeItem(folder: Folder, depth: number)}
  {@const meta = FOLDER_TYPE_META[folder.folder_type] ?? FOLDER_TYPE_META.general}
  {@const expanded = isExpanded(folder.id)}
  {@const active = folder.id === activeFolderId}
  {@const childFolders = getChildren(folder.id)}
  {@const hasKids = childFolders.length > 0}

  <li role="treeitem" aria-expanded={hasKids ? expanded : undefined} aria-selected={active}>
    <!-- Folder row -->
    <button
      class="group flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm
        transition-colors duration-150 outline-none
        {active
          ? 'bg-[var(--color-primary-600)]/15 text-[var(--text-accent)] font-medium'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}
      "
      style:padding-left="{depth * 16 + 8}px"
      onclick={() => handleSelect(folder.id)}
      ondblclick={() => { if (hasKids) toggleExpand(folder.id); }}
      oncontextmenu={(e) => handleContextMenu(e, folder.id)}
      onkeydown={(e) => handleKeydown(e, folder.id)}
    >
      <!-- Chevron -->
      {#if hasKids}
        <span
          class="inline-flex shrink-0 items-center justify-center w-4 h-4 transition-transform duration-200"
          class:rotate-90={expanded}
          role="presentation"
          onclick={(e: MouseEvent) => { e.stopPropagation(); toggleExpand(folder.id); }}
        >
          <Icon icon="ph:caret-right-bold" class="text-[11px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
        </span>
      {:else}
        <span class="inline-flex w-4 h-4 shrink-0"></span>
      {/if}

      <!-- Folder icon -->
      <Icon
        icon={folder.icon ?? meta.icon}
        class="shrink-0 text-base"
        style="color: {folder.color ?? meta.color}"
      />

      <!-- Folder name -->
      <span class="truncate flex-1 select-none">{folder.name}</span>

      <!-- File count badge -->
      {#if folder.file_count != null && folder.file_count > 0}
        <span
          class="ml-auto shrink-0 rounded-full bg-[var(--bg-surface-raised)] px-1.5 py-0.5
            text-[10px] font-medium leading-none text-[var(--text-tertiary)]
            group-hover:bg-[var(--color-neutral-300)] dark:group-hover:bg-[var(--color-neutral-700)]"
        >
          {folder.file_count}
        </span>
      {/if}
    </button>

    <!-- Children (expanded) -->
    {#if hasKids && expanded}
      <ul role="group" use:animateChildren>
        {#each childFolders as child (child.id)}
          {@render treeItem(child, depth + 1)}
        {/each}
      </ul>
    {/if}
  </li>
{/snippet}

<nav aria-label="Folder tree" class="select-none">
  <ul role="tree" class="flex flex-col gap-0.5">
    {#each rootFolders as folder (folder.id)}
      {@render treeItem(folder, 0)}
    {/each}
  </ul>

  {#if rootFolders.length === 0}
    <div class="flex flex-col items-center justify-center py-8 text-center">
      <Icon icon="ph:folder-dashed" class="text-3xl text-[var(--text-tertiary)] mb-2" />
      <p class="text-sm text-[var(--text-tertiary)]">No folders yet</p>
    </div>
  {/if}
</nav>
