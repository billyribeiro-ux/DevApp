<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { CommandAction } from '$types';
  import { ui } from '$stores/app.svelte';
  import { theme, nav } from '$stores/app.svelte';
  import { scaleIn } from '$utils/animations';

  const COMMANDS: CommandAction[] = [
    // File Management
    {
      id: 'new-note',
      label: 'New Note',
      icon: 'ph:note-pencil',
      shortcut: 'Ctrl+N',
      category: 'File Management',
      action: () => nav.navigate('/notes?action=new'),
    },
    {
      id: 'new-folder',
      label: 'New Folder',
      icon: 'ph:folder-plus',
      shortcut: 'Ctrl+Shift+N',
      category: 'File Management',
      action: () => nav.navigate('/files?action=new-folder'),
    },
    {
      id: 'upload-files',
      label: 'Upload Files',
      icon: 'ph:upload-simple',
      shortcut: 'Ctrl+U',
      category: 'File Management',
      action: () => nav.navigate('/files?action=upload'),
    },
    {
      id: 'new-prompt',
      label: 'New Prompt',
      icon: 'ph:chat-dots',
      shortcut: 'Ctrl+Shift+P',
      category: 'File Management',
      action: () => nav.navigate('/prompts?action=new'),
    },
    {
      id: 'new-reminder',
      label: 'New Reminder',
      icon: 'ph:bell-simple-plus',
      shortcut: 'Ctrl+Shift+R',
      category: 'File Management',
      action: () => nav.navigate('/reminders?action=new'),
    },

    // View
    {
      id: 'toggle-dark-mode',
      label: 'Toggle Dark Mode',
      icon: 'ph:moon',
      shortcut: 'Ctrl+Shift+D',
      category: 'View',
      action: () => theme.toggle(),
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      icon: 'ph:sidebar-simple',
      shortcut: 'Ctrl+B',
      category: 'View',
      action: () => ui.toggleSidebar(),
    },

    // Navigation
    {
      id: 'go-dashboard',
      label: 'Go to Dashboard',
      icon: 'ph:house',
      shortcut: 'Ctrl+1',
      category: 'Navigation',
      action: () => nav.navigate('/'),
    },
    {
      id: 'go-notes',
      label: 'Go to Notes',
      icon: 'ph:note-pencil',
      shortcut: 'Ctrl+2',
      category: 'Navigation',
      action: () => nav.navigate('/notes'),
    },
    {
      id: 'go-prompts',
      label: 'Go to Prompts',
      icon: 'ph:chat-dots',
      shortcut: 'Ctrl+3',
      category: 'Navigation',
      action: () => nav.navigate('/prompts'),
    },
    {
      id: 'go-courses',
      label: 'Go to Courses',
      icon: 'ph:graduation-cap',
      shortcut: 'Ctrl+4',
      category: 'Navigation',
      action: () => nav.navigate('/courses'),
    },
    {
      id: 'go-reminders',
      label: 'Go to Reminders',
      icon: 'ph:bell',
      shortcut: 'Ctrl+5',
      category: 'Navigation',
      action: () => nav.navigate('/reminders'),
    },
    {
      id: 'go-trash',
      label: 'Go to Trash',
      icon: 'ph:trash',
      shortcut: '',
      category: 'Navigation',
      action: () => nav.navigate('/trash'),
    },
    {
      id: 'go-settings',
      label: 'Go to Settings',
      icon: 'ph:gear',
      shortcut: 'Ctrl+,',
      category: 'Navigation',
      action: () => nav.navigate('/settings'),
    },

    // Sync
    {
      id: 'sync-now',
      label: 'Sync Now',
      icon: 'ph:cloud-arrow-up',
      shortcut: 'Ctrl+Shift+S',
      category: 'Sync',
      action: () => { /* trigger sync */ },
    },
  ];

  const CATEGORY_ORDER = ['File Management', 'Navigation', 'View', 'Sync'];

  let query = $state('');
  let selectedIndex = $state(0);
  let inputEl: HTMLInputElement | undefined = $state(undefined);
  let panelEl: HTMLDivElement | undefined = $state(undefined);

  let filteredCommands = $derived(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase().trim();
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  });

  let groupedCommands = $derived(() => {
    const commands = filteredCommands();
    const groups: { category: string; items: CommandAction[] }[] = [];

    for (const cat of CATEGORY_ORDER) {
      const items = commands.filter((c) => c.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }

    return groups;
  });

  let flatResults = $derived(() => {
    return groupedCommands().flatMap((g) => g.items);
  });

  // Reset selection index when query changes
  $effect(() => {
    query; // track dependency
    selectedIndex = 0;
  });

  // Focus input and run animation when opened
  $effect(() => {
    if (ui.commandPaletteOpen) {
      requestAnimationFrame(() => {
        inputEl?.focus();
        if (panelEl) {
          scaleIn(panelEl, 0.2);
        }
      });
      query = '';
      selectedIndex = 0;
    }
  });

  // Keyboard shortcut listener (Cmd+Shift+P)
  $effect(() => {
    function handleGlobalKeydown(e: KeyboardEvent) {
      if (e.key === 'p' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        ui.toggleCommandPalette();
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeydown);
      return () => window.removeEventListener('keydown', handleGlobalKeydown);
    }
  });

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
          executeCommand(results[selectedIndex]);
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
      const el = panelEl?.querySelector(`[data-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  function executeCommand(cmd: CommandAction) {
    close();
    // Slight delay so the overlay closes before the action fires
    requestAnimationFrame(() => {
      cmd.action();
    });
  }

  function close() {
    ui.commandPaletteOpen = false;
  }

  function getItemGlobalIndex(cmd: CommandAction): number {
    return flatResults().indexOf(cmd);
  }
</script>

{#if ui.commandPaletteOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-[var(--bg-overlay)] backdrop-blur-sm"
    onkeydown={handleKeydown}
    onclick={close}
  >
    <!-- Panel -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      bind:this={panelEl}
      class="w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--border-default)]
        bg-[var(--bg-surface)] shadow-[var(--shadow-xl)] overflow-hidden"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Command palette"
    >
      <!-- Search input -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
        <Icon icon="ph:command" class="text-lg text-[var(--text-tertiary)] flex-shrink-0" />
        <input
          bind:this={inputEl}
          type="text"
          bind:value={query}
          placeholder="Type a command..."
          class="flex-1 bg-transparent text-base text-[var(--text-primary)]
            placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
        <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)]
          bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)]
          text-[10px] text-[var(--text-tertiary)] font-mono">
          ESC
        </kbd>
      </div>

      <!-- Results -->
      <div class="max-h-80 overflow-y-auto py-2">
        {#each groupedCommands() as group (group.category)}
          <div class="px-3 pt-2 pb-1">
            <span class="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-1">
              {group.category}
            </span>
          </div>

          {#each group.items as cmd (cmd.id)}
            {@const idx = getItemGlobalIndex(cmd)}
            {@const isSelected = idx === selectedIndex}

            <button
              type="button"
              data-index={idx}
              class="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors
                {isSelected
                  ? 'bg-[var(--bg-active)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}"
              onclick={() => executeCommand(cmd)}
              onmouseenter={() => { selectedIndex = idx; }}
            >
              {#if cmd.icon}
                <Icon
                  icon={cmd.icon}
                  class="text-base flex-shrink-0 {isSelected ? 'text-[var(--text-accent)]' : 'text-[var(--text-tertiary)]'}"
                />
              {/if}

              <span class="flex-1 text-sm font-medium truncate">
                {cmd.label}
              </span>

              {#if cmd.shortcut}
                <span class="flex-shrink-0 text-[10px] text-[var(--text-tertiary)] font-mono">
                  {cmd.shortcut}
                </span>
              {/if}
            </button>
          {/each}
        {/each}

        <!-- No results -->
        {#if filteredCommands().length === 0}
          <div class="px-4 py-8 text-center">
            <Icon icon="ph:magnifying-glass" class="text-2xl text-[var(--text-tertiary)] mx-auto mb-2" />
            <p class="text-sm text-[var(--text-secondary)]">No commands found</p>
            <p class="text-xs text-[var(--text-tertiary)] mt-1">Try a different search term</p>
          </div>
        {/if}
      </div>

      <!-- Footer hint -->
      <div class="flex items-center justify-between px-4 py-2 border-t border-[var(--border-subtle)]
        bg-[var(--bg-surface-raised)]">
        <div class="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[9px]">&uarr;&darr;</kbd>
            navigate
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[9px]">&crarr;</kbd>
            execute
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[9px]">esc</kbd>
            close
          </span>
        </div>
        <span class="text-[10px] text-[var(--text-tertiary)]">
          {filteredCommands().length} commands
        </span>
      </div>
    </div>
  </div>
{/if}
