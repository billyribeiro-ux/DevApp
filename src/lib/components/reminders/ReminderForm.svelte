<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Reminder } from '$types';

	let {
		reminder,
		onsave,
		oncancel
	}: {
		reminder: Reminder | null;
		onsave: (reminder: Partial<Reminder>) => void;
		oncancel: () => void;
	} = $props();

	let title = $state(reminder?.title ?? '');
	let description = $state(reminder?.description ?? '');
	let due_date = $state(reminder?.due_date ?? '');
	let due_time = $state(reminder?.due_time ?? '');
	let priority = $state<Reminder['priority']>(reminder?.priority ?? 'medium');
	let recurrence = $state<Reminder['recurrence']>(reminder?.recurrence ?? 'none');

	let isEditing = $derived(reminder !== null);

	// Validation
	let titleError = $state('');
	let isValid = $derived(title.trim().length > 0);

	function validateTitle() {
		titleError = title.trim().length === 0 ? 'Title is required' : '';
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		validateTitle();

		if (!isValid) return;

		onsave({
			...(reminder ? { id: reminder.id } : {}),
			title: title.trim(),
			description: description.trim() || null,
			due_date: due_date || null,
			due_time: due_time || null,
			priority,
			recurrence
		});
	}

	let priorityOptions: Array<{ value: Reminder['priority']; label: string; color: string }> = [
		{ value: 'low', label: 'Low', color: 'text-neutral-500' },
		{ value: 'medium', label: 'Medium', color: 'text-blue-500' },
		{ value: 'high', label: 'High', color: 'text-amber-500' },
		{ value: 'urgent', label: 'Urgent', color: 'text-red-500' }
	];

	let recurrenceOptions: Array<{ value: Reminder['recurrence']; label: string; icon: string }> = [
		{ value: 'none', label: 'Does not repeat', icon: 'ph:x' },
		{ value: 'daily', label: 'Daily', icon: 'ph:repeat' },
		{ value: 'weekly', label: 'Weekly', icon: 'ph:calendar-blank' },
		{ value: 'monthly', label: 'Monthly', icon: 'ph:calendar-dots' }
	];
</script>

<form onsubmit={handleSubmit} class="flex h-full flex-col bg-white dark:bg-neutral-900">
	<!-- Header -->
	<div
		class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700"
	>
		<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
			{isEditing ? 'Edit Reminder' : 'New Reminder'}
		</h2>

		<button
			type="button"
			onclick={oncancel}
			class="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
		>
			<Icon icon="ph:x" width={20} height={20} />
		</button>
	</div>

	<!-- Form body -->
	<div class="flex-1 space-y-5 overflow-y-auto p-6">
		<!-- Title -->
		<div>
			<label
				for="reminder-title"
				class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
			>
				Title <span class="text-red-500">*</span>
			</label>
			<input
				id="reminder-title"
				type="text"
				bind:value={title}
				onblur={validateTitle}
				placeholder="e.g., Review pull request"
				class="w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:ring-2 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500
					{titleError
						? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
						: 'border-neutral-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-neutral-600 dark:focus:border-indigo-400'}"
			/>
			{#if titleError}
				<p class="mt-1 text-xs text-red-500">{titleError}</p>
			{/if}
		</div>

		<!-- Description -->
		<div>
			<label
				for="reminder-description"
				class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
			>
				Description
			</label>
			<textarea
				id="reminder-description"
				bind:value={description}
				placeholder="Add more details about this reminder..."
				rows={3}
				class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm leading-relaxed text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-indigo-400"
			></textarea>
		</div>

		<!-- Due date + Due time row -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label
					for="reminder-due-date"
					class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
				>
					<Icon icon="ph:calendar-blank" width={14} height={14} class="mr-1 inline-block align-text-bottom" />
					Due Date
				</label>
				<input
					id="reminder-due-date"
					type="date"
					bind:value={due_date}
					class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-indigo-400"
				/>
			</div>

			<div>
				<label
					for="reminder-due-time"
					class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
				>
					<Icon icon="ph:clock" width={14} height={14} class="mr-1 inline-block align-text-bottom" />
					Due Time
				</label>
				<input
					id="reminder-due-time"
					type="time"
					bind:value={due_time}
					class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-indigo-400"
				/>
			</div>
		</div>

		<!-- Priority -->
		<div>
			<label
				class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
			>
				<Icon icon="ph:flag" width={14} height={14} class="mr-1 inline-block align-text-bottom" />
				Priority
			</label>
			<div class="grid grid-cols-4 gap-2">
				{#each priorityOptions as opt}
					<button
						type="button"
						onclick={() => (priority = opt.value)}
						class="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all
							{priority === opt.value
								? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/30 dark:text-indigo-300'
								: 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:bg-neutral-800'}"
					>
						<span
							class="inline-block h-2 w-2 rounded-full
								{opt.value === 'urgent' ? 'bg-red-500' : ''}
								{opt.value === 'high' ? 'bg-amber-500' : ''}
								{opt.value === 'medium' ? 'bg-blue-500' : ''}
								{opt.value === 'low' ? 'bg-neutral-400' : ''}"
						></span>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Recurrence -->
		<div>
			<label
				for="reminder-recurrence"
				class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
			>
				<Icon icon="ph:repeat" width={14} height={14} class="mr-1 inline-block align-text-bottom" />
				Recurrence
			</label>
			<select
				id="reminder-recurrence"
				bind:value={recurrence}
				class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-indigo-400"
			>
				{#each recurrenceOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Footer: actions -->
	<div
		class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700"
	>
		<button
			type="button"
			onclick={oncancel}
			class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
		>
			Cancel
		</button>

		<button
			type="submit"
			disabled={!isValid}
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
		>
			{isEditing ? 'Update Reminder' : 'Create Reminder'}
		</button>
	</div>
</form>
