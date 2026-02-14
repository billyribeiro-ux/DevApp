<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getReminders, createReminder, updateReminder, completeReminder, deleteReminder } from '$services/database';
	import { formatRelativeDate, formatDate, getPriorityColor } from '$utils/formatters';
	import type { Reminder } from '$types';
	import { v4 as uuid } from 'uuid';

	let reminders = $state<Reminder[]>([]);
	let activeFilter = $state('all');
	let showForm = $state(false);
	let editingReminder = $state<Reminder | null>(null);

	// Form state
	let fTitle = $state('');
	let fDescription = $state('');
	let fDueDate = $state('');
	let fDueTime = $state('');
	let fPriority = $state<Reminder['priority']>('medium');
	let fRecurrence = $state<Reminder['recurrence']>('none');

	let filteredReminders = $derived(() => {
		if (activeFilter === 'all') return reminders;
		return reminders.filter(r => r.status === activeFilter);
	});

	const filters = [
		{ value: 'all', label: 'All', icon: 'ph:list' },
		{ value: 'pending', label: 'Pending', icon: 'ph:clock' },
		{ value: 'overdue', label: 'Overdue', icon: 'ph:warning' },
		{ value: 'completed', label: 'Completed', icon: 'ph:check-circle' },
	];

	function startEdit(reminder?: Reminder) {
		if (reminder) {
			editingReminder = reminder;
			fTitle = reminder.title;
			fDescription = reminder.description ?? '';
			fDueDate = reminder.due_date ?? '';
			fDueTime = reminder.due_time ?? '';
			fPriority = reminder.priority;
			fRecurrence = reminder.recurrence;
		} else {
			editingReminder = null;
			fTitle = '';
			fDescription = '';
			fDueDate = '';
			fDueTime = '';
			fPriority = 'medium';
			fRecurrence = 'none';
		}
		showForm = true;
	}

	async function handleSave() {
		if (!fTitle.trim()) { toasts.warning('Title is required'); return; }
		if (editingReminder) {
			await updateReminder(editingReminder.id, { title: fTitle, description: fDescription || null, due_date: fDueDate || null, due_time: fDueTime || null, priority: fPriority, recurrence: fRecurrence });
		} else {
			await createReminder({ id: uuid(), title: fTitle, description: fDescription || null, due_date: fDueDate || null, due_time: fDueTime || null, priority: fPriority, recurrence: fRecurrence });
		}
		reminders = await getReminders();
		showForm = false;
		toasts.success(editingReminder ? 'Reminder Updated' : 'Reminder Created');
	}

	async function handleComplete(id: string) {
		await completeReminder(id);
		reminders = await getReminders();
		toasts.success('Reminder Completed');
	}

	async function handleDelete(id: string) {
		await deleteReminder(id);
		reminders = await getReminders();
		toasts.success('Reminder Deleted');
	}

	onMount(async () => {
		nav.navigate('/reminders');
		reminders = await getReminders();
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="flex items-center justify-between px-6 py-4 border-b shrink-0" style="border-color: var(--border-default);">
		<div class="flex items-center gap-3">
			<Icon icon="ph:bell-bold" width={22} height={22} style="color: #f59e0b;" />
			<h1 class="text-lg font-bold" style="color: var(--text-primary);">Reminders</h1>
			<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" style="background: var(--color-warning-light); color: var(--color-warning);">{reminders.filter(r => r.status === 'pending').length} pending</span>
		</div>
		<button onclick={() => startEdit()} class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white" style="background: var(--color-primary-600);">
			<Icon icon="ph:plus-bold" width={14} height={14} /> New Reminder
		</button>
	</div>

	<div class="flex items-center gap-1 px-6 py-2 border-b shrink-0" style="border-color: var(--border-default);">
		{#each filters as f}
			<button onclick={() => { activeFilter = f.value; }} class="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors" style="background: {activeFilter === f.value ? 'var(--bg-active)' : 'transparent'}; color: {activeFilter === f.value ? 'var(--text-accent)' : 'var(--text-secondary)'};">
				<Icon icon={f.icon} width={12} height={12} />
				{f.label}
			</button>
		{/each}
	</div>

	<div class="flex-1 overflow-y-auto px-6 py-4">
		{#if showForm}
			<div class="max-w-lg mx-auto animate-slide-up">
				<div class="rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border-default);">
					<h3 class="text-sm font-semibold" style="color: var(--text-primary);">{editingReminder ? 'Edit Reminder' : 'New Reminder'}</h3>
					<input type="text" bind:value={fTitle} placeholder="Reminder title..." class="w-full rounded-lg border px-3 py-2 text-sm outline-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
					<textarea bind:value={fDescription} placeholder="Description (optional)" rows={3} class="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);"></textarea>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="text-[11px] font-medium mb-1 block" style="color: var(--text-tertiary);">Due Date</label>
							<input type="date" bind:value={fDueDate} class="w-full rounded-lg border px-3 py-2 text-xs" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
						</div>
						<div>
							<label class="text-[11px] font-medium mb-1 block" style="color: var(--text-tertiary);">Due Time</label>
							<input type="time" bind:value={fDueTime} class="w-full rounded-lg border px-3 py-2 text-xs" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="text-[11px] font-medium mb-1 block" style="color: var(--text-tertiary);">Priority</label>
							<select bind:value={fPriority} class="w-full rounded-lg border px-3 py-2 text-xs" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);">
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="urgent">Urgent</option>
							</select>
						</div>
						<div>
							<label class="text-[11px] font-medium mb-1 block" style="color: var(--text-tertiary);">Recurrence</label>
							<select bind:value={fRecurrence} class="w-full rounded-lg border px-3 py-2 text-xs" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);">
								<option value="none">None</option>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
					</div>
					<div class="flex justify-end gap-2">
						<button onclick={() => { showForm = false; }} class="rounded-lg px-4 py-2 text-xs" style="color: var(--text-secondary);">Cancel</button>
						<button onclick={handleSave} class="rounded-lg px-4 py-2 text-xs font-medium text-white" style="background: var(--color-primary-600);">Save</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="space-y-2">
				{#each filteredReminders() as reminder (reminder.id)}
					<div class="flex items-center gap-3 rounded-xl border p-4 transition-all duration-150" style="background: var(--bg-card); border-color: var(--border-default); border-left: 3px solid {getPriorityColor(reminder.priority)};">
						<button onclick={() => handleComplete(reminder.id)} class="shrink-0 rounded-md border-2 w-5 h-5 flex items-center justify-center transition-colors" style="border-color: {reminder.status === 'completed' ? 'var(--color-success)' : 'var(--border-default)'}; background: {reminder.status === 'completed' ? 'var(--color-success)' : 'transparent'};">
							{#if reminder.status === 'completed'}
								<Icon icon="ph:check-bold" width={12} height={12} style="color: white;" />
							{/if}
						</button>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium" style="color: var(--text-primary); text-decoration: {reminder.status === 'completed' ? 'line-through' : 'none'}; opacity: {reminder.status === 'completed' ? 0.5 : 1};">{reminder.title}</p>
							{#if reminder.description}
								<p class="text-xs mt-0.5 truncate" style="color: var(--text-tertiary);">{reminder.description}</p>
							{/if}
							<div class="flex items-center gap-2 mt-1.5">
								{#if reminder.due_date}
									<span class="text-[10px] flex items-center gap-1" style="color: var(--text-tertiary);">
										<Icon icon="ph:calendar" width={10} height={10} /> {formatDate(reminder.due_date)}
									</span>
								{/if}
								{#if reminder.recurrence !== 'none'}
									<span class="text-[10px] flex items-center gap-1" style="color: var(--text-tertiary);">
										<Icon icon="ph:arrows-clockwise" width={10} height={10} /> {reminder.recurrence}
									</span>
								{/if}
							</div>
						</div>
						<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase shrink-0" style="background: {getPriorityColor(reminder.priority)}20; color: {getPriorityColor(reminder.priority)};">{reminder.priority}</span>
						<div class="flex items-center gap-1 shrink-0">
							<button onclick={() => startEdit(reminder)} class="rounded-md p-1.5 transition-colors" style="color: var(--text-tertiary);">
								<Icon icon="ph:pencil" width={14} height={14} />
							</button>
							<button onclick={() => handleDelete(reminder.id)} class="rounded-md p-1.5 transition-colors" style="color: var(--text-tertiary);">
								<Icon icon="ph:trash" width={14} height={14} />
							</button>
						</div>
					</div>
				{/each}
			</div>
			{#if filteredReminders().length === 0}
				<div class="flex flex-col items-center justify-center py-20">
					<Icon icon="ph:bell" width={48} height={48} style="color: var(--text-tertiary); opacity: 0.3;" />
					<p class="mt-3 text-sm" style="color: var(--text-tertiary);">{activeFilter === 'all' ? 'No reminders yet' : `No ${activeFilter} reminders`}</p>
				</div>
			{/if}
		{/if}
	</div>
</div>
