<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Prompt } from '$types';
	import { PROMPT_CATEGORIES } from '$config/constants';
	import { truncate } from '$utils/formatters';

	let {
		prompt,
		oncopy,
		onedit
	}: {
		prompt: Prompt;
		oncopy: (id: string) => void;
		onedit: (id: string) => void;
	} = $props();

	let isFavorited = $derived(prompt.is_favorited === 1);

	let categoryMeta = $derived(
		PROMPT_CATEGORIES.find((c) => c.value === prompt.category) ?? PROMPT_CATEGORIES[0]
	);

	let categoryColor = $derived.by(() => {
		const colors: Record<string, string> = {
			general: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
			coding: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
			debugging: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
			refactoring: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
			testing: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
			documentation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
			seo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
			design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
			devops: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
			custom: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
		};
		return colors[prompt.category] ?? colors.general;
	});

	// Parse content to highlight template variables
	let contentPreview = $derived(truncate(prompt.content, 120));

	// Split content preview into parts for variable highlighting
	let contentParts = $derived.by(() => {
		const parts: Array<{ text: string; isVariable: boolean }> = [];
		const regex = /(\{\{[^}]+\}\})/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		const text = contentPreview;
		const regexInstance = new RegExp(regex.source, regex.flags);

		while ((match = regexInstance.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push({ text: text.substring(lastIndex, match.index), isVariable: false });
			}
			parts.push({ text: match[1], isVariable: true });
			lastIndex = regexInstance.lastIndex;
		}

		if (lastIndex < text.length) {
			parts.push({ text: text.substring(lastIndex), isVariable: false });
		}

		return parts.length > 0 ? parts : [{ text: contentPreview, isVariable: false }];
	});
</script>

<div
	class="group flex flex-col rounded-xl border border-neutral-200 bg-white p-4 transition-all duration-150 hover:border-neutral-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
>
	<!-- Header: title + favorite -->
	<div class="mb-2 flex items-start justify-between gap-2">
		<h3 class="line-clamp-1 flex-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
			{prompt.title}
		</h3>

		{#if isFavorited}
			<span class="flex-shrink-0 text-amber-500 dark:text-amber-400" title="Favorited">
				<Icon icon="ph:star-fill" width={16} height={16} />
			</span>
		{/if}
	</div>

	<!-- Badges: category + language -->
	<div class="mb-3 flex flex-wrap items-center gap-2">
		<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium {categoryColor}">
			<Icon icon={categoryMeta.icon} width={12} height={12} />
			{categoryMeta.label}
		</span>

		{#if prompt.language}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
			>
				<Icon icon="ph:code" width={12} height={12} />
				{prompt.language}
			</span>
		{/if}

		{#if prompt.usage_count > 0}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
				title="Times used"
			>
				<Icon icon="ph:lightning" width={12} height={12} />
				{prompt.usage_count}
			</span>
		{/if}
	</div>

	<!-- Content preview with highlighted variables -->
	<div class="mb-4 flex-1">
		<p class="line-clamp-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
			{#each contentParts as part}
				{#if part.isVariable}
					<span
						class="inline-block rounded bg-indigo-100 px-1 py-0.5 font-mono text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
					>{part.text}</span>
				{:else}
					{part.text}
				{/if}
			{/each}
		</p>
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-2">
		<button
			type="button"
			onclick={() => oncopy(prompt.id)}
			class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
		>
			<Icon icon="ph:copy" width={14} height={14} />
			Copy
		</button>

		<button
			type="button"
			onclick={() => onedit(prompt.id)}
			class="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
		>
			<Icon icon="ph:pencil-simple" width={14} height={14} />
			Edit
		</button>
	</div>
</div>
