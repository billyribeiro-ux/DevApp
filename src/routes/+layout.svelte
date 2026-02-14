<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { ui, theme, vault, toasts, nav } from '$stores/app.svelte';
	import { getWorkspaces, getFolders, seedDefaultData } from '$services/database';

	let { children } = $props();

	let initialized = $state(false);

	const navGroups = [
		{
			label: 'Overview',
			items: [
				{ id: 'dashboard', label: 'Dashboard', icon: 'ph:house-bold', href: '/' },
			]
		},
		{
			label: 'Content',
			items: [
				{ id: 'vault', label: 'Vault Explorer', icon: 'ph:folder-open-bold', href: '/vault' },
				{ id: 'notes', label: 'Notes', icon: 'ph:note-pencil-bold', href: '/notes' },
				{ id: 'prompts', label: 'Prompts', icon: 'ph:chat-dots-bold', href: '/prompts' },
				{ id: 'snippets', label: 'Code Snippets', icon: 'ph:code-bold', href: '/snippets' },
			]
		},
		{
			label: 'Organization',
			items: [
				{ id: 'reminders', label: 'Reminders', icon: 'ph:bell-bold', href: '/reminders' },
				{ id: 'courses', label: 'Courses', icon: 'ph:graduation-cap-bold', href: '/courses' },
			]
		},
		{
			label: 'System',
			items: [
				{ id: 'activity', label: 'Activity', icon: 'ph:clock-counter-clockwise-bold', href: '/activity' },
				{ id: 'trash', label: 'Trash', icon: 'ph:trash-bold', href: '/trash' },
				{ id: 'settings', label: 'Settings', icon: 'ph:gear-bold', href: '/settings' },
			]
		},
	];

	function handleKeydown(e: KeyboardEvent) {
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === 'k') { e.preventDefault(); ui.toggleSearch(); }
		else if (mod && e.shiftKey && e.key === 'P') { e.preventDefault(); ui.toggleCommandPalette(); }
		else if (mod && e.key === 'b') { e.preventDefault(); ui.toggleSidebar(); }
		else if (mod && e.shiftKey && e.key === 'M') { e.preventDefault(); theme.toggle(); }
	}

	onMount(async () => {
		theme.apply();
		try {
			await seedDefaultData();
			const workspaces = await getWorkspaces();
			vault.workspaces = workspaces;
			if (workspaces.length > 0) {
				vault.currentWorkspaceId = workspaces[0].id;
				vault.folders = await getFolders(workspaces[0].id);
			}
		} catch (err) {
			console.error('Init error:', err);
			toasts.error('Initialization Error', 'Failed to load database.');
		}
		initialized = true;
	});

	function isActive(href: string): boolean {
		if (href === '/') return nav.activePath === '/';
		return nav.activePath.startsWith(href);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !initialized}
	<div class="flex h-screen w-screen items-center justify-center" style="background: var(--bg-app);">
		<div class="flex flex-col items-center gap-4 animate-fade-in">
			<div class="flex items-center gap-3">
				<div class="rounded-2xl p-3" style="background: var(--color-primary-600);">
					<Icon icon="ph:vault-bold" width={28} height={28} style="color: white" />
				</div>
				<span class="text-xl font-semibold" style="color: var(--text-primary); letter-spacing: -0.02em;">DevVault</span>
			</div>
			<div class="h-0.5 w-40 overflow-hidden rounded-full" style="background: var(--bg-surface-raised);">
				<div class="h-full rounded-full animate-shimmer" style="background: var(--color-primary-500); width: 60%;"></div>
			</div>
			<p class="text-[13px]" style="color: var(--text-tertiary);">Loading workspace…</p>
		</div>
	</div>
{:else}
	<div class="flex h-screen w-screen overflow-hidden" style="background: var(--bg-app);">
		<!-- Sidebar -->
		<aside
			class="flex flex-col border-r transition-all duration-200 ease-out shrink-0"
			style="
				background: var(--bg-sidebar);
				border-color: var(--border-default);
				width: {ui.sidebarOpen ? '240px' : '0px'};
				min-width: {ui.sidebarOpen ? '240px' : '0px'};
				opacity: {ui.sidebarOpen ? 1 : 0};
				overflow: hidden;
			"
		>
			<!-- Brand -->
			<div class="flex items-center gap-2.5 px-4 shrink-0" style="height: 56px;">
				<div class="flex items-center justify-center rounded-lg p-1.5" style="background: var(--color-primary-600);">
					<Icon icon="ph:vault-bold" width={18} height={18} style="color: white" />
				</div>
				<span class="text-[15px] font-semibold" style="color: var(--text-primary); letter-spacing: -0.01em;">DevVault</span>
			</div>

			<!-- Nav -->
			<nav class="flex-1 overflow-y-auto px-2 pb-2">
				{#each navGroups as group, gi}
					<div class="{gi > 0 ? 'mt-4' : ''}">
						<p class="px-3 pb-1 pt-3 text-[11px] uppercase tracking-wider font-medium" style="color: var(--text-tertiary); opacity: 0.7;">{group.label}</p>
						<div class="space-y-px">
							{#each group.items as item}
								
									href={item.href}
									onclick={() => nav.navigate(item.href)}
									class="sidebar-link group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors duration-100"
									class:is-active={isActive(item.href)}
									style="
										color: {isActive(item.href) ? 'var(--text-primary)' : 'var(--text-secondary)'};
										background: {isActive(item.href) ? 'var(--bg-active)' : 'transparent'};
										font-weight: {isActive(item.href) ? '600' : '400'};
									"
								>
									<Icon icon={item.icon} width={18} height={18} style="opacity: {isActive(item.href) ? '1' : '0.7'};" />
									<span>{item.label}</span>
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</nav>

			<!-- Footer -->
			<div class="border-t px-3 py-2.5 shrink-0" style="border-color: var(--border-subtle);">
				<div class="flex items-center justify-between">
					<button onclick={() => theme.toggle()} class="rounded-lg p-1.5 transition-colors" style="color: var(--text-tertiary);" title="Toggle theme">
						<Icon icon={theme.resolved === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'} width={16} height={16} />
					</button>
					<div class="flex items-center gap-1.5 text-[11px]" style="color: var(--text-tertiary); opacity: 0.6;">
						<div class="h-1.5 w-1.5 rounded-full" style="background: var(--color-success);"></div>
						<span>Local</span>
						<span>&middot;</span>
						<span>v0.1.0</span>
					</div>
				</div>
			</div>
		</aside>

		<!-- Main -->
		<main class="flex flex-1 flex-col overflow-hidden min-w-0">
			{@render children()}
		</main>
	</div>

	<!-- Toasts -->
	{#if toasts.toasts.length > 0}
		<div class="fixed top-3 right-3 z-50 flex flex-col gap-2 pointer-events-none" style="max-width: 380px;">
			{#each toasts.toasts as toast (toast.id)}
				<div
					class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm animate-slide-down"
					style="background: var(--bg-card); border-color: var(--border-default);"
				>
					<Icon
						icon={toast.type === 'success' ? 'ph:check-circle-bold' : toast.type === 'error' ? 'ph:x-circle-bold' : toast.type === 'warning' ? 'ph:warning-bold' : 'ph:info-bold'}
						width={18} height={18}
						style="color: {toast.type === 'success' ? 'var(--color-success)' : toast.type === 'error' ? 'var(--color-error)' : toast.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)'}; flex-shrink: 0; margin-top: 1px;"
					/>
					<div class="flex-1 min-w-0">
						<p class="text-[13px] font-medium" style="color: var(--text-primary);">{toast.title}</p>
						{#if toast.description}
							<p class="text-[12px] mt-0.5" style="color: var(--text-secondary);">{toast.description}</p>
						{/if}
					</div>
					<button onclick={() => toasts.remove(toast.id)} class="shrink-0 rounded-md p-0.5 transition-colors" style="color: var(--text-tertiary);">
						<Icon icon="ph:x-bold" width={12} height={12} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
{/if}

<style>
	.sidebar-link.is-active:hover {
		background: var(--bg-active) !important;
	}
	.sidebar-link:not(.is-active):hover {
		background: var(--bg-card-hover);
	}
</style>