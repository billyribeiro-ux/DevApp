<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Note } from '$types';
	import { formatRelativeDate, countWords, truncate } from '$utils/formatters';

	let {
		note,
		selected,
		onselect
	}: {
		note: Note;
		selected: boolean;
		onselect: (id: string) => void;
	} = $props();

	let preview = $derived(truncate(note.content_text ?? '', 100));
	let wordCount = $derived(note.word_count || countWords(note.content_text ?? ''));
	let relativeDate = $derived(formatRelativeDate(note.updated_at));
	let isFavorited = $derived(note.is_favorited === 1);
	let isPinned = $derived(note.is_pinned === 1);
</script>

<button
	type="button"
	onclick={() => onselect(note.id)}
	class="group w-full cursor-pointer rounded-lg border p-4 text-left transition-all duration-150
		{selected
			? 'border-indigo-500 bg-indigo-50/50 shadow-sm dark:border-indigo-500/70 dark:bg-indigo-950/30'
			: 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600'}"
>
	<!-- Header: title + indicators -->
	<div class="mb-2 flex items-start justify-between gap-2">
		<h3
			class="line-clamp-1 flex-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
		>
			{note.title || 'Untitled Note'}
		</h3>

		<div class="flex items-center gap-1">
			{#if isPinned}
				<span class="text-indigo-500 dark:text-indigo-400" title="Pinned">
					<Icon icon="ph:push-pin-fill" width={14} height={14} />
				</span>
			{/if}

			{#if isFavorited}
				<span class="text-amber-500 dark:text-amber-400" title="Favorited">
					<Icon icon="ph:star-fill" width={14} height={14} />
				</span>
			{/if}
		</div>
	</div>

	<!-- Content preview -->
	{#if preview}
		<p class="mb-3 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
			{preview}
		</p>
	{:else}
		<p class="mb-3 text-xs italic text-neutral-400 dark:text-neutral-500">
			No content yet
		</p>
	{/if}

	<!-- Footer: meta info -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-500">
			<span class="flex items-center gap-1">
				<Icon icon="ph:clock" width={12} height={12} />
				{relativeDate}
			</span>
			<span class="flex items-center gap-1">
				<Icon icon="ph:text-aa" width={12} height={12} />
				{wordCount} {wordCount === 1 ? 'word' : 'words'}
			</span>
		</div>
	</div>
</button>
