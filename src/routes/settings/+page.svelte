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
	<div class="w-60 shrink-0 border-r flex flex-col px-3" style="border-color: var(--border-default); background: var(--bg-surface); padding-top: var(--content-padding); padding-bottom: var(--content-padding);">
		{#each tabs as tab}
			<button
				onclick={() => { activeTab = tab.id; }}
				class="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors"
				style="font-size: var(--text-sm); color: {activeTab === tab.id ? 'var(--text-accent)' : 'var(--text-secondary)'}; background: {activeTab === tab.id ? 'var(--bg-active)' : 'transparent'}; font-weight: {activeTab === tab.id ? '600' : '500'};"
			>
				<Icon icon={tab.icon} width={20} height={20} />
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Settings content -->
	<div class="flex-1 overflow-y-auto" style="padding: var(--content-padding-lg);">
		{#if activeTab === 'general'}
			<h2 class="text-xl font-bold mb-8" style="color: var(--text-primary);">General</h2>
			<div class="space-y-8 max-w-lg">
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium" style="font-size: var(--text-base); color: var(--text-primary);">Default View</p>
						<p class="mt-0.5" style="font-size: var(--text-sm); color: var(--text-tertiary);">Choose grid or list view for files</p>
					</div>
					<select
						onchange={(e) => ui.setViewMode((e.target as HTMLSelectElement).value as 'grid' | 'list')}
						class="input-field input-field-sm"
						style="width: auto;"
					>
						<option value="grid" selected={ui.viewMode === 'grid'}>Grid</option>
						<option value="list" selected={ui.viewMode === 'list'}>List</option>
					</select>
				</div>
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium" style="font-size: var(--text-base); color: var(--text-primary);">Sidebar</p>
						<p class="mt-0.5" style="font-size: var(--text-sm); color: var(--text-tertiary);">Show or hide the sidebar</p>
					</div>
					<button onclick={() => ui.toggleSidebar()} class="btn-secondary">
						{ui.sidebarOpen ? 'Hide' : 'Show'}
					</button>
				</div>
			</div>

		{:else if activeTab === 'appearance'}
			<h2 class="text-xl font-bold mb-8" style="color: var(--text-primary);">Appearance</h2>
			<div class="space-y-8 max-w-lg">
				<div>
					<p class="font-medium mb-4" style="font-size: var(--text-base); color: var(--text-primary);">Theme</p>
					<div class="grid grid-cols-3 gap-4">
						{#each [{ value: 'light', label: 'Light', icon: 'ph:sun' }, { value: 'dark', label: 'Dark', icon: 'ph:moon' }, { value: 'system', label: 'System', icon: 'ph:desktop' }] as t}
							<button
								onclick={() => theme.setMode(t.value as 'light' | 'dark' | 'system')}
								class="flex flex-col items-center gap-2.5 rounded-2xl border p-5 transition-all"
								style="border-color: {theme.mode === t.value ? 'var(--color-primary-500)' : 'var(--border-default)'}; background: {theme.mode === t.value ? 'var(--bg-active)' : 'var(--bg-card)'}; box-shadow: {theme.mode === t.value ? '0 0 0 1px var(--color-primary-500)' : 'var(--shadow-card)'};"
							>
								<Icon icon={t.icon} width={28} height={28} style="color: {theme.mode === t.value ? 'var(--text-accent)' : 'var(--text-secondary)'};" />
								<span class="font-medium" style="font-size: var(--text-sm); color: {theme.mode === t.value ? 'var(--text-accent)' : 'var(--text-secondary)'};">{t.label}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

		{:else if activeTab === 'sync'}
			<h2 class="text-xl font-bold mb-8" style="color: var(--text-primary);">Sync & Account</h2>
			<div class="space-y-6 max-w-lg">
				<div class="rounded-2xl border p-6" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center gap-2">
							<div class="h-2.5 w-2.5 rounded-full" style="background: {serverOnline ? 'var(--color-success)' : 'var(--color-error)'};"></div>
							<span class="font-medium" style="font-size: var(--text-base); color: var(--text-primary);">Sync Server</span>
						</div>
						<button onclick={checkServer} class="btn-secondary" style="font-size: var(--text-xs);">Refresh</button>
					</div>
					<p style="font-size: var(--text-sm); color: var(--text-tertiary);">{serverOnline ? 'Server is reachable' : 'Server offline — run `cargo run` in sync-server/'}</p>
				</div>

				<div class="rounded-2xl border p-6" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					<div class="flex items-center gap-2 mb-5">
						<Icon icon="ph:user-circle-bold" width={22} height={22} style="color: var(--text-accent);" />
						<span class="font-semibold" style="font-size: var(--text-base); color: var(--text-primary);">Account</span>
					</div>
					{#if sync.isAuthenticated}
						<div class="space-y-4">
							<div class="flex items-center gap-2">
								<div class="h-2 w-2 rounded-full" style="background: var(--color-success);"></div>
								<span style="font-size: var(--text-sm); color: var(--text-primary);">Signed in as <strong>{sync.userEmail}</strong></span>
							</div>
							<p style="font-size: var(--text-sm); color: var(--text-tertiary);">Last synced: {sync.lastSyncedAt ?? 'Never'}</p>
							<button onclick={handleLogout} class="flex items-center gap-1.5 rounded-xl px-4 py-2 font-medium" style="font-size: var(--text-sm); color: var(--color-error); border: 1px solid var(--color-error);">
								<Icon icon="ph:sign-out-bold" width={16} height={16} /> Sign Out
							</button>
						</div>
					{:else}
						<p class="mb-5" style="font-size: var(--text-sm); color: var(--text-secondary);">Sign in to enable cross-device sync. Your data syncs to your self-hosted server — no third-party services, zero cost.</p>
						<div class="space-y-4">
							<div class="flex gap-2">
								<button onclick={() => { authMode = 'login'; }} class="rounded-lg px-4 py-1.5 font-medium" style="font-size: var(--text-sm); background: {authMode === 'login' ? 'var(--bg-active)' : 'transparent'}; color: {authMode === 'login' ? 'var(--text-accent)' : 'var(--text-secondary)'};">Sign In</button>
								<button onclick={() => { authMode = 'register'; }} class="rounded-lg px-4 py-1.5 font-medium" style="font-size: var(--text-sm); background: {authMode === 'register' ? 'var(--bg-active)' : 'transparent'}; color: {authMode === 'register' ? 'var(--text-accent)' : 'var(--text-secondary)'};">Register</button>
							</div>
							<input type="email" bind:value={authEmail} placeholder="Email" class="input-field" />
							<input type="password" bind:value={authPassword} placeholder="Password (8+ chars)" class="input-field" onkeydown={(e) => { if (e.key === 'Enter') handleAuth(); }} />
							<button onclick={handleAuth} disabled={authLoading} class="w-full btn-primary disabled:opacity-50">
								{authLoading ? 'Please wait...' : authMode === 'register' ? 'Create Account' : 'Sign In'}
							</button>
						</div>
					{/if}
				</div>

				<div class="rounded-2xl border p-6" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					<p class="leading-relaxed" style="font-size: var(--text-sm); color: var(--text-secondary);">
						<strong>Self-hosted sync.</strong> DevVault uses its own Rust sync server — no Supabase, no Firebase, no subscriptions. Run <code class="font-mono rounded-md px-1.5 py-0.5" style="font-size: var(--text-xs); background: var(--bg-surface-raised);">cd sync-server && cargo run</code> to start the server. Your data stays on your infrastructure.
					</p>
				</div>
			</div>

		{:else if activeTab === 'shortcuts'}
			<h2 class="text-xl font-bold mb-8" style="color: var(--text-primary);">Keyboard Shortcuts</h2>
			<div class="max-w-lg rounded-2xl border overflow-hidden" style="border-color: var(--border-default); box-shadow: var(--shadow-card);">
				{#each shortcuts as s, i}
					<div class="flex items-center justify-between px-5 py-3.5" style="background: {i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)'}; {i < shortcuts.length - 1 ? 'border-bottom: 1px solid var(--border-subtle);' : ''}">
						<span style="font-size: var(--text-sm); color: var(--text-primary);">{s.action}</span>
						<kbd class="rounded-lg px-2.5 py-1 font-mono" style="font-size: var(--text-xs); background: var(--bg-surface-raised); color: var(--text-secondary); border: 1px solid var(--border-default);">{s.keys}</kbd>
					</div>
				{/each}
			</div>

		{:else if activeTab === 'about'}
			<h2 class="text-xl font-bold mb-8" style="color: var(--text-primary);">About</h2>
			<div class="max-w-lg">
				<div class="flex items-center gap-5 mb-8">
					<div class="rounded-2xl p-5" style="background: var(--color-primary-600);">
						<Icon icon="ph:vault-bold" width={36} height={36} style="color: white;" />
					</div>
					<div>
						<h3 class="text-2xl font-bold" style="color: var(--text-primary);">{APP_NAME}</h3>
						<p class="mt-0.5" style="font-size: var(--text-base); color: var(--text-secondary);">Version {APP_VERSION}</p>
					</div>
				</div>
				<p class="leading-relaxed mb-6" style="font-size: var(--text-base); color: var(--text-secondary);">
					DevVault is a personal developer workspace & cloud sync desktop app. Built with Tauri v2, SvelteKit, Svelte 5, TailwindCSS v4, and GSAP.
				</p>
				<div class="space-y-3" style="font-size: var(--text-sm); color: var(--text-secondary);">
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
