<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Reminder } from '$types';
	import { formatDate, formatTime, getPriorityColor, truncate } from '$utils/formatters';

	let {
		reminder,
		oncomplete,
		onedit
	}: {
		reminder: Reminder;
		oncomplete: (id: string) => void;
		onedit: (id: string) => void;
	} = $props();

	let isCompleted = $derived(reminder.status === 'completed');

	let isOverdue = $derived.by(() => {
		if (isCompleted || !reminder.due_date) return false;
		const now = new Date();
		const dueDate = new Date(reminder.due_date);
		if (reminder.due_time) {
			const [hours, minutes] = reminder.due_time.split(':');
			dueDate.setHours(parseInt(hours), parseInt(minutes));
		} else {
			dueDate.setHours(23, 59, 59);
		}
		return now > dueDate;
	});

	let priorityColor = $derived(getPriorityColor(reminder.priority));

	let priorityBorderClass = $derived.by(() => {
		switch (reminder.priority) {
			case 'urgent':
				return 'border-l-red-500';
			case 'high':
				return 'border-l-amber-500';
			case 'medium':
				return 'border-l-blue-500';
			case 'low':
				return 'border-l-neutral-400';
			default:
				return 'border-l-neutral-400';
		}
	});

	let priorityBadgeClass = $derived.by(() => {
		switch (reminder.priority) {
			case 'urgent':
				return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
			case 'high':
				return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
			case 'medium':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
			case 'low':
				return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400';
			default:
				return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400';
		}
	});

	let statusBadgeClass = $derived.by(() => {
		switch (reminder.status) {
			case 'completed':
				return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
			case 'pending':
				return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
			case 'overdue':
				return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
			case 'snoozed':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
			default:
				return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400';
		}
	});

	let recurrenceIcon = $derived.by(() => {
		switch (reminder.recurrence) {
			case 'daily':
				return 'ph:repeat';
			case 'weekly':
				return 'ph:calendar-blank';
			case 'monthly':
				return 'ph:calendar-dots';
			default:
				return '';
		}
	});

	let descriptionPreview = $derived(
		reminder.description ? truncate(reminder.description, 80) : ''
	);

	function handleCheckbox(e: Event) {
		e.stopPropagation();
		if (!isCompleted) {
			oncomplete(reminder.id);
		}
	}
</script>

<div
	class="group rounded-lg border border-l-4 p-4 transition-all duration-150
		{priorityBorderClass}
		{isOverdue && !isCompleted
			? 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20'
			: 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'}
		{isCompleted ? 'opacity-60' : ''}
		hover:shadow-sm"
>
	<div class="flex items-start gap-3">
		<!-- Checkbox -->
		<button
			type="button"
			onclick={handleCheckbox}
			class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors
				{isCompleted
					? 'border-green-500 bg-green-500 text-white'
					: 'border-neutral-300 hover:border-indigo-500 dark:border-neutral-600 dark:hover:border-indigo-400'}"
			title={isCompleted ? 'Completed' : 'Mark as complete'}
		>
			{#if isCompleted}
				<Icon icon="ph:check-bold" width={12} height={12} />
			{/if}
		</button>

		<!-- Content -->
		<div class="min-w-0 flex-1">
			<!-- Title row -->
			<div class="mb-1 flex items-start justify-between gap-2">
				<h3
					class="text-sm font-semibold
						{isCompleted
							? 'text-neutral-400 line-through dark:text-neutral-500'
							: 'text-neutral-900 dark:text-neutral-100'}"
				>
					{reminder.title}
				</h3>

				<!-- Edit button -->
				<button
					type="button"
					onclick={() => onedit(reminder.id)}
					class="flex-shrink-0 rounded-md p-1 text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
					title="Edit reminder"
				>
					<Icon icon="ph:pencil-simple" width={14} height={14} />
				</button>
			</div>

			<!-- Description preview -->
			{#if descriptionPreview}
				<p class="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
					{descriptionPreview}
				</p>
			{/if}

			<!-- Meta: badges row -->
			<div class="flex flex-wrap items-center gap-2">
				<!-- Due date -->
				{#if reminder.due_date}
					<span
						class="inline-flex items-center gap-1 text-[11px] font-medium
							{isOverdue && !isCompleted
								? 'text-red-600 dark:text-red-400'
								: 'text-neutral-500 dark:text-neutral-400'}"
					>
						<Icon
							icon={isOverdue && !isCompleted ? 'ph:warning' : 'ph:calendar-blank'}
							width={12}
							height={12}
						/>
						{formatDate(reminder.due_date)}
						{#if reminder.due_time}
							<span class="ml-0.5">{formatTime(reminder.due_time)}</span>
						{/if}
					</span>
				{/if}

				<!-- Priority badge -->
				<span
					class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {priorityBadgeClass}"
				>
					{reminder.priority}
				</span>

				<!-- Status badge -->
				<span
					class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {statusBadgeClass}"
				>
					{reminder.status}
				</span>

				<!-- Recurrence icon -->
				{#if reminder.recurrence !== 'none' && recurrenceIcon}
					<span
						class="inline-flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500"
						title="Repeats {reminder.recurrence}"
					>
						<Icon icon={recurrenceIcon} width={13} height={13} />
						{reminder.recurrence}
					</span>
				{/if}
			</div>
		</div>
	</div>
</div>
