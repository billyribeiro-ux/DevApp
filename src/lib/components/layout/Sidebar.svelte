<script lang="ts">
  import Icon from '@iconify/svelte';
  import { ui, theme, sync } from '$stores/app.svelte';
  import { page } from '$app/state';

  interface NavItem {
    label: string;
    icon: string;
    href: string;
    badge?: number;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'ph:house', href: '/' },
        { label: 'Vault Explorer', icon: 'ph:folder-open', href: '/vault' },
      ],
    },
    {
      title: 'Content',
      items: [
        { label: 'Notes', icon: 'ph:note-pencil', href: '/notes' },
        { label: 'Prompts', icon: 'ph:chat-dots', href: '/prompts' },
        { label: 'Reminders', icon: 'ph:bell', href: '/reminders' },
        { label: 'Courses', icon: 'ph:graduation-cap', href: '/courses' },
        { label: 'Code Snippets', icon: 'ph:code', href: '/snippets' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Activity', icon: 'ph:clock-counter-clockwise', href: '/activity' },
        { label: 'Trash', icon: 'ph:trash', href: '/trash' },
      ],
    },
  ];

  let activePath = $derived(page.url?.pathname ?? '/');

  const syncStatusConfig: Record<string, { icon: string; label: string; colorClass: string }> = {
    synced: { icon: 'ph:check-circle', label: 'Synced', colorClass: 'text-green-500' },
    syncing: { icon: 'ph:arrows-clockwise', label: 'Syncing...', colorClass: 'text-blue-500' },
    offline: { icon: 'ph:wifi-slash', label: 'Offline', colorClass: 'text-neutral-400' },
    error: { icon: 'ph:warning-circle', label: 'Sync Error', colorClass: 'text-red-500' },
  };

  let currentSyncConfig = $derived(syncStatusConfig[sync.status] ?? syncStatusConfig.offline);
</script>

<aside
  class="group/sidebar flex flex-col border-r transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0"
  style="
    width: {ui.sidebarOpen ? ui.sidebarWidth : 0}px;
    background: var(--bg-sidebar);
    border-color: var(--border-default);
  "
  aria-label="Sidebar navigation"
>
  {#if ui.sidebarOpen}
    <!-- Logo / Brand -->
    <div
      class="flex items-center gap-3 px-5 shrink-0 drag-region"
      style="height: var(--titlebar-height); border-bottom: 1px solid var(--border-subtle);"
    >
      <div
        class="flex items-center justify-center w-8 h-8 rounded-lg no-drag"
        style="background: var(--color-primary-600);"
      >
        <Icon icon="ph:vault" width={18} height={18} style="color: white;" />
      </div>
      <span
        class="text-base font-semibold tracking-tight no-drag select-none"
        style="color: var(--text-primary);"
      >
        DevVault
      </span>
    </div>

    <!-- Scrollable Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3" aria-label="Main navigation">
      {#each sections as section, sectionIndex}
        <div class={sectionIndex > 0 ? 'mt-5' : ''}>
          <h3
            class="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider select-none"
            style="color: var(--text-tertiary);"
          >
            {section.title}
          </h3>

          <ul class="flex flex-col gap-0.5">
            {#each section.items as item}
              {@const isActive = item.href === '/'
                ? activePath === '/'
                : activePath.startsWith(item.href)}
              <li>
                <a
                  href={item.href}
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out no-drag group/item"
                  class:sidebar-nav-active={isActive}
                  class:sidebar-nav-inactive={!isActive}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    icon={item.icon}
                    width={20}
                    height={20}
                    style="color: {isActive ? 'var(--color-primary-400)' : 'var(--text-secondary)'}; flex-shrink: 0; transition: color 150ms;"
                  />
                  <span class="truncate">{item.label}</span>
                  {#if item.badge != null && item.badge > 0}
                    <span
                      class="ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                      style="
                        background: var(--color-primary-600);
                        color: white;
                      "
                    >
                      {item.badge}
                    </span>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>

    <!-- Bottom Section -->
    <div
      class="shrink-0 px-3 py-3 flex flex-col gap-2"
      style="border-top: 1px solid var(--border-subtle);"
    >
      <!-- Settings link -->
      <a
        href="/settings"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out no-drag"
        class:sidebar-nav-active={activePath.startsWith('/settings')}
        class:sidebar-nav-inactive={!activePath.startsWith('/settings')}
      >
        <Icon
          icon="ph:gear"
          width={20}
          height={20}
          style="color: {activePath.startsWith('/settings') ? 'var(--color-primary-400)' : 'var(--text-secondary)'}; flex-shrink: 0;"
        />
        <span class="truncate">Settings</span>
      </a>

      <!-- Sync status + Theme toggle row -->
      <div class="flex items-center justify-between px-3 py-1.5">
        <!-- Sync status indicator -->
        <div class="flex items-center gap-2 no-drag">
          <Icon
            icon={currentSyncConfig.icon}
            width={16}
            height={16}
            class={sync.status === 'syncing' ? 'animate-spin' : ''}
            style="color: {sync.status === 'synced' ? 'var(--color-success)' : sync.status === 'syncing' ? 'var(--color-info)' : sync.status === 'error' ? 'var(--color-error)' : 'var(--text-tertiary)'};"
          />
          <span
            class="text-xs select-none"
            style="color: var(--text-tertiary);"
          >
            {currentSyncConfig.label}
          </span>
        </div>

        <!-- Theme toggle button -->
        <button
          onclick={() => theme.toggle()}
          class="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 no-drag cursor-pointer"
          style="color: var(--text-secondary);"
          onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-raised)'; }}
          onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          aria-label="Toggle theme"
          title={theme.resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {#if theme.resolved === 'dark'}
            <Icon icon="ph:sun" width={18} height={18} />
          {:else}
            <Icon icon="ph:moon" width={18} height={18} />
          {/if}
        </button>
      </div>
    </div>
  {/if}
</aside>

<style>
  .sidebar-nav-active {
    background: var(--bg-active);
    color: var(--color-primary-400);
  }

  .sidebar-nav-inactive {
    color: var(--text-secondary);
  }

  .sidebar-nav-inactive:hover {
    background: var(--bg-surface-raised);
    color: var(--text-primary);
  }
</style>
