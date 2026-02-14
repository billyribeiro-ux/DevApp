<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { vault, nav, toasts } from '$stores/app.svelte';
	import { getRecentFiles, getReminders, getCourses, getActivities } from '$services/database';
	import { formatFileSize, formatRelativeDate } from '$utils/formatters';
	import { getFileTypeInfo } from '$config/constants';
	import type { VaultFile, Reminder, Course, Activity } from '$types';

	let recentFiles = $state<VaultFile[]>([]);
	let upcomingReminders = $state<Reminder[]>([]);
	let activeCourses = $state<Course[]>([]);
	let recentActivity = $state<Activity[]>([]);

	const quickActions = [
		{ label: 'New Note', icon: 'ph:note-pencil-bold', href: '/notes', color: '#6366f1' },
		{ label: 'Upload Files', icon: 'ph:upload-bold', href: '/vault', color: '#3b82f6' },
		{ label: 'New Prompt', icon: 'ph:chat-dots-bold', href: '/prompts', color: '#ec4899' },
		{ label: 'New Reminder', icon: 'ph:bell-bold', href: '/reminders', color: '#f59e0b' },
		{ label: 'New Snippet', icon: 'ph:code-bold', href: '/snippets', color: '#14b8a6' },
		{ label: 'New Course', icon: 'ph:graduation-cap-bold', href: '/courses', color: '#8b5cf6' },
	];

	const now = new Date();
	const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
	const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

	onMount(async () => {
		nav.navigate('/');
		try {
			recentFiles = await getRecentFiles(8);
			upcomingReminders = (await getReminders('pending')).slice(0, 5);
			activeCourses = (await getCourses('in_progress')).slice(0, 4);
			recentActivity = await getActivities(10);
		} catch (e) {
			console.error('Dashboard load error:', e);
		}
	});
</script>

