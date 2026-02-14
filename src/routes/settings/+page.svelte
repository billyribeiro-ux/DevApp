<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { ui, theme, sync, nav, toasts } from '$stores/app.svelte';
	import { APP_NAME, APP_VERSION } from '$config/constants';
	import { login, register, logout, checkServerHealth, restoreSession, isAuthenticated, getStoredUser } from '$services/supabase';

	let activeTab = $state('general');
	let serverOnline = $state(false);
	let authEmail = $state('');
	let authPassword = $state('');
	let authMode = $state<'login' | 'register'>('login');
	let authLoading = $state(false);

	async function checkServer() {
		serverOnline = await checkServerHealth();
	}

	async function handleAuth() {
		if (!authEmail || !authPassword) return;
		authLoading = true;
		try {
			if (authMode === 'register') {
				await register(authEmail, authPassword);
				toasts.success('Account Created', 'You are now logged in');
			} else {
				await login(authEmail, authPassword);
				toasts.success('Logged In');
			}
			sync.isAuthenticated = true;
			sync.userEmail = authEmail;
			authEmail = '';
			authPassword = '';
		} catch (e: any) {
			toasts.error('Auth Failed', e.message);
		}
		authLoading = false;
	}

	function handleLogout() {
		logout();
		sync.isAuthenticated = false;
		sync.userEmail = null;
		toasts.info('Logged Out');
	}

	const tabs = [
		{ id: 'general', label: 'General', icon: 'ph:gear' },
		{ id: 'appearance', label: 'Appearance', icon: 'ph:paint-brush' },
		{ id: 'sync', label: 'Sync & Account', icon: 'ph:cloud' },
		{ id: 'shortcuts', label: 'Shortcuts', icon: 'ph:keyboard' },
		{ id: 'about', label: 'About', icon: 'ph:info' },
	];

	const shortcuts = [
		{ keys: 'Cmd/Ctrl + K', action: 'Global Search' },
		{ keys: 'Cmd/Ctrl + Shift + P', action: 'Command Palette' },
		{ keys: 'Cmd/Ctrl + B', action: 'Toggle Sidebar' },
		{ keys: 'Cmd/Ctrl + Shift + M', action: 'Toggle Theme' },
		{ keys: 'Cmd/Ctrl + N', action: 'New Note' },
		{ keys: 'Cmd/Ctrl + Shift + N', action: 'New Folder' },
		{ keys: 'Cmd/Ctrl + U', action: 'Upload Files' },
		{ keys: 'Cmd/Ctrl + S', action: 'Save' },
		{ keys: 'Cmd/Ctrl + Shift + S', action: 'Force Sync' },
		{ keys: 'Cmd/Ctrl + F', action: 'Search in File' },
		{ keys: 'Cmd/Ctrl + Shift + F', action: 'Global Search' },
		{ keys: 'Cmd/Ctrl + C', action: 'Copy' },
		{ keys: 'Cmd/Ctrl + V', action: 'Smart Paste' },
		{ keys: 'Cmd/Ctrl + X', action: 'Cut' },
		{ keys: 'Cmd/Ctrl + Shift + C', action: 'Copy File Path' },
		{ keys: 'Cmd/Ctrl + Shift + V', action: 'Clipboard History' },
		{ keys: 'F2', action: 'Rename' },
		{ keys: 'Delete', action: 'Move to Trash' },
		{ keys: 'Space', action: 'Quick Preview' },
		{ keys: 'Escape', action: 'Close Modal/Panel' },
	];

	onMount(() => {
		nav.navigate('/settings');
		checkServer();
		if (restoreSession()) {
			const user = getStoredUser();
			if (user) {
				sync.isAuthenticated = true;
				sync.userEmail = user.email;
			}
		}
	});
</script>

