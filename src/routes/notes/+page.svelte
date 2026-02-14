<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getNotes, createNote, updateNote, deleteNote } from '$services/database';
	import { formatRelativeDate, countWords } from '$utils/formatters';
	import type { Note } from '$types';
	import { v4 as uuid } from 'uuid';

	let notes = $state<Note[]>([]);
	let activeNoteId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');
	let unsaved = $state(false);
	let searchQuery = $state('');

	let activeNote = $derived(notes.find(n => n.id === activeNoteId) ?? null);
	let filteredNotes = $derived(
		searchQuery
			? notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || (n.content_text ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
			: notes
	);
	let wordCount = $derived(countWords(editContent));

	let saveTimeout: ReturnType<typeof setTimeout>;

	function autoSave() {
		clearTimeout(saveTimeout);
		unsaved = true;
		saveTimeout = setTimeout(async () => {
			if (activeNoteId) {
				await updateNote(activeNoteId, {
					title: editTitle || 'Untitled Note',
					content_text: editContent,
					content_json: JSON.stringify({ text: editContent }),
					word_count: wordCount
				});
				unsaved = false;
				notes = await getNotes();
			}
		}, 1000);
	}

	async function handleCreate() {
		const id = uuid();
		await createNote({ id, folder_id: 'default', title: 'Untitled Note', content_text: '', word_count: 0 });
		notes = await getNotes();
		selectNote(id);
		toasts.success('Note Created');
	}

	function selectNote(id: string) {
		if (unsaved && activeNoteId) {
			// Save current before switching
			updateNote(activeNoteId, { title: editTitle, content_text: editContent, word_count: wordCount });
		}
		activeNoteId = id;
		const note = notes.find(n => n.id === id);
		if (note) {
			editTitle = note.title;
			editContent = note.content_text ?? '';
			unsaved = false;
		}
	}

	async function handleDelete(id: string) {
		await deleteNote(id);
		if (activeNoteId === id) {
			activeNoteId = null;
			editTitle = '';
			editContent = '';
		}
		notes = await getNotes();
		toasts.success('Note Deleted');
	}

	async function handleSave() {
		if (!activeNoteId) return;
		clearTimeout(saveTimeout);
		await updateNote(activeNoteId, {
			title: editTitle || 'Untitled Note',
			content_text: editContent,
			content_json: JSON.stringify({ text: editContent }),
			word_count: wordCount
		});
		unsaved = false;
		notes = await getNotes();
		toasts.success('Note Saved');
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			handleSave();
		}
		if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
			e.preventDefault();
			handleCreate();
		}
	}

	onMount(async () => {
		nav.navigate('/notes');
		try {
			notes = await getNotes();
		} catch (e) { console.error(e); }
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-full overflow-hidden">
	<!-- Notes list sidebar -->
	<div class="w-[300px] shrink-0 border-r flex flex-col" style="border-color: var(--border-default); background: var(--bg-surface);">
		<div class="flex items-center justify-between px-5 py-5 border-b" style="border-color: var(--border-default);">
			<h2 class="text-lg font-bold" style="color: var(--text-primary);">Notes</h2>
			<button onclick={handleCreate} class="rounded-xl p-2 transition-colors" style="color: var(--text-accent);" title="New Note (Cmd+N)">
				<Icon icon="ph:plus-bold" width={20} height={20} />
			</button>
		</div>
		<div class="px-4 py-3">
			<div class="flex items-center gap-2 rounded-xl px-3 py-2.5" style="background: var(--bg-input); border: 1px solid var(--border-default);">
				<Icon icon="ph:magnifying-glass" width={16} height={16} style="color: var(--text-tertiary);" />
				<input type="text" bind:value={searchQuery} placeholder="Search notes..." class="flex-1 bg-transparent text-[13px] outline-none" style="color: var(--text-primary);" />
			</div>
		</div>
		<div class="flex-1 overflow-y-auto px-3 py-1">
			{#each filteredNotes as note (note.id)}
				<button
					onclick={() => selectNote(note.id)}
					class="w-full text-left rounded-xl px-4 py-3.5 mb-1 transition-all duration-150 group"
					style="background: {activeNoteId === note.id ? 'var(--bg-active)' : 'transparent'};"
				>
					<div class="flex items-center gap-1.5">
						<p class="text-sm font-medium truncate flex-1" style="color: {activeNoteId === note.id ? 'var(--text-accent)' : 'var(--text-primary)'};">{note.title}</p>
						{#if note.is_pinned}
							<Icon icon="ph:push-pin-fill" width={12} height={12} style="color: var(--text-tertiary);" />
						{/if}
					</div>
					<p class="text-[13px] mt-1 truncate" style="color: var(--text-tertiary);">{note.content_text?.slice(0, 80) || 'Empty note'}</p>
					<p class="text-[12px] mt-1.5" style="color: var(--text-tertiary);">{formatRelativeDate(note.updated_at)} &middot; {note.word_count} words</p>
				</button>
			{/each}
			{#if filteredNotes.length === 0}
				<div class="flex flex-col items-center justify-center py-16">
					<Icon icon="ph:note-pencil" width={40} height={40} style="color: var(--text-tertiary); opacity: 0.4;" />
					<p class="text-xs mt-3" style="color: var(--text-tertiary);">{searchQuery ? 'No matching notes' : 'No notes yet'}</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Editor -->
	<div class="flex-1 flex flex-col min-w-0">
		{#if activeNote}
			<!-- Toolbar -->
			<div class="flex items-center justify-between px-8 py-3 border-b shrink-0" style="border-color: var(--border-default);">
				<div class="flex items-center gap-2">
					{#if unsaved}
						<div class="h-2 w-2 rounded-full" style="background: var(--color-warning);"></div>
					{/if}
					<span class="text-xs" style="color: var(--text-tertiary);">{unsaved ? 'Unsaved changes' : 'Saved'}</span>
				</div>
				<div class="flex items-center gap-2">
					<button onclick={handleSave} class="btn-primary rounded-xl px-4 py-2">Save</button>
					<button onclick={() => handleDelete(activeNote!.id)} class="rounded-xl p-2 transition-colors" style="color: var(--text-tertiary);">
						<Icon icon="ph:trash" width={18} height={18} />
					</button>
				</div>
			</div>
			<!-- Title -->
			<div class="px-10 pt-8">
				<input
					type="text"
					bind:value={editTitle}
					oninput={autoSave}
					placeholder="Note title..."
					class="w-full bg-transparent text-[28px] font-bold outline-none"
					style="color: var(--text-primary); letter-spacing: -0.02em;"
				/>
			</div>
			<!-- Content -->
			<div class="flex-1 px-10 py-6 overflow-y-auto">
				<textarea
					bind:value={editContent}
					oninput={autoSave}
					placeholder="Start writing... (Markdown supported)"
					class="w-full h-full bg-transparent text-[15px] outline-none resize-none"
					style="color: var(--text-primary); font-family: 'Inter', sans-serif; line-height: 1.8;"
				></textarea>
			</div>
			<!-- Footer -->
			<div class="flex items-center justify-between px-10 py-3 border-t text-[12px] shrink-0" style="border-color: var(--border-default); color: var(--text-tertiary);">
				<span>{wordCount} words</span>
				<span>{formatRelativeDate(activeNote.updated_at)}</span>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center h-full">
				<Icon icon="ph:note-pencil" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
				<p class="mt-4 text-sm font-medium" style="color: var(--text-tertiary);">Select a note or create a new one</p>
				<button onclick={handleCreate} class="mt-4 btn-primary rounded-xl text-sm px-5 py-2.5">
					<Icon icon="ph:plus" width={16} height={16} style="display: inline; vertical-align: -2px;" /> New Note
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	button:not(.btn-primary):not(.btn-secondary):not(.btn-ghost):hover { background: var(--bg-card-hover); }
	textarea::placeholder { color: var(--text-tertiary); }
</style>
