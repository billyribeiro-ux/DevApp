<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav } from '$stores/app.svelte';
	import { getActivities } from '$services/database';
	import { formatRelativeDate } from '$utils/formatters';
	import type { Activity } from '$types';

	let activities = $state<Activity[]>([]);

	const actionIcons: Record<string, string> = {
		created: 'ph:plus-circle',
		opened: 'ph:eye',
		edited: 'ph:pencil',
		deleted: 'ph:trash',
		synced: 'ph:cloud-check',
		uploaded: 'ph:upload',
		completed: 'ph:check-circle',
	};

	const entityIcons: Record<string, string> = {
		file: 'ph:file',
		note: 'ph:note-pencil',
		prompt: 'ph:chat-dots',
		reminder: 'ph:bell',
		course: 'ph:graduation-cap',
		snippet: 'ph:code',
		folder: 'ph:folder',
	};

	onMount(async () => {
		nav.navigate('/activity');
		activities = await getActivities(100);
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="flex items-center gap-3 border-b shrink-0" style="border-color: var(--border-default); height: var(--titlebar-height); padding: 0 var(--content-padding);">
		<Icon icon="ph:clock-counter-clockwise-bold" width={24} height={24} style="color: var(--text-accent);" />
		<h1 class="text-[22px] font-bold" style="color: var(--text-primary); letter-spacing: -0.02em;">Activity</h1>
	</div>

	<div class="flex-1 overflow-y-auto" style="padding: var(--content-padding);">
		{#if activities.length > 0}
			<div class="max-w-2xl mx-auto space-y-2">
				{#each activities as activity (activity.id)}
					<div class="flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-[var(--bg-card-hover)]">
						<div class="rounded-xl p-2.5 shrink-0" style="background: var(--bg-surface-raised);">
							<Icon icon={entityIcons[activity.entity_type] ?? 'ph:circle'} width={18} height={18} style="color: var(--text-secondary);" />
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-[14px]" style="color: var(--text-primary);">
								<span class="font-medium capitalize">{activity.action}</span>
								{#if activity.entity_name}
									<span> "{activity.entity_name}"</span>
								{/if}
							</p>
							<p class="text-[13px] mt-0.5" style="color: var(--text-tertiary);">{activity.entity_type} &middot; {formatRelativeDate(activity.created_at)}</p>
						</div>
						<Icon icon={actionIcons[activity.action] ?? 'ph:circle'} width={16} height={16} style="color: var(--text-tertiary);" />
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-24">
				<Icon icon="ph:clock-counter-clockwise" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
				<p class="mt-4 text-sm font-medium" style="color: var(--text-tertiary);">No activity yet</p>
				<p class="text-xs mt-1" style="color: var(--text-tertiary);">Your actions will appear here</p>
			</div>
		{/if}
	</div>
</div>
