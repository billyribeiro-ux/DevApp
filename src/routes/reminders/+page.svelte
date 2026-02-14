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
	<div class="page-header">
		<div class="flex items-center gap-3">
			<Icon icon="ph:bell-bold" width={24} height={24} style="color: var(--color-warning);" />
			<h1>Reminders</h1>
			<span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style="background: var(--color-warning-light); color: var(--color-warning);">{reminders.filter(r => r.status === 'pending').length} pending</span>
		</div>
		<button onclick={() => startEdit()} class="btn-primary">
			<Icon icon="ph:plus-bold" width={15} height={15} /> New Reminder
		</button>
	</div>

	<div class="page-tabs">
		{#each filters as f}
			<button onclick={() => { activeFilter = f.value; }} class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors" style="background: {activeFilter === f.value ? 'var(--bg-active)' : 'transparent'}; color: {activeFilter === f.value ? 'var(--text-accent)' : 'var(--text-secondary)'};">
				<Icon icon={f.icon} width={14} height={14} />
				{f.label}
			</button>
		{/each}
	</div>

	<div class="page-content">
		{#if showForm}
			<div class="max-w-lg mx-auto animate-slide-up">
				<div class="rounded-2xl border p-8 space-y-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					<h3 class="text-base font-semibold" style="color: var(--text-primary);">{editingReminder ? 'Edit Reminder' : 'New Reminder'}</h3>
					<input type="text" bind:value={fTitle} placeholder="Reminder title..." class="input-field" />
					<textarea bind:value={fDescription} placeholder="Description (optional)" rows={3} class="input-field resize-none"></textarea>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="text-[11px] font-semibold mb-1.5 block uppercase tracking-wider" style="color: var(--text-tertiary);">Due Date</label>
							<input type="date" bind:value={fDueDate} class="input-field input-field-sm" />
						</div>
						<div>
							<label class="text-[11px] font-semibold mb-1.5 block uppercase tracking-wider" style="color: var(--text-tertiary);">Due Time</label>
							<input type="time" bind:value={fDueTime} class="input-field input-field-sm" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="text-[11px] font-semibold mb-1.5 block uppercase tracking-wider" style="color: var(--text-tertiary);">Priority</label>
							<select bind:value={fPriority} class="input-field input-field-sm">
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="urgent">Urgent</option>
							</select>
						</div>
						<div>
							<label class="text-[11px] font-semibold mb-1.5 block uppercase tracking-wider" style="color: var(--text-tertiary);">Recurrence</label>
							<select bind:value={fRecurrence} class="input-field input-field-sm">
								<option value="none">None</option>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
					</div>
					<div class="flex justify-end gap-2 pt-2">
						<button onclick={() => { showForm = false; }} class="btn-ghost">Cancel</button>
						<button onclick={handleSave} class="btn-primary">Save</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredReminders() as reminder (reminder.id)}
					<div class="flex items-center gap-4 rounded-2xl border p-5 transition-all duration-150" style="background: var(--bg-card); border-color: var(--border-default); border-left: 3px solid {getPriorityColor(reminder.priority)}; box-shadow: var(--shadow-card);">
						<button onclick={() => handleComplete(reminder.id)} class="shrink-0 rounded-lg border-2 w-6 h-6 flex items-center justify-center transition-colors" style="border-color: {reminder.status === 'completed' ? 'var(--color-success)' : 'var(--border-default)'}; background: {reminder.status === 'completed' ? 'var(--color-success)' : 'transparent'};">
							{#if reminder.status === 'completed'}
								<Icon icon="ph:check-bold" width={14} height={14} style="color: white;" />
							{/if}
						</button>
						<div class="flex-1 min-w-0">
							<p class="text-[15px] font-medium" style="color: var(--text-primary); text-decoration: {reminder.status === 'completed' ? 'line-through' : 'none'}; opacity: {reminder.status === 'completed' ? 0.5 : 1};">{reminder.title}</p>
							{#if reminder.description}
								<p class="text-[13px] mt-0.5 truncate" style="color: var(--text-tertiary);">{reminder.description}</p>
							{/if}
							<div class="flex items-center gap-3 mt-2">
								{#if reminder.due_date}
									<span class="text-[11px] flex items-center gap-1" style="color: var(--text-tertiary);">
										<Icon icon="ph:calendar" width={12} height={12} /> {formatDate(reminder.due_date)}
									</span>
								{/if}
								{#if reminder.recurrence !== 'none'}
									<span class="text-[11px] flex items-center gap-1" style="color: var(--text-tertiary);">
										<Icon icon="ph:arrows-clockwise" width={12} height={12} /> {reminder.recurrence}
									</span>
								{/if}
							</div>
						</div>
						<span class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase shrink-0" style="background: {getPriorityColor(reminder.priority)}20; color: {getPriorityColor(reminder.priority)};">{reminder.priority}</span>
						<div class="flex items-center gap-1 shrink-0">
							<button onclick={() => startEdit(reminder)} class="rounded-xl p-2 transition-colors" style="color: var(--text-tertiary);">
								<Icon icon="ph:pencil" width={16} height={16} />
							</button>
							<button onclick={() => handleDelete(reminder.id)} class="rounded-xl p-2 transition-colors" style="color: var(--text-tertiary);">
								<Icon icon="ph:trash" width={16} height={16} />
							</button>
						</div>
					</div>
				{/each}
			</div>
			{#if filteredReminders().length === 0}
				<div class="flex flex-col items-center justify-center py-24">
					<Icon icon="ph:bell" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
					<p class="mt-4 text-sm" style="color: var(--text-tertiary);">{activeFilter === 'all' ? 'No reminders yet' : `No ${activeFilter} reminders`}</p>
				</div>
			{/if}
		{/if}
	</div>
</div>
