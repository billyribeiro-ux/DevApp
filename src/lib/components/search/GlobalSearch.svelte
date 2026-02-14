<script lang="ts">
  import Icon from '@iconify/svelte';
  import Fuse from 'fuse.js';
  import { ui } from '$stores/app.svelte';
  import { scaleIn } from '$utils/animations';
  import {
    getNotes,
    getPrompts,
    getCourses,
    getSnippets,
    getReminders,
    getAllFiles,
  } from '$services/database';
  import type { Note, Prompt, Course, Snippet, Reminder, VaultFile } from '$types';

  interface SearchItem {
    id: string;
    type: 'file' | 'note' | 'prompt' | 'course' | 'snippet' | 'reminder';
    title: string;
    preview: string;
    icon: string;
    typeLabel: string;
    typeBadgeColor: string;
  }

  const TYPE_META: Record<SearchItem['type'], { icon: string; label: string; color: string }> = {
    file: { icon: 'ph:file', label: 'File', color: '#71717a' },
    note: { icon: 'ph:note-pencil', label: 'Note', color: '#6366f1' },
    prompt: { icon: 'ph:chat-dots', label: 'Prompt', color: '#ec4899' },
    course: { icon: 'ph:graduation-cap', label: 'Course', color: '#14b8a6' },
    snippet: { icon: 'ph:code', label: 'Snippet', color: '#f59e0b' },
    reminder: { icon: 'ph:bell', label: 'Reminder', color: '#f97316' },
  };

  const CATEGORY_ORDER: SearchItem['type'][] = ['file', 'note', 'prompt', 'course', 'snippet', 'reminder'];
  const CATEGORY_LABELS: Record<SearchItem['type'], string> = {
    file: 'Files',
    note: 'Notes',
    prompt: 'Prompts',
    course: 'Courses',
    snippet: 'Snippets',
    reminder: 'Reminders',
  };

  let query = $state('');
  let selectedIndex = $state(0);
  let inputEl: HTMLInputElement | undefined = $state(undefined);
  let panelEl: HTMLDivElement | undefined = $state(undefined);
  let allItems = $state<SearchItem[]>([]);
  let isLoading = $state(false);
  let recentSearches = $state<string[]>([]);

  // Fuse.js instance
  let fuse = $derived(() => {
    return new Fuse(allItems, {
      keys: ['title', 'preview'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 1,
    });
  });

  let searchResults = $derived(() => {
    if (!query.trim()) return [];
    const results = fuse().search(query.trim());
    return results.map((r) => r.item);
  });

  let groupedResults = $derived(() => {
    const results = searchResults();
    const groups: { type: SearchItem['type']; label: string; items: SearchItem[] }[] = [];

    for (const type of CATEGORY_ORDER) {
      const items = results.filter((r) => r.type === type);
      if (items.length > 0) {
        groups.push({ type, label: CATEGORY_LABELS[type], items });
      }
    }

    return groups;
  });

  let flatResults = $derived(() => {
    return groupedResults().flatMap((g) => g.items);
  });

  let hasQuery = $derived(query.trim().length > 0);
  let hasResults = $derived(flatResults().length > 0);

  // Reset selection on query change
  $effect(() => {
    query; // track dependency
    selectedIndex = 0;
  });

  // Focus input, load data, and animate when opened
  $effect(() => {
    if (ui.searchOpen) {
      requestAnimationFrame(() => {
        inputEl?.focus();
        if (panelEl) {
          scaleIn(panelEl, 0.2);
        }
      });
      query = '';
      selectedIndex = 0;
      loadAllData();
    }
  });

  // Global keyboard shortcut (Cmd+K)
  $effect(() => {
    function handleGlobalKeydown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        ui.toggleSearch();
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeydown);
      return () => window.removeEventListener('keydown', handleGlobalKeydown);
    }
  });

  async function loadAllData() {
    if (allItems.length > 0) return; // Already loaded
    isLoading = true;

    try {
      const [files, notes, prompts, courses, snippets, reminders] = await Promise.all([
        getAllFiles(),
        getNotes(),
        getPrompts(),
        getCourses(),
        getSnippets(),
        getReminders(),
      ]);

      const items: SearchItem[] = [];

      for (const f of files) {
        items.push({
          id: f.id,
          type: 'file',
          title: f.name,
          preview: `${f.extension ?? 'file'} - ${formatSize(f.size_bytes)}`,
          icon: TYPE_META.file.icon,
          typeLabel: TYPE_META.file.label,
          typeBadgeColor: TYPE_META.file.color,
        });
      }

      for (const n of notes) {
        items.push({
          id: n.id,
          type: 'note',
          title: n.title,
          preview: n.content_text?.slice(0, 120) ?? 'No content',
          icon: TYPE_META.note.icon,
          typeLabel: TYPE_META.note.label,
          typeBadgeColor: TYPE_META.note.color,
        });
      }

      for (const p of prompts) {
        items.push({
          id: p.id,
          type: 'prompt',
          title: p.title,
          preview: p.content.slice(0, 120),
          icon: TYPE_META.prompt.icon,
          typeLabel: TYPE_META.prompt.label,
          typeBadgeColor: TYPE_META.prompt.color,
        });
      }

      for (const c of courses) {
        items.push({
          id: c.id,
          type: 'course',
          title: c.name,
          preview: [c.instructor, c.platform].filter(Boolean).join(' - ') || 'No description',
          icon: TYPE_META.course.icon,
          typeLabel: TYPE_META.course.label,
          typeBadgeColor: TYPE_META.course.color,
        });
      }

      for (const s of snippets) {
        items.push({
          id: s.id,
          type: 'snippet',
          title: s.title,
          preview: s.code.slice(0, 120).replace(/\n/g, ' '),
          icon: TYPE_META.snippet.icon,
          typeLabel: TYPE_META.snippet.label,
          typeBadgeColor: TYPE_META.snippet.color,
        });
      }

      for (const r of reminders) {
        items.push({
          id: r.id,
          type: 'reminder',
          title: r.title,
          preview: r.description?.slice(0, 120) ?? `${r.priority} priority - ${r.status}`,
          icon: TYPE_META.reminder.icon,
          typeLabel: TYPE_META.reminder.label,
          typeBadgeColor: TYPE_META.reminder.color,
        });
      }

      allItems = items;
    } catch (err) {
      console.error('Failed to load search data:', err);
    } finally {
      isLoading = false;
    }
  }

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function handleKeydown(e: KeyboardEvent) {
    const results = flatResults();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = results.length > 0 ? (selectedIndex + 1) % results.length : 0;
        scrollSelectedIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = results.length > 0 ? (selectedIndex - 1 + results.length) % results.length : 0;
        scrollSelectedIntoView();
        break;
      case 'Enter':
        e.preventDefault();
        if (results.length > 0 && selectedIndex < results.length) {
          selectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }

  function scrollSelectedIntoView() {
    requestAnimationFrame(() => {
      const el = panelEl?.querySelector(`[data-search-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  function selectResult(item: SearchItem) {
    // Track recent search
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
    close();
    // Navigation would happen here via an event/callback
  }

  function addRecentSearch(term: string) {
    const filtered = recentSearches.filter((s) => s !== term);
    recentSearches = [term, ...filtered].slice(0, 5);
  }

  function useRecentSearch(term: string) {
    query = term;
    inputEl?.focus();
  }

  function clearRecentSearches() {
    recentSearches = [];
  }

  function close() {
    ui.searchOpen = false;
  }

  function getItemGlobalIndex(item: SearchItem): number {
    return flatResults().indexOf(item);
  }
</script>

{#if ui.searchOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-[var(--bg-overlay)] backdrop-blur-sm"
    onkeydown={handleKeydown}
    onclick={close}
  >
    <!-- Panel -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      bind:this={panelEl}
      class="w-full max-w-2xl rounded-[var(--radius-xl)] border border-[var(--border-default)]
        bg-[var(--bg-surface)] shadow-[var(--shadow-xl)] overflow-hidden"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Global search"
    >
      <!-- Search input -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
        <Icon icon="ph:magnifying-glass" class="text-lg text-[var(--text-tertiary)] flex-shrink-0" />
        <input
          bind:this={inputEl}
          type="text"
          bind:value={query}
          placeholder="Search files, notes, prompts, courses, snippets, reminders..."
          class="flex-1 bg-transparent text-base text-[var(--text-primary)]
            placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
        {#if isLoading}
          <div class="w-4 h-4 border-2 border-[var(--color-primary-500)] border-t-transparent
            rounded-full animate-spin flex-shrink-0"></div>
        {/if}
        <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)]
          bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)]
          text-[10px] text-[var(--text-tertiary)] font-mono">
          ESC
        </kbd>
      </div>

      <!-- Content area -->
      <div class="max-h-96 overflow-y-auto">
        <!-- Loading state -->
        {#if isLoading}
          <div class="px-4 py-10 text-center">
            <div class="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent
              rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-sm text-[var(--text-secondary)]">Loading search index...</p>
          </div>

        <!-- Recent searches (shown when no query) -->
        {:else if !hasQuery && recentSearches.length > 0}
          <div class="py-2">
            <div class="flex items-center justify-between px-4 pt-2 pb-1">
              <span class="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Recent Searches
              </span>
              <button
                type="button"
                class="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                onclick={clearRecentSearches}
              >
                Clear
              </button>
            </div>

            {#each recentSearches as term}
              <button
                type="button"
                class="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[var(--bg-card-hover)]
                  transition-colors"
                onclick={() => useRecentSearch(term)}
              >
                <Icon icon="ph:clock-counter-clockwise" class="text-base text-[var(--text-tertiary)]" />
                <span class="text-sm text-[var(--text-secondary)]">{term}</span>
              </button>
            {/each}
          </div>

        <!-- Prompt to start searching (no query, no recent) -->
        {:else if !hasQuery}
          <div class="px-4 py-10 text-center">
            <Icon icon="ph:magnifying-glass" class="text-3xl text-[var(--text-tertiary)] mx-auto mb-2" />
            <p class="text-sm text-[var(--text-secondary)]">Start typing to search across DevVault</p>
            <p class="text-xs text-[var(--text-tertiary)] mt-1">
              Search files, notes, prompts, courses, snippets, and reminders
            </p>
          </div>

        <!-- Search results -->
        {:else if hasResults}
          <div class="py-2">
            {#each groupedResults() as group (group.type)}
              <div class="px-4 pt-2 pb-1">
                <span class="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Icon icon={TYPE_META[group.type].icon} class="text-xs" />
                  {group.label}
                  <span class="text-[var(--text-tertiary)]">({group.items.length})</span>
                </span>
              </div>

              {#each group.items as item (item.id)}
                {@const idx = getItemGlobalIndex(item)}
                {@const isSelected = idx === selectedIndex}

                <button
                  type="button"
                  data-search-index={idx}
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    {isSelected
                      ? 'bg-[var(--bg-active)]'
                      : 'hover:bg-[var(--bg-card-hover)]'}"
                  onclick={() => selectResult(item)}
                  onmouseenter={() => { selectedIndex = idx; }}
                >
                  <!-- Icon -->
                  <div
                    class="flex-shrink-0 w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
                    style="background-color: color-mix(in srgb, {item.typeBadgeColor} 12%, transparent)"
                  >
                    <Icon icon={item.icon} class="text-base" style="color: {item.typeBadgeColor}" />
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-[var(--text-primary)] truncate">
                      {item.title}
                    </div>
                    <div class="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                      {item.preview}
                    </div>
                  </div>

                  <!-- Type badge -->
                  <span
                    class="flex-shrink-0 inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5
                      text-[10px] font-semibold"
                    style="background-color: color-mix(in srgb, {item.typeBadgeColor} 12%, transparent);
                           color: {item.typeBadgeColor}"
                  >
                    {item.typeLabel}
                  </span>
                </button>
              {/each}
            {/each}
          </div>

        <!-- No results -->
        {:else}
          <div class="px-4 py-10 text-center">
            <Icon icon="ph:file-dashed" class="text-3xl text-[var(--text-tertiary)] mx-auto mb-2" />
            <p class="text-sm text-[var(--text-secondary)]">No results for "{query}"</p>
            <p class="text-xs text-[var(--text-tertiary)] mt-1">
              Try different keywords or check your spelling
            </p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-4 py-2 border-t border-[var(--border-subtle)]
        bg-[var(--bg-surface-raised)]">
        <div class="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[9px]">&uarr;&darr;</kbd>
            navigate
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[9px]">&crarr;</kbd>
            open
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[9px]">esc</kbd>
            close
          </span>
        </div>
        {#if hasQuery && hasResults}
          <span class="text-[10px] text-[var(--text-tertiary)]">
            {flatResults().length} results
          </span>
        {/if}
      </div>
    </div>
  </div>
{/if}