<div class="flex h-full overflow-hidden">
	<!-- Settings sidebar -->
	<div class="w-56 shrink-0 border-r flex flex-col py-4 px-2" style="border-color: var(--border-default); background: var(--bg-surface);">
		{#each tabs as tab}
			<button
				onclick={() => { activeTab = tab.id; }}
				class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
				style="color: {activeTab === tab.id ? 'var(--text-accent)' : 'var(--text-secondary)'}; background: {activeTab === tab.id ? 'var(--bg-active)' : 'transparent'};"
			>
				<Icon icon={tab.icon} width={18} height={18} />
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Settings content -->
	<div class="flex-1 overflow-y-auto px-8 py-6">
		{#if activeTab === 'general'}
			<h2 class="text-lg font-bold mb-6" style="color: var(--text-primary);">General</h2>
			<div class="space-y-6 max-w-lg">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-primary);">Default View</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Choose grid or list view for files</p>
					</div>
					<select
						onchange={(e) => ui.setViewMode((e.target as HTMLSelectElement).value as 'grid' | 'list')}
						class="rounded-lg border px-3 py-1.5 text-xs"
						style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);"
					>
						<option value="grid" selected={ui.viewMode === 'grid'}>Grid</option>
						<option value="list" selected={ui.viewMode === 'list'}>List</option>
					</select>
				</div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-primary);">Sidebar</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Show or hide the sidebar</p>
					</div>
					<button onclick={() => ui.toggleSidebar()} class="rounded-lg border px-3 py-1.5 text-xs" style="border-color: var(--border-default); color: var(--text-secondary);">
						{ui.sidebarOpen ? 'Hide' : 'Show'}
					</button>
				</div>
			</div>

		{:else if activeTab === 'appearance'}
			<h2 class="text-lg font-bold mb-6" style="color: var(--text-primary);">Appearance</h2>
			<div class="space-y-6 max-w-lg">
				<div>
					<p class="text-sm font-medium mb-3" style="color: var(--text-primary);">Theme</p>
					<div class="grid grid-cols-3 gap-3">
						{#each [{ value: 'light', label: 'Light', icon: 'ph:sun' }, { value: 'dark', label: 'Dark', icon: 'ph:moon' }, { value: 'system', label: 'System', icon: 'ph:desktop' }] as t}
							<button
								onclick={() => theme.setMode(t.value as 'light' | 'dark' | 'system')}
								class="flex flex-col items-center gap-2 rounded-xl border p-4 transition-all"
								style="border-color: {theme.mode === t.value ? 'var(--color-primary-500)' : 'var(--border-default)'}; background: {theme.mode === t.value ? 'var(--bg-active)' : 'var(--bg-card)'};"
							>
								<Icon icon={t.icon} width={24} height={24} style="color: {theme.mode === t.value ? 'var(--text-accent)' : 'var(--text-secondary)'};" />
								<span class="text-xs font-medium" style="color: {theme.mode === t.value ? 'var(--text-accent)' : 'var(--text-secondary)'};">{t.label}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

		{:else if activeTab === 'sync'}
			<h2 class="text-lg font-bold mb-6" style="color: var(--text-primary);">Sync & Account</h2>
			<div class="space-y-6 max-w-lg">
				<!-- Server Status -->
				<div class="rounded-xl border p-5" style="background: var(--bg-card); border-color: var(--border-default);">
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center gap-2">
							<div class="h-2.5 w-2.5 rounded-full" style="background: {serverOnline ? 'var(--color-success)' : 'var(--color-error)'};"></div>
							<span class="text-sm font-medium" style="color: var(--text-primary);">Sync Server</span>
						</div>
						<button onclick={checkServer} class="rounded-md px-2 py-1 text-[11px]" style="color: var(--text-secondary); border: 1px solid var(--border-default);">Refresh</button>
					</div>
					<p class="text-xs" style="color: var(--text-tertiary);">{serverOnline ? 'Server is reachable' : 'Server offline — run `cargo run` in sync-server/'}</p>
				</div>

				<!-- Auth -->
				<div class="rounded-xl border p-5" style="background: var(--bg-card); border-color: var(--border-default);">
					<div class="flex items-center gap-2 mb-4">
						<Icon icon="ph:user-circle-bold" width={20} height={20} style="color: var(--text-accent);" />
						<span class="text-sm font-semibold" style="color: var(--text-primary);">Account</span>
					</div>
					{#if sync.isAuthenticated}
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								<div class="h-2 w-2 rounded-full" style="background: var(--color-success);"></div>
								<span class="text-sm" style="color: var(--text-primary);">Signed in as <strong>{sync.userEmail}</strong></span>
							</div>
							<p class="text-xs" style="color: var(--text-tertiary);">Last synced: {sync.lastSyncedAt ?? 'Never'}</p>
							<button onclick={handleLogout} class="rounded-lg px-3 py-1.5 text-xs font-medium" style="color: var(--color-error); border: 1px solid var(--color-error);">
								<Icon icon="ph:sign-out-bold" width={14} height={14} style="display: inline; vertical-align: -2px;" /> Sign Out
							</button>
						</div>
					{:else}
						<p class="text-xs mb-4" style="color: var(--text-secondary);">Sign in to enable cross-device sync. Your data syncs to your self-hosted server — no third-party services, zero cost.</p>
						<div class="space-y-3">
							<div class="flex gap-2">
								<button onclick={() => { authMode = 'login'; }} class="rounded-md px-3 py-1 text-xs font-medium" style="background: {authMode === 'login' ? 'var(--bg-active)' : 'transparent'}; color: {authMode === 'login' ? 'var(--text-accent)' : 'var(--text-secondary)'};">Sign In</button>
								<button onclick={() => { authMode = 'register'; }} class="rounded-md px-3 py-1 text-xs font-medium" style="background: {authMode === 'register' ? 'var(--bg-active)' : 'transparent'}; color: {authMode === 'register' ? 'var(--text-accent)' : 'var(--text-secondary)'};">Register</button>
							</div>
							<input type="email" bind:value={authEmail} placeholder="Email" class="w-full rounded-lg border px-3 py-2 text-sm outline-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
							<input type="password" bind:value={authPassword} placeholder="Password (8+ chars)" class="w-full rounded-lg border px-3 py-2 text-sm outline-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" onkeydown={(e) => { if (e.key === 'Enter') handleAuth(); }} />
							<button onclick={handleAuth} disabled={authLoading} class="w-full rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50" style="background: var(--color-primary-600);">
								{authLoading ? 'Please wait...' : authMode === 'register' ? 'Create Account' : 'Sign In'}
							</button>
						</div>
					{/if}
				</div>

				<!-- Info -->
				<div class="rounded-xl border p-5" style="background: var(--bg-card); border-color: var(--border-default);">
					<p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
						<strong>Self-hosted sync.</strong> DevVault uses its own Rust sync server — no Supabase, no Firebase, no subscriptions. Run <code class="font-mono rounded px-1 py-0.5 text-[10px]" style="background: var(--bg-surface-raised);">cd sync-server && cargo run</code> to start the server. Your data stays on your infrastructure.
					</p>
				</div>
			</div>

		{:else if activeTab === 'shortcuts'}
			<h2 class="text-lg font-bold mb-6" style="color: var(--text-primary);">Keyboard Shortcuts</h2>
			<div class="max-w-lg space-y-1">
				{#each shortcuts as s}
					<div class="flex items-center justify-between rounded-lg px-3 py-2" style="border-bottom: 1px solid var(--border-subtle);">
						<span class="text-sm" style="color: var(--text-primary);">{s.action}</span>
						<kbd class="rounded-md px-2 py-0.5 text-xs font-mono" style="background: var(--bg-surface-raised); color: var(--text-secondary); border: 1px solid var(--border-default);">{s.keys}</kbd>
					</div>
				{/each}
			</div>

		{:else if activeTab === 'about'}
			<h2 class="text-lg font-bold mb-6" style="color: var(--text-primary);">About</h2>
			<div class="max-w-lg">
				<div class="flex items-center gap-4 mb-6">
					<div class="rounded-2xl p-4" style="background: var(--color-primary-600);">
						<Icon icon="ph:vault-bold" width={32} height={32} style="color: white;" />
					</div>
					<div>
						<h3 class="text-xl font-bold" style="color: var(--text-primary);">{APP_NAME}</h3>
						<p class="text-sm" style="color: var(--text-secondary);">Version {APP_VERSION}</p>
					</div>
				</div>
				<p class="text-sm leading-relaxed mb-4" style="color: var(--text-secondary);">
					DevVault is a personal developer workspace & cloud sync desktop app. Built with Tauri v2, SvelteKit, Svelte 5, TailwindCSS v4, and GSAP.
				</p>
				<div class="space-y-2 text-sm" style="color: var(--text-secondary);">
					<p><strong>Desktop:</strong> Tauri v2 + SvelteKit + Svelte 5 (Runes) + TailwindCSS v4</p>
					<p><strong>Sync Server:</strong> Custom Rust (Axum + SQLite + JWT + WebSocket)</p>
					<p><strong>Icons:</strong> Phosphor Icons + Iconify</p>
					<p><strong>Animations:</strong> GSAP</p>
					<p><strong>Database:</strong> SQLite (both local + server) — zero cost, self-hosted</p>
				</div>
			</div>
		{/if}
	</div>
</div>
