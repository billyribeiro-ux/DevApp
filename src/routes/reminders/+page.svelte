<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getReminders, createReminder, updateReminder, completeReminder, uncompleteReminder, deleteReminder, logActivity } from '$services/database';
	import { formatRelativeDate, formatDate, getPriorityColor } from '$utils/formatters';
	import type { Reminder } from '$types';
	import { v4 as uuid } from 'uuid';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import DropZone from '$lib/components/ui/DropZone.svelte';

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
	let confirmDeleteOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);

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
		if (editingReminder) {
			await logActivity({ id: uuid(), entity_type: 'reminder', entity_id: editingReminder.id, entity_name: fTitle, action: 'updated' });
		} else {
			await logActivity({ id: uuid(), entity_type: 'reminder', entity_id: 'new', entity_name: fTitle, action: 'created' });
		}
		reminders = await getReminders();
		showForm = false;
		toasts.success(editingReminder ? 'Reminder Updated' : 'Reminder Created');
	}

	async function handleToggleComplete(reminder: Reminder) {
		if (reminder.status === 'completed') {
			await uncompleteReminder(reminder.id);
			await logActivity({ id: uuid(), entity_type: 'reminder', entity_id: reminder.id, entity_name: reminder.title, action: 'reopened' });
			reminders = await getReminders();
			toasts.info('Reminder Reopened');
		} else {
			await completeReminder(reminder.id);
			await logActivity({ id: uuid(), entity_type: 'reminder', entity_id: reminder.id, entity_name: reminder.title, action: 'completed' });
			reminders = await getReminders();
			toasts.success('Reminder Completed');
		}
	}

	function requestDelete(id: string) {
		pendingDeleteId = id;
		confirmDeleteOpen = true;
	}

	async function handleDelete() {
		if (!pendingDeleteId) return;
		const reminder = reminders.find(r => r.id === pendingDeleteId);
		await deleteReminder(pendingDeleteId);
		await logActivity({ id: uuid(), entity_type: 'reminder', entity_id: pendingDeleteId, entity_name: reminder?.title, action: 'deleted' });
		reminders = await getReminders();
		pendingDeleteId = null;
		toasts.success('Reminder Deleted');
	}

	async function handleFileDrop(files: File[]) {
		let imported = 0;
		for (const file of files) {
			const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
			const text = await file.text();
			if (ext === 'json') {
				try {
					const data = JSON.parse(text);
					const items = Array.isArray(data) ? data : [data];
					for (const item of items) {
						if (!item.title) continue;
						await createReminder({ id: uuid(), title: item.title, description: item.description || null, due_date: item.due_date || null, priority: item.priority || 'medium', recurrence: item.recurrence || 'none' });
						imported++;
					}
				} catch { toasts.warning(`Invalid JSON in ${file.name}`); }
			} else if (ext === 'csv') {
				const lines = text.trim().split('\n');
				const header = lines[0]?.toLowerCase().split(',').map(h => h.trim());
				if (!header?.includes('title')) { toasts.warning('CSV must have a "title" column'); continue; }
				const titleIdx = header.indexOf('title');
				const descIdx = header.indexOf('description');
				const dateIdx = header.indexOf('due_date');
				const prioIdx = header.indexOf('priority');
				for (let i = 1; i < lines.length; i++) {
					const cols = lines[i].split(',').map(c => c.trim());
					if (!cols[titleIdx]) continue;
					await createReminder({ id: uuid(), title: cols[titleIdx], description: descIdx >= 0 ? cols[descIdx] || null : null, due_date: dateIdx >= 0 ? cols[dateIdx] || null : null, priority: (prioIdx >= 0 ? cols[prioIdx] : 'medium') as Reminder['priority'] || 'medium' });
					imported++;
				}
			}
		}
		if (imported > 0) {
			reminders = await getReminders();
			toasts.success(`Imported ${imported} reminder${imported > 1 ? 's' : ''}`);
		} else {
			toasts.warning('No valid .json or .csv reminder files found');
		}
	}

	onMount(async () => {
		nav.navigate('/reminders');
		reminders = await getReminders();
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between border-b shrink-0" style="border-color: var(--border-default); height: var(--titlebar-height); padding: 0 var(--content-padding);">
		<div class="flex items-center gap-3">
			<Icon icon="ph:bell-bold" width={24} height={24} style="color: #FF9500;" />
			<h1 class="text-xl font-bold" style="color: var(--text-primary); letter-spacing: -0.02em;">Reminders</h1>
			<span class="rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style="background: var(--color-warning-light); color: var(--color-warning);">{reminders.filter(r => r.status === 'pending').length} pending</span>
		</div>
		<button onclick={() => startEdit()} class="btn-primary">
			<Icon icon="ph:plus-bold" width={15} height={15} /> New Reminder
		</button>
	</div>
	<!-- Filters -->
	<div class="flex items-center gap-1 py-4 border-b overflow-x-auto shrink-0" style="border-color: var(--border-default); padding-left: var(--content-padding); padding-right: var(--content-padding);">
		{#each filters as f}
			<button onclick={() => { activeFilter = f.value; }} class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors" style="background: {activeFilter === f.value ? 'var(--bg-active)' : 'transparent'}; color: {activeFilter === f.value ? 'var(--text-accent)' : 'var(--text-secondary)'};">
				<Icon icon={f.icon} width={14} height={14} />
				{f.label}
			</button>
		{/each}
	</div>

	<div class="flex-1 overflow-y-auto" style="padding: var(--content-padding);">
		{#if showForm}
			<div class="max-w-lg mx-auto animate-slide-up">
				<div class="rounded-2xl border p-8 space-y-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					<h3 class="text-base font-semibold" style="color: var(--text-primary);">{editingReminder ? 'Edit Reminder' : 'New Reminder'}</h3>
					<input type="text" bind:value={fTitle} placeholder="Reminder title..." class="input-field" />
					<textarea bind:value={fDescription} placeholder="Description (optional)" rows={3} class="input-field resize-none"></textarea>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="reminder-date" class="text-[11px] font-semibold mb-1.5 block uppercase tracking-wider" style="color: var(--text-tertiary);">Due Date</label>
							<input id="reminder-date" type="date" bind:value={fDueDate} class="input-field input-field-sm" />
						</div>
						<div>
							<label for="reminder-time" class="text-[11px] font-semibold mb-1.5 block uppercase tracking-wider" style="color: var(--text-tertiary);">Due Time</label>
							<input id="reminder-time" type="time" bind:value={fDueTime} class="input-field input-field-sm" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="reminder-priority" class="text-[11px] font-semibold mb-1.5 block uppercase tracking-wider" style="color: var(--text-tertiary);">Priority</label>
							<select id="reminder-priority" bind:value={fPriority} class="input-field input-field-sm">
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="urgent">Urgent</option>
							</select>
						</div>
						<div>
							<label for="reminder-recurrence" class="text-[11px] font-semibold mb-1.5 block uppercase tracking-wider" style="color: var(--text-tertiary);">Recurrence</label>
							<select id="reminder-recurrence" bind:value={fRecurrence} class="input-field input-field-sm">
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
						<button onclick={() => handleToggleComplete(reminder)} class="shrink-0 rounded-lg border-2 w-6 h-6 flex items-center justify-center transition-colors" style="border-color: {reminder.status === 'completed' ? 'var(--color-success)' : 'var(--border-default)'}; background: {reminder.status === 'completed' ? 'var(--color-success)' : 'transparent'};" title="{reminder.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}">
							{#if reminder.status === 'completed'}
								<Icon icon="ph:check-bold" width={14} height={14} style="color: white;" />
							{/if}
						</button>
						<div class="flex-1 min-w-0">
							<p class="text-[16px] font-medium" style="color: var(--text-primary); text-decoration: {reminder.status === 'completed' ? 'line-through' : 'none'}; opacity: {reminder.status === 'completed' ? 0.5 : 1};">{reminder.title}</p>
							{#if reminder.description}
								<p class="text-[13px] mt-0.5 truncate" style="color: var(--text-tertiary);">{reminder.description}</p>
							{/if}
							<div class="flex items-center gap-3 mt-2">
								{#if reminder.due_date}
								<span class="text-[12px] flex items-center gap-1" style="color: var(--text-tertiary);">
									<Icon icon="ph:calendar" width={13} height={13} /> {formatDate(reminder.due_date)}
								</span>
							{/if}
							{#if reminder.recurrence !== 'none'}
								<span class="text-[12px] flex items-center gap-1" style="color: var(--text-tertiary);">
									<Icon icon="ph:arrows-clockwise" width={13} height={13} /> {reminder.recurrence}
								</span>
							{/if}
							</div>
						</div>
						<span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase shrink-0" style="background: {getPriorityColor(reminder.priority)}20; color: {getPriorityColor(reminder.priority)};">{reminder.priority}</span>
						<div class="flex items-center gap-1 shrink-0">
							<button onclick={() => startEdit(reminder)} class="rounded-xl p-2 transition-colors" style="color: var(--text-tertiary);">
								<Icon icon="ph:pencil" width={16} height={16} />
							</button>
							<button onclick={() => requestDelete(reminder.id)} class="rounded-xl p-2 transition-colors" style="color: var(--text-tertiary);">
								<Icon icon="ph:trash" width={16} height={16} />
							</button>
						</div>
					</div>
				{/each}
			</div>
			{#if filteredReminders().length === 0}
				<DropZone onfiledrop={handleFileDrop}>
					<div class="flex flex-col items-center justify-center py-24">
						<Icon icon="ph:bell" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
						<p class="mt-4 text-sm" style="color: var(--text-tertiary);">{activeFilter === 'all' ? 'No reminders yet' : `No ${activeFilter} reminders`}</p>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">Drop .json or .csv files to import reminders</p>
					</div>
				</DropZone>
			{/if}
		{/if}
	</div>
</div>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete Reminder"
	description="Are you sure you want to delete this reminder? This action cannot be undone."
	confirmLabel="Delete"
	variant="danger"
	onconfirm={handleDelete}
/>
