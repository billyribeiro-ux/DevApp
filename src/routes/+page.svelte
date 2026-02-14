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

<div class="flex flex-col h-full overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between px-6 shrink-0" style="height: 56px;">
		<div>
			<h1 class="text-lg font-semibold" style="color: var(--text-primary); letter-spacing: -0.02em;">{greeting}</h1>
			<p class="text-[12px]" style="color: var(--text-tertiary);">{dateStr}</p>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto w-full max-w-[860px] px-6 py-4 space-y-10">

			<!-- Quick Actions -->
			<section>
				<div class="flex flex-wrap gap-2">
					{#each quickActions as action}
						<a
							href={action.href}
							onclick={() => nav.navigate(action.href)}
							class="group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors duration-100"
							style="border-color: var(--border-default); color: var(--text-secondary); background: var(--bg-card);"
						>
							<Icon icon={action.icon} width={16} height={16} style="color: {action.color}; opacity: 0.85;" />
							<span class="font-medium">{action.label}</span>
						</a>
					{/each}
				</div>
			</section>

			<!-- Stats -->
			<section class="grid grid-cols-4 gap-px rounded-xl border overflow-hidden" style="border-color: var(--border-default); background: var(--border-default);">
				{#each [
					{ label: 'Folders', value: vault.folders.length, icon: 'ph:files-bold', color: '#007AFF' },
					{ label: 'Recent Files', value: recentFiles.length, icon: 'ph:note-pencil-bold', color: '#30D158' },
					{ label: 'Reminders', value: upcomingReminders.length, icon: 'ph:bell-bold', color: '#FF9500' },
					{ label: 'Courses', value: activeCourses.length, icon: 'ph:graduation-cap-bold', color: '#AF52DE' },
				] as stat}
					<div class="flex items-center gap-3 px-4 py-4" style="background: var(--bg-card);">
						<Icon icon={stat.icon} width={18} height={18} style="color: {stat.color}; opacity: 0.8;" />
						<div>
							<p class="text-[18px] font-semibold leading-none" style="color: var(--text-primary);">{stat.value}</p>
							<p class="text-[11px] mt-1" style="color: var(--text-tertiary);">{stat.label}</p>
						</div>
					</div>
				{/each}
			</section>

			<!-- Two Column Layout -->
			<div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

				<!-- Left: Recent Files (3 cols) -->
				<section class="lg:col-span-3">
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-[13px] font-medium" style="color: var(--text-secondary);">Recent Files</h2>
						<a href="/vault" onclick={() => nav.navigate('/vault')} class="text-[12px] font-medium" style="color: var(--text-accent);">View all</a>
					</div>
					{#if recentFiles.length > 0}
						<div class="rounded-xl border overflow-hidden" style="border-color: var(--border-default); background: var(--bg-card);">
							{#each recentFiles as file, i}
								{@const typeInfo = getFileTypeInfo(file.extension)}
								<div
									class="flex items-center gap-3 px-4 py-3 transition-colors duration-75 hover:bg-[var(--bg-card-hover)] cursor-default"
									style="{i < recentFiles.length - 1 ? 'border-bottom: 1px solid var(--border-subtle);' : ''}"
								>
									<Icon icon={typeInfo.icon} width={16} height={16} style="color: {typeInfo.color}; opacity: 0.75;" />
									<div class="min-w-0 flex-1">
										<p class="text-[13px] font-medium truncate" style="color: var(--text-primary);">{file.name}</p>
									</div>
									<span class="text-[11px] shrink-0" style="color: var(--text-tertiary);">{formatFileSize(file.size_bytes)}</span>
									<span class="text-[11px] shrink-0" style="color: var(--text-tertiary);">{formatRelativeDate(file.updated_at)}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="flex flex-col items-center justify-center rounded-xl border border-dashed py-14" style="border-color: var(--border-default);">
							<Icon icon="ph:folder-open" width={40} height={40} style="color: var(--text-tertiary); opacity: 0.3;" />
							<p class="mt-3 text-[13px]" style="color: var(--text-tertiary);">No files yet</p>
						</div>
					{/if}
				</section>

				<!-- Right: Reminders (2 cols) -->
				<section class="lg:col-span-2">
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-[13px] font-medium" style="color: var(--text-secondary);">Reminders</h2>
						<a href="/reminders" onclick={() => nav.navigate('/reminders')} class="text-[12px] font-medium" style="color: var(--text-accent);">View all</a>
					</div>
					{#if upcomingReminders.length > 0}
						<div class="rounded-xl border overflow-hidden" style="border-color: var(--border-default); background: var(--bg-card);">
							{#each upcomingReminders as reminder, i}
								<div
									class="flex items-start gap-3 px-4 py-3"
									style="{i < upcomingReminders.length - 1 ? 'border-bottom: 1px solid var(--border-subtle);' : ''}"
								>
									<div
										class="mt-1.5 h-2 w-2 rounded-full shrink-0"
										style="background: {reminder.priority === 'urgent' ? 'var(--color-error)' : reminder.priority === 'high' ? 'var(--color-warning)' : 'var(--color-primary-500)'};"
									></div>
									<div class="min-w-0 flex-1">
										<p class="text-[13px] font-medium" style="color: var(--text-primary);">{reminder.title}</p>
										{#if reminder.due_date}
											<p class="text-[11px] mt-0.5" style="color: var(--text-tertiary);">Due {formatRelativeDate(reminder.due_date)}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="flex items-center gap-2 rounded-xl border border-dashed px-4 py-8 justify-center" style="border-color: var(--border-default);">
							<Icon icon="ph:check-circle" width={18} height={18} style="color: var(--color-success); opacity: 0.5;" />
							<p class="text-[13px]" style="color: var(--text-tertiary);">All caught up</p>
						</div>
					{/if}
				</section>
			</div>

			<!-- Active Courses -->
			{#if activeCourses.length > 0}
				<section class="pb-8">
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-[13px] font-medium" style="color: var(--text-secondary);">Active Courses</h2>
						<a href="/courses" onclick={() => nav.navigate('/courses')} class="text-[12px] font-medium" style="color: var(--text-accent);">View all</a>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each activeCourses as course}
							<div class="rounded-xl border px-4 py-3.5" style="border-color: var(--border-default); background: var(--bg-card);">
								<div class="flex items-start justify-between mb-2.5">
									<div class="min-w-0 flex-1">
										<p class="text-[13px] font-medium truncate" style="color: var(--text-primary);">{course.name}</p>
										{#if course.instructor}
											<p class="text-[11px] mt-0.5" style="color: var(--text-tertiary);">{course.instructor}</p>
										{/if}
									</div>
									<span class="text-[12px] font-semibold shrink-0 ml-3" style="color: var(--text-accent);">{course.progress_percent}%</span>
								</div>
								<div class="h-1.5 rounded-full overflow-hidden" style="background: var(--bg-surface-raised);">
									<div class="h-full rounded-full transition-all duration-500" style="width: {course.progress_percent}%; background: var(--color-primary-500);"></div>
								</div>
								<div class="flex items-center justify-between mt-2">
									<span class="text-[11px]" style="color: var(--text-tertiary);">{course.completed_lessons}/{course.total_lessons} lessons</span>
									{#if course.platform}
										<span class="text-[11px]" style="color: var(--text-tertiary);">{course.platform}</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

		</div>
	</div>
</div>