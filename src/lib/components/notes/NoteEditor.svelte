<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Note } from '$types';
	import { countWords } from '$utils/formatters';
	import { toasts } from '$stores/app.svelte';

	let { note, onsave }: { note: Note | null; onsave: (note: Partial<Note>) => void } = $props();

	// svelte-ignore state_referenced_locally
	let title = $state(note?.title ?? '');
	// svelte-ignore state_referenced_locally
	let content = $state(note?.content_text ?? '');
	let hasUnsavedChanges = $state(false);
	let autoSaveTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	let wordCount = $derived(countWords(content));

	// Sync props when note changes externally
	$effect(() => {
		if (note) {
			title = note.title;
			content = note.content_text ?? '';
			hasUnsavedChanges = false;
		} else {
			title = '';
			content = '';
			hasUnsavedChanges = false;
		}
	});

	// Auto-save with debounce
	$effect(() => {
		// Track both title and content for changes
		const _t = title;
		const _c = content;

		if (!hasUnsavedChanges) return;

		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}

		autoSaveTimer = setTimeout(() => {
			performSave();
		}, 2000);

		return () => {
			if (autoSaveTimer) {
				clearTimeout(autoSaveTimer);
			}
		};
	});

	// Cmd+S keyboard handler
	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			performSave();
		}
	}

	function performSave() {
		if (!hasUnsavedChanges) return;

		onsave({
			...(note ? { id: note.id } : {}),
			title: title.trim() || 'Untitled Note',
			content_text: content,
			content_html: content,
			word_count: wordCount
		});

		hasUnsavedChanges = false;

		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
			autoSaveTimer = null;
		}
	}

	function markDirty() {
		hasUnsavedChanges = true;
	}

	function handleTitleInput(e: Event) {
		title = (e.target as HTMLInputElement).value;
		markDirty();
	}

	function handleContentInput(e: Event) {
		content = (e.target as HTMLTextAreaElement).value;
		markDirty();
	}

	// Toolbar formatting helpers
	function insertMarkdown(prefix: string, suffix: string = '') {
		if (!textareaRef) return;

		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const selectedText = content.substring(start, end);
		const replacement = `${prefix}${selectedText}${suffix || prefix}`;

		content = content.substring(0, start) + replacement + content.substring(end);
		markDirty();

		// Restore cursor position after the inserted text
		requestAnimationFrame(() => {
			if (!textareaRef) return;
			const cursorPos = selectedText.length > 0
				? start + replacement.length
				: start + prefix.length;
			textareaRef.setSelectionRange(cursorPos, cursorPos);
			textareaRef.focus();
		});
	}

	function insertBold() {
		insertMarkdown('**');
	}

	function insertItalic() {
		insertMarkdown('*');
	}

	function insertHeading() {
		if (!textareaRef) return;

		const start = textareaRef.selectionStart;
		const lineStart = content.lastIndexOf('\n', start - 1) + 1;
		const lineText = content.substring(lineStart, start);

		// Check if line already has heading markers
		const headingMatch = lineText.match(/^(#{1,6})\s/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			if (level < 6) {
				content = content.substring(0, lineStart) + '#' + content.substring(lineStart);
			} else {
				// Reset to no heading
				content = content.substring(0, lineStart) + content.substring(lineStart + level + 1);
			}
		} else {
			content = content.substring(0, lineStart) + '## ' + content.substring(lineStart);
		}

		markDirty();
		requestAnimationFrame(() => textareaRef?.focus());
	}

	function insertList() {
		if (!textareaRef) return;

		const start = textareaRef.selectionStart;
		const lineStart = content.lastIndexOf('\n', start - 1) + 1;

		content = content.substring(0, lineStart) + '- ' + content.substring(lineStart);
		markDirty();

		requestAnimationFrame(() => {
			if (!textareaRef) return;
			textareaRef.setSelectionRange(start + 2, start + 2);
			textareaRef.focus();
		});
	}

	function insertCodeBlock() {
		insertMarkdown('\n```\n', '\n```\n');
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-full flex-col bg-white dark:bg-neutral-900">
	<!-- Toolbar -->
	<div
		class="flex items-center gap-1 border-b border-neutral-200 px-4 py-2 dark:border-neutral-700"
	>
		<button
			type="button"
			onclick={insertBold}
			class="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			title="Bold (Ctrl+B)"
		>
			<Icon icon="ph:text-b-bold" width={18} height={18} />
		</button>

		<button
			type="button"
			onclick={insertItalic}
			class="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			title="Italic (Ctrl+I)"
		>
			<Icon icon="ph:text-italic" width={18} height={18} />
		</button>

		<div class="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700"></div>

		<button
			type="button"
			onclick={insertHeading}
			class="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			title="Heading"
		>
			<Icon icon="ph:text-h" width={18} height={18} />
		</button>

		<button
			type="button"
			onclick={insertList}
			class="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			title="Bullet List"
		>
			<Icon icon="ph:list-bullets" width={18} height={18} />
		</button>

		<button
			type="button"
			onclick={insertCodeBlock}
			class="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			title="Code Block"
		>
			<Icon icon="ph:code-block" width={18} height={18} />
		</button>

		<div class="flex-1"></div>

		{#if hasUnsavedChanges}
			<span
				class="flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400"
			>
				<span class="inline-block h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400"></span>
				Unsaved changes
			</span>
		{:else if note}
			<span class="text-xs text-neutral-400 dark:text-neutral-500">Saved</span>
		{/if}

		<button
			type="button"
			onclick={performSave}
			disabled={!hasUnsavedChanges}
			class="ml-3 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
		>
			Save
		</button>
	</div>

	<!-- Title input -->
	<div class="border-b border-neutral-100 px-6 pt-6 pb-2 dark:border-neutral-800">
		<div class="flex items-center gap-2">
			<input
				type="text"
				value={title}
				oninput={handleTitleInput}
				placeholder="Untitled Note"
				class="w-full border-none bg-transparent text-3xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300 dark:text-neutral-100 dark:placeholder:text-neutral-600"
			/>
			{#if hasUnsavedChanges}
				<span class="mt-1 inline-block h-3 w-3 flex-shrink-0 rounded-full bg-amber-500"></span>
			{/if}
		</div>
	</div>

	<!-- Content textarea -->
	<div class="flex-1 overflow-hidden">
		<textarea
			bind:this={textareaRef}
			value={content}
			oninput={handleContentInput}
			placeholder="Start writing your note in Markdown..."
			class="h-full w-full resize-none border-none bg-transparent px-6 py-4 font-mono text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200 dark:placeholder:text-neutral-600"
			spellcheck="true"
		></textarea>
	</div>

	<!-- Footer: word count -->
	<div
		class="flex items-center justify-between border-t border-neutral-200 px-6 py-2 dark:border-neutral-700"
	>
		<div class="flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-500">
			<span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
			<span>{content.length} {content.length === 1 ? 'character' : 'characters'}</span>
		</div>
		<div class="text-xs text-neutral-400 dark:text-neutral-500">
			<kbd class="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-neutral-800">
				{navigator?.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'}+S
			</kbd>
			to save
		</div>
	</div>
</div>
