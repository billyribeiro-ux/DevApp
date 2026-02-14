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
		{ label: 'New Note', icon: 'ph:note-pencil-bold', href: '/notes', color: '#007AFF' },
		{ label: 'Upload Files', icon: 'ph:upload-bold', href: '/vault', color: '#5856D6' },
		{ label: 'New Prompt', icon: 'ph:chat-dots-bold', href: '/prompts', color: '#FF2D55' },
		{ label: 'New Reminder', icon: 'ph:bell-bold', href: '/reminders', color: '#FF9500' },
		{ label: 'New Snippet', icon: 'ph:code-bold', href: '/snippets', color: '#30D158' },
		{ label: 'New Course', icon: 'ph:graduation-cap-bold', href: '/courses', color: '#AF52DE' },
	];

	const now = new Date();
	const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
	const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

	onMount(async () => {
		nav.navigate('/');
		try {
			recentFiles = await getRecentFiles(6);
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
	<div style="padding: var(--content-padding-lg) var(--content-padding-lg) 8px;">
		<p class="text-[11px] font-semibold uppercase tracking-widest" style="color: var(--text-tertiary);">{dateStr}</p>
		<h1 class="text-[32px] font-bold mt-1.5" style="color: var(--text-primary); letter-spacing: -0.02em;">{greeting}</h1>
		<p class="text-[15px] mt-1" style="color: var(--text-secondary);">Welcome back to your workspace</p>
	</div>

	<div style="padding: 24px var(--content-padding-lg); display: flex; flex-direction: column; gap: var(--section-gap);">
		<!-- Quick Actions -->
		<section>
			<h2 class="text-[11px] font-semibold uppercase tracking-widest mb-4" style="color: var(--text-tertiary);">Quick Actions</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
				{#each quickActions as action}
					<a
						href={action.href}
						onclick={() => nav.navigate(action.href)}
						class="group flex flex-col items-center gap-2.5 rounded-2xl border p-5 transition-all duration-200 hover:shadow-md"
						style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);"
					>
						<div class="rounded-2xl p-3 transition-transform duration-200 group-hover:scale-110" style="background: {action.color}15;">
							<Icon icon={action.icon} width={28} height={28} style="color: {action.color};" />
						</div>
						<span class="text-xs font-medium" style="color: var(--text-secondary);">{action.label}</span>
					</a>
				{/each}
			</div>
		</section>

		<!-- Stats Row -->
		<section class="grid grid-cols-2 lg:grid-cols-4 gap-5">
			<div class="rounded-2xl border p-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
				<div class="flex items-center gap-3">
					<div class="rounded-xl p-2.5" style="background: var(--color-info-light);">
						<Icon icon="ph:files-bold" width={22} height={22} style="color: var(--color-primary-500);" />
					</div>
					<div>
						<p class="text-[28px] font-bold leading-none" style="color: var(--text-primary);">{vault.folders.length}</p>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">Folders</p>
					</div>
				</div>
			</div>
			<div class="rounded-2xl border p-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
				<div class="flex items-center gap-3">
					<div class="rounded-xl p-2.5" style="background: var(--color-success-light);">
						<Icon icon="ph:note-pencil-bold" width={22} height={22} style="color: var(--color-success);" />
					</div>
					<div>
						<p class="text-[28px] font-bold leading-none" style="color: var(--text-primary);">{recentFiles.length}</p>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">Recent Files</p>
					</div>
				</div>
			</div>
			<div class="rounded-2xl border p-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
				<div class="flex items-center gap-3">
					<div class="rounded-xl p-2.5" style="background: var(--color-warning-light);">
						<Icon icon="ph:bell-bold" width={22} height={22} style="color: var(--color-warning);" />
					</div>
					<div>
						<p class="text-[28px] font-bold leading-none" style="color: var(--text-primary);">{upcomingReminders.length}</p>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">Pending Reminders</p>
					</div>
				</div>
			</div>
			<div class="rounded-2xl border p-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
				<div class="flex items-center gap-3">
					<div class="rounded-xl p-2.5" style="background: rgba(175, 82, 222, 0.1);">
						<Icon icon="ph:graduation-cap-bold" width={22} height={22} style="color: #AF52DE;" />
					</div>
					<div>
						<p class="text-[28px] font-bold leading-none" style="color: var(--text-primary);">{activeCourses.length}</p>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">Active Courses</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Recent Files -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-[11px] font-semibold uppercase tracking-widest" style="color: var(--text-tertiary);">Recent Files</h2>
				<a href="/vault" onclick={() => nav.navigate('/vault')} class="text-xs font-medium" style="color: var(--text-accent);">View all</a>
			</div>
			{#if recentFiles.length > 0}
				<div class="rounded-2xl border overflow-hidden" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					{#each recentFiles as file, i}
						{@const typeInfo = getFileTypeInfo(file.extension)}
						<div class="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--bg-card-hover)]" style="{i < recentFiles.length - 1 ? 'border-bottom: 1px solid var(--border-subtle);' : ''}">
							<div class="rounded-xl p-2 shrink-0" style="background: {typeInfo.color}12;">
								<Icon icon={typeInfo.icon} width={20} height={20} style="color: {typeInfo.color};" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium truncate" style="color: var(--text-primary);">{file.name}</p>
								<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">{formatFileSize(file.size_bytes)}</p>
							</div>
							<span class="text-xs shrink-0" style="color: var(--text-tertiary);">{formatRelativeDate(file.updated_at)}</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed p-16" style="border-color: var(--border-default);">
					<Icon icon="ph:folder-open" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.4;" />
					<p class="mt-4 text-sm font-medium" style="color: var(--text-tertiary);">No files yet</p>
					<p class="text-xs mt-1" style="color: var(--text-tertiary);">Upload files to your vault to see them here</p>
				</div>
			{/if}
		</section>

		<!-- Upcoming Reminders -->
		<section>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-[11px] font-semibold uppercase tracking-widest" style="color: var(--text-tertiary);">Upcoming Reminders</h2>
				<a href="/reminders" onclick={() => nav.navigate('/reminders')} class="text-xs font-medium" style="color: var(--text-accent);">View all</a>
			</div>
			{#if upcomingReminders.length > 0}
				<div class="rounded-2xl border overflow-hidden" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					{#each upcomingReminders as reminder, i}
						<div class="flex items-center gap-4 px-5 py-4" style="{i < upcomingReminders.length - 1 ? 'border-bottom: 1px solid var(--border-subtle);' : ''} border-left: 3px solid {reminder.priority === 'urgent' ? 'var(--color-error)' : reminder.priority === 'high' ? 'var(--color-warning)' : 'var(--color-primary-500)'};">
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium" style="color: var(--text-primary);">{reminder.title}</p>
								{#if reminder.due_date}
									<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">Due {formatRelativeDate(reminder.due_date)}</p>
								{/if}
							</div>
							<span class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase" style="background: {reminder.priority === 'urgent' ? 'var(--color-error-light)' : reminder.priority === 'high' ? 'var(--color-warning-light)' : 'var(--bg-active)'}; color: {reminder.priority === 'urgent' ? 'var(--color-error)' : reminder.priority === 'high' ? 'var(--color-warning)' : 'var(--text-accent)'};">
								{reminder.priority}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex items-center gap-3 rounded-2xl border border-dashed p-8 justify-center" style="border-color: var(--border-default);">
					<Icon icon="ph:check-circle" width={28} height={28} style="color: var(--color-success); opacity: 0.5;" />
					<p class="text-sm" style="color: var(--text-tertiary);">No pending reminders. You're all caught up!</p>
				</div>
			{/if}
		</section>

		<!-- Active Courses -->
		{#if activeCourses.length > 0}
			<section class="pb-10">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-[11px] font-semibold uppercase tracking-widest" style="color: var(--text-tertiary);">Active Courses</h2>
					<a href="/courses" onclick={() => nav.navigate('/courses')} class="text-xs font-medium" style="color: var(--text-accent);">View all</a>
				</div>
				<div class="rounded-2xl border overflow-hidden" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					{#each activeCourses as course, i}
						<div class="px-5 py-4" style="{i < activeCourses.length - 1 ? 'border-bottom: 1px solid var(--border-subtle);' : ''}">
							<div class="flex items-center justify-between mb-2">
								<div>
									<p class="text-sm font-medium" style="color: var(--text-primary);">{course.name}</p>
									{#if course.instructor}
										<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">by {course.instructor}</p>
									{/if}
								</div>
								<span class="text-xs font-semibold" style="color: var(--text-accent);">{course.progress_percent}%</span>
							</div>
							<div class="h-2 rounded-full overflow-hidden" style="background: var(--bg-surface-raised);">
								<div class="h-full rounded-full transition-all duration-500" style="width: {course.progress_percent}%; background: var(--color-primary-500);"></div>
							</div>
							<div class="flex items-center justify-between mt-2">
								<span class="text-[10px]" style="color: var(--text-tertiary);">{course.completed_lessons}/{course.total_lessons} lessons</span>
								{#if course.platform}
									<span class="text-[10px] rounded-md px-2 py-0.5" style="background: var(--bg-surface-raised); color: var(--text-secondary);">{course.platform}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>
