<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getPrompts, createPrompt, updatePrompt, deletePrompt, incrementPromptUsage } from '$services/database';
	import { PROMPT_CATEGORIES, LANGUAGES } from '$config/constants';
	import { formatRelativeDate } from '$utils/formatters';
	import type { Prompt } from '$types';
	import { v4 as uuid } from 'uuid';

	let prompts = $state<Prompt[]>([]);
	let activeCategory = $state('all');
	let showEditor = $state(false);
	let editingPrompt = $state<Prompt | null>(null);
	let searchQuery = $state('');

	// Editor state
	let edTitle = $state('');
	let edContent = $state('');
	let edCategory = $state('general');
	let edLanguage = $state('');

	let filteredPrompts = $derived(() => {
		let filtered = prompts;
		if (activeCategory !== 'all') filtered = filtered.filter(p => p.category === activeCategory);
		if (searchQuery) filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase()));
		return filtered;
	});

	let detectedVars = $derived(() => {
		const matches = edContent.match(/\{\{(\w+)\}\}/g) || [];
		return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
	});

	async function handleCopy(prompt: Prompt) {
		try {
			await navigator.clipboard.writeText(prompt.content);
			await incrementPromptUsage(prompt.id);
			prompts = await getPrompts();
			toasts.success('Copied!', 'Prompt copied to clipboard');
		} catch {
			toasts.error('Copy Failed');
		}
	}

	function startEdit(prompt?: Prompt) {
		if (prompt) {
			editingPrompt = prompt;
			edTitle = prompt.title;
			edContent = prompt.content;
			edCategory = prompt.category;
			edLanguage = prompt.language ?? '';
		} else {
			editingPrompt = null;
			edTitle = '';
			edContent = '';
			edCategory = 'general';
			edLanguage = '';
		}
		showEditor = true;
	}

	async function handleSave() {
		if (!edTitle.trim() || !edContent.trim()) { toasts.warning('Title and content are required'); return; }
		const vars = detectedVars();
		if (editingPrompt) {
			await updatePrompt(editingPrompt.id, { title: edTitle, content: edContent, category: edCategory as Prompt['category'], language: edLanguage || null, variables: vars.length ? JSON.stringify(vars.map(v => ({ name: v, default_value: '' }))) : null });
		} else {
			await createPrompt({ id: uuid(), title: edTitle, content: edContent, category: edCategory as Prompt['category'], language: edLanguage || null, variables: vars.length ? JSON.stringify(vars.map(v => ({ name: v, default_value: '' }))) : null });
		}
		prompts = await getPrompts();
		showEditor = false;
		toasts.success(editingPrompt ? 'Prompt Updated' : 'Prompt Created');
	}

	async function handleDelete(id: string) {
		await deletePrompt(id);
		prompts = await getPrompts();
		toasts.success('Prompt Deleted');
	}

	onMount(async () => {
		nav.navigate('/prompts');
		prompts = await getPrompts();
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between px-8 py-5 border-b shrink-0" style="border-color: var(--border-default);">
		<div class="flex items-center gap-3">
			<Icon icon="ph:chat-dots-bold" width={24} height={24} style="color: var(--text-accent);" />
			<h1 class="text-xl font-bold" style="color: var(--text-primary);">Prompts Library</h1>
			<span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style="background: var(--bg-active); color: var(--text-accent);">{prompts.length}</span>
		</div>
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-2 rounded-xl px-3 py-2" style="background: var(--bg-input); border: 1px solid var(--border-default);">
				<Icon icon="ph:magnifying-glass" width={15} height={15} style="color: var(--text-tertiary);" />
				<input type="text" bind:value={searchQuery} placeholder="Search prompts..." class="bg-transparent text-[13px] outline-none w-48" style="color: var(--text-primary);" />
			</div>
			<button onclick={() => startEdit()} class="btn-primary">
				<Icon icon="ph:plus-bold" width={15} height={15} /> New Prompt
			</button>
		</div>
	</div>

	<!-- Categories -->
	<div class="flex items-center gap-1 px-8 py-3 border-b overflow-x-auto shrink-0" style="border-color: var(--border-default);">
		<button onclick={() => { activeCategory = 'all'; }} class="rounded-full px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors" style="background: {activeCategory === 'all' ? 'var(--bg-active)' : 'transparent'}; color: {activeCategory === 'all' ? 'var(--text-accent)' : 'var(--text-secondary)'};">
			All
		</button>
		{#each PROMPT_CATEGORIES as cat}
			<button onclick={() => { activeCategory = cat.value; }} class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors" style="background: {activeCategory === cat.value ? 'var(--bg-active)' : 'transparent'}; color: {activeCategory === cat.value ? 'var(--text-accent)' : 'var(--text-secondary)'};">
				<Icon icon={cat.icon} width={14} height={14} />
				{cat.label}
			</button>
		{/each}
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto px-8 py-6">
		{#if showEditor}
			<div class="max-w-2xl mx-auto animate-slide-up">
				<div class="rounded-2xl border p-8 space-y-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					<h3 class="text-base font-semibold" style="color: var(--text-primary);">{editingPrompt ? 'Edit Prompt' : 'New Prompt'}</h3>
					<input type="text" bind:value={edTitle} placeholder="Prompt title..." class="input-field" />
					<div class="flex gap-3">
						<select bind:value={edCategory} class="rounded-xl border px-4 py-2.5 text-[13px]" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);">
							{#each PROMPT_CATEGORIES as cat}
								<option value={cat.value}>{cat.label}</option>
							{/each}
						</select>
						<select bind:value={edLanguage} class="rounded-xl border px-4 py-2.5 text-[13px]" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);">
							<option value="">No language</option>
							{#each LANGUAGES as lang}
								<option value={lang}>{lang}</option>
							{/each}
						</select>
					</div>
					<textarea bind:value={edContent} placeholder="Write your prompt... Use {{variable}} for template variables" rows={10} class="input-field resize-none font-mono" style="font-size: 0.8125rem;"></textarea>
					{#if detectedVars().length > 0}
						<div class="flex items-center gap-2 flex-wrap">
							<span class="text-[11px] font-medium" style="color: var(--text-tertiary);">Variables:</span>
							{#each detectedVars() as v}
								<span class="rounded-lg px-2.5 py-1 text-[11px] font-mono" style="background: var(--bg-active); color: var(--text-accent);">{`{{${v}}}`}</span>
							{/each}
						</div>
					{/if}
					<div class="flex justify-end gap-2">
						<button onclick={() => { showEditor = false; }} class="btn-ghost">Cancel</button>
						<button onclick={handleSave} class="btn-primary">Save</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
				{#each filteredPrompts() as prompt (prompt.id)}
					<div class="group rounded-2xl border p-5 transition-all duration-150 hover:shadow-md" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
						<div class="flex items-start justify-between mb-2">
							<h3 class="text-[15px] font-semibold" style="color: var(--text-primary);">{prompt.title}</h3>
							{#if prompt.is_favorited}
								<Icon icon="ph:star-fill" width={16} height={16} style="color: var(--color-warning);" />
							{/if}
						</div>
						<div class="flex items-center gap-2 mb-3">
							<span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style="background: var(--bg-active); color: var(--text-accent);">{prompt.category}</span>
							{#if prompt.language}
								<span class="rounded-full px-2.5 py-0.5 text-[11px] font-mono" style="background: var(--bg-surface-raised); color: var(--text-secondary);">{prompt.language}</span>
							{/if}
						</div>
						<p class="text-[13px] leading-relaxed mb-4 line-clamp-3" style="color: var(--text-secondary);">{prompt.content.slice(0, 200)}</p>
						<div class="flex items-center justify-between">
							<span class="text-[11px]" style="color: var(--text-tertiary);">Used {prompt.usage_count}x</span>
							<div class="flex items-center gap-1.5">
								<button onclick={() => startEdit(prompt)} class="rounded-xl px-3 py-1.5 text-[12px] transition-colors" style="color: var(--text-secondary);">Edit</button>
								<button onclick={() => handleCopy(prompt)} class="rounded-xl px-4 py-1.5 text-[12px] font-medium text-white transition-colors" style="background: var(--color-primary-600);">
									<Icon icon="ph:copy" width={13} height={13} style="display: inline; vertical-align: -1px;" /> Copy
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
			{#if filteredPrompts().length === 0}
				<div class="flex flex-col items-center justify-center py-24">
					<Icon icon="ph:chat-dots" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
					<p class="mt-4 text-sm" style="color: var(--text-tertiary);">{searchQuery ? 'No matching prompts' : 'No prompts yet'}</p>
					<button onclick={() => startEdit()} class="mt-4 btn-primary">Create your first prompt</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
