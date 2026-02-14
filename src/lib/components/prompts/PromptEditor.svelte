<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Prompt, PromptCategory } from '$types';
	import { PROMPT_CATEGORIES, LANGUAGES } from '$config/constants';

	let {
		prompt,
		onsave,
		oncancel
	}: {
		prompt: Prompt | null;
		onsave: (prompt: Partial<Prompt>) => void;
		oncancel: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let title = $state(prompt?.title ?? '');
	// svelte-ignore state_referenced_locally
	let content = $state(prompt?.content ?? '');
	// svelte-ignore state_referenced_locally
	let category = $state<PromptCategory>(prompt?.category ?? 'general');
	// svelte-ignore state_referenced_locally
	let language = $state(prompt?.language ?? '');

	let isEditing = $derived(prompt !== null);

	// Detect template variables from content
	let detectedVariables = $derived.by(() => {
		const regex = /\{\{([^}]+)\}\}/g;
		const vars = new Set<string>();
		let match: RegExpExecArray | null;
		const regexInstance = new RegExp(regex.source, regex.flags);

		while ((match = regexInstance.exec(content)) !== null) {
			vars.add(match[1].trim());
		}

		return Array.from(vars);
	});

	// Render preview with highlighted variables
	let previewParts = $derived.by(() => {
		const parts: Array<{ text: string; isVariable: boolean; varName?: string }> = [];
		const regex = /(\{\{([^}]+)\}\})/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		const regexInstance = new RegExp(regex.source, regex.flags);

		while ((match = regexInstance.exec(content)) !== null) {
			if (match.index > lastIndex) {
				parts.push({ text: content.substring(lastIndex, match.index), isVariable: false });
			}
			parts.push({
				text: match[1],
				isVariable: true,
				varName: match[2].trim()
			});
			lastIndex = regexInstance.lastIndex;
		}

		if (lastIndex < content.length) {
			parts.push({ text: content.substring(lastIndex), isVariable: false });
		}

		return parts;
	});

	// Form validation
	let isValid = $derived(title.trim().length > 0 && content.trim().length > 0);

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!isValid) return;

		const variablesJson =
			detectedVariables.length > 0
				? JSON.stringify(detectedVariables.map((v) => ({ name: v, default_value: '' })))
				: null;

		onsave({
			...(prompt ? { id: prompt.id } : {}),
			title: title.trim(),
			content: content.trim(),
			category,
			language: language || null,
			variables: variablesJson
		});
	}
</script>

<form onsubmit={handleSubmit} class="flex h-full flex-col bg-white dark:bg-neutral-900">
	<!-- Header -->
	<div
		class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700"
	>
		<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
			{isEditing ? 'Edit Prompt' : 'New Prompt'}
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
				for="prompt-title"
				class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
			>
				Title <span class="text-red-500">*</span>
			</label>
			<input
				id="prompt-title"
				type="text"
				bind:value={title}
				placeholder="e.g., React Component Generator"
				class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-indigo-400"
			/>
		</div>

		<!-- Category + Language row -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label
					for="prompt-category"
					class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
				>
					Category
				</label>
				<select
					id="prompt-category"
					bind:value={category}
					class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-indigo-400"
				>
					{#each PROMPT_CATEGORIES as cat}
						<option value={cat.value}>{cat.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label
					for="prompt-language"
					class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
				>
					Language
				</label>
				<select
					id="prompt-language"
					bind:value={language}
					class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-indigo-400"
				>
					<option value="">None</option>
					{#each LANGUAGES as lang}
						<option value={lang}>{lang}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Content -->
		<div>
			<label
				for="prompt-content"
				class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
			>
				Prompt Content <span class="text-red-500">*</span>
			</label>
			<p class="mb-2 text-xs text-neutral-400 dark:text-neutral-500">
				Use <code class="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-700">{`{{variable}}`}</code> syntax for template variables.
			</p>
			<textarea
				id="prompt-content"
				bind:value={content}
				placeholder="Write your prompt template here... Use {'{{'}variable_name{'}}'} for dynamic values."
				rows={10}
				class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-indigo-400"
			></textarea>
		</div>

		<!-- Detected variables -->
		{#if detectedVariables.length > 0}
			<div>
				<h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
					<Icon icon="ph:brackets-curly" width={16} height={16} class="mr-1 inline-block align-text-bottom" />
					Detected Variables ({detectedVariables.length})
				</h4>
				<div class="flex flex-wrap gap-2">
					{#each detectedVariables as variable}
						<span
							class="inline-flex items-center rounded-md bg-indigo-100 px-2.5 py-1 font-mono text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
						>
							{`{{${variable}}}`}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Preview -->
		{#if content.trim().length > 0}
			<div>
				<h4 class="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
					<Icon icon="ph:eye" width={16} height={16} class="mr-1 inline-block align-text-bottom" />
					Preview
				</h4>
				<div
					class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
				>
					<p class="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
						{#each previewParts as part}
							{#if part.isVariable}
								<span
									class="inline-block rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
								>{part.text}</span>
							{:else}
								{part.text}
							{/if}
						{/each}
					</p>
				</div>
			</div>
		{/if}
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
			{isEditing ? 'Update Prompt' : 'Create Prompt'}
		</button>
	</div>
</form>