<div class="flex flex-col h-full overflow-y-auto">
	<!-- Header -->
	<div class="px-8 pt-8 pb-2">
		<p class="text-sm font-medium" style="color: var(--text-tertiary);">{dateStr}</p>
		<h1 class="text-3xl font-bold mt-1" style="color: var(--text-primary);">{greeting}</h1>
		<p class="text-sm mt-1" style="color: var(--text-secondary);">Welcome back to your workspace</p>
	</div>

	<div class="px-8 py-6 space-y-8">
		<!-- Quick Actions -->
		<section>
			<h2 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--text-tertiary);">Quick Actions</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
				{#each quickActions as action}
					<a
						href={action.href}
						onclick={() => nav.navigate(action.href)}
						class="group flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 hover:shadow-md"
						style="background: var(--bg-card); border-color: var(--border-default);"
					>
						<div class="rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-110" style="background: {action.color}15;">
							<Icon icon={action.icon} width={22} height={22} style="color: {action.color};" />
						</div>
						<span class="text-xs font-medium" style="color: var(--text-secondary);">{action.label}</span>
					</a>
				{/each}
			</div>
		</section>

		<!-- Stats Row -->
		<section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="rounded-xl border p-4" style="background: var(--bg-card); border-color: var(--border-default);">
				<div class="flex items-center gap-3">
					<div class="rounded-lg p-2" style="background: var(--color-primary-50);">
						<Icon icon="ph:files-bold" width={20} height={20} style="color: var(--color-primary-600);" />
					</div>
					<div>
						<p class="text-2xl font-bold" style="color: var(--text-primary);">{vault.folders.length}</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Folders</p>
					</div>
				</div>
			</div>
			<div class="rounded-xl border p-4" style="background: var(--bg-card); border-color: var(--border-default);">
				<div class="flex items-center gap-3">
					<div class="rounded-lg p-2" style="background: var(--color-success-light);">
						<Icon icon="ph:note-pencil-bold" width={20} height={20} style="color: var(--color-success);" />
					</div>
					<div>
						<p class="text-2xl font-bold" style="color: var(--text-primary);">{recentFiles.length}</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Recent Files</p>
					</div>
				</div>
			</div>
			<div class="rounded-xl border p-4" style="background: var(--bg-card); border-color: var(--border-default);">
				<div class="flex items-center gap-3">
					<div class="rounded-lg p-2" style="background: var(--color-warning-light);">
						<Icon icon="ph:bell-bold" width={20} height={20} style="color: var(--color-warning);" />
					</div>
					<div>
						<p class="text-2xl font-bold" style="color: var(--text-primary);">{upcomingReminders.length}</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Pending Reminders</p>
					</div>
				</div>
			</div>
			<div class="rounded-xl border p-4" style="background: var(--bg-card); border-color: var(--border-default);">
				<div class="flex items-center gap-3">
					<div class="rounded-lg p-2" style="background: rgba(139, 92, 246, 0.1);">
						<Icon icon="ph:graduation-cap-bold" width={20} height={20} style="color: #8b5cf6;" />
					</div>
					<div>
						<p class="text-2xl font-bold" style="color: var(--text-primary);">{activeCourses.length}</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Active Courses</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Recent Files -->
		<section>
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">Recent Files</h2>
				<a href="/vault" onclick={() => nav.navigate('/vault')} class="text-xs font-medium" style="color: var(--text-accent);">View all</a>
			</div>
			{#if recentFiles.length > 0}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{#each recentFiles as file}
						{@const typeInfo = getFileTypeInfo(file.extension)}
						<div class="flex items-center gap-3 rounded-xl border p-3 transition-all duration-150 hover:shadow-sm cursor-pointer" style="background: var(--bg-card); border-color: var(--border-default);">
							<div class="rounded-lg p-2 shrink-0" style="background: {typeInfo.color}15;">
								<Icon icon={typeInfo.icon} width={20} height={20} style="color: {typeInfo.color};" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium truncate" style="color: var(--text-primary);">{file.name}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">{formatFileSize(file.size_bytes)} &middot; {formatRelativeDate(file.updated_at)}</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center rounded-xl border border-dashed p-12" style="border-color: var(--border-default);">
					<Icon icon="ph:folder-open" width={48} height={48} style="color: var(--text-tertiary); opacity: 0.5;" />
					<p class="mt-3 text-sm font-medium" style="color: var(--text-tertiary);">No files yet</p>
					<p class="text-xs mt-1" style="color: var(--text-tertiary);">Upload files to your vault to see them here</p>
				</div>
			{/if}
		</section>

		<!-- Upcoming Reminders -->
		<section>
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">Upcoming Reminders</h2>
				<a href="/reminders" onclick={() => nav.navigate('/reminders')} class="text-xs font-medium" style="color: var(--text-accent);">View all</a>
			</div>
			{#if upcomingReminders.length > 0}
				<div class="space-y-2">
					{#each upcomingReminders as reminder}
						<div class="flex items-center gap-3 rounded-xl border p-3" style="background: var(--bg-card); border-color: var(--border-default); border-left: 3px solid {reminder.priority === 'urgent' ? 'var(--color-error)' : reminder.priority === 'high' ? 'var(--color-warning)' : 'var(--color-primary-500)'};">
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium" style="color: var(--text-primary);">{reminder.title}</p>
								{#if reminder.due_date}
									<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">Due {formatRelativeDate(reminder.due_date)}</p>
								{/if}
							</div>
							<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style="background: {reminder.priority === 'urgent' ? 'var(--color-error-light)' : reminder.priority === 'high' ? 'var(--color-warning-light)' : 'var(--bg-active)'}; color: {reminder.priority === 'urgent' ? 'var(--color-error)' : reminder.priority === 'high' ? 'var(--color-warning)' : 'var(--text-accent)'};">
								{reminder.priority}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex items-center gap-3 rounded-xl border border-dashed p-6 justify-center" style="border-color: var(--border-default);">
					<Icon icon="ph:check-circle" width={24} height={24} style="color: var(--color-success); opacity: 0.5;" />
					<p class="text-sm" style="color: var(--text-tertiary);">No pending reminders. You're all caught up!</p>
				</div>
			{/if}
		</section>

		<!-- Keyboard Shortcuts Help -->
		<section class="pb-8">
			<h2 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--text-tertiary);">Keyboard Shortcuts</h2>
			<div class="grid grid-cols-2 lg:grid-cols-3 gap-2">
				{#each [
					{ keys: 'Ctrl/Cmd + K', desc: 'Global Search' },
					{ keys: 'Ctrl/Cmd + Shift + P', desc: 'Command Palette' },
					{ keys: 'Ctrl/Cmd + B', desc: 'Toggle Sidebar' },
					{ keys: 'Ctrl/Cmd + Shift + M', desc: 'Toggle Theme' },
					{ keys: 'Ctrl/Cmd + N', desc: 'New Note' },
					{ keys: 'Ctrl/Cmd + U', desc: 'Upload Files' },
				] as shortcut}
					<div class="flex items-center justify-between rounded-lg border px-3 py-2" style="background: var(--bg-card); border-color: var(--border-default);">
						<span class="text-xs" style="color: var(--text-secondary);">{shortcut.desc}</span>
						<kbd class="rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium" style="background: var(--bg-surface-raised); color: var(--text-tertiary); border: 1px solid var(--border-default);">{shortcut.keys}</kbd>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
