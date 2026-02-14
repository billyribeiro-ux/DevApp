<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getSnippets, createSnippet, updateSnippet, deleteSnippet } from '$services/database';
	import { LANGUAGES } from '$config/constants';
	import type { Snippet } from '$types';
	import { v4 as uuid } from 'uuid';

	let snippets = $state<Snippet[]>([]);
	let activeLanguage = $state('all');
	let showEditor = $state(false);
	let editingSnippet = $state<Snippet | null>(null);
	let searchQuery = $state('');

	let sTitle = $state('');
	let sCode = $state('');
	let sLanguage = $state('javascript');
	let sDescription = $state('');

	let filteredSnippets = $derived(() => {
		let filtered = snippets;
		if (activeLanguage !== 'all') filtered = filtered.filter(s => s.language === activeLanguage);
		if (searchQuery) filtered = filtered.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase()));
		return filtered;
	});

	async function handleCopy(snippet: Snippet) {
		try {
			await navigator.clipboard.writeText(snippet.code);
			await updateSnippet(snippet.id, { usage_count: snippet.usage_count + 1 });
			snippets = await getSnippets();
			toasts.success('Copied!', 'Code copied to clipboard');
		} catch { toasts.error('Copy Failed'); }
	}

	function startEdit(snippet?: Snippet) {
		if (snippet) {
			editingSnippet = snippet;
			sTitle = snippet.title;
			sCode = snippet.code;
			sLanguage = snippet.language;
			sDescription = snippet.description ?? '';
		} else {
			editingSnippet = null;
			sTitle = '';
			sCode = '';
			sLanguage = 'javascript';
			sDescription = '';
		}
		showEditor = true;
	}

	async function handleSave() {
		if (!sTitle.trim() || !sCode.trim()) { toasts.warning('Title and code are required'); return; }
		if (editingSnippet) {
			await updateSnippet(editingSnippet.id, { title: sTitle, code: sCode, language: sLanguage, description: sDescription || null });
		} else {
			await createSnippet({ id: uuid(), title: sTitle, code: sCode, language: sLanguage, description: sDescription || null });
		}
		snippets = await getSnippets();
		showEditor = false;
		toasts.success(editingSnippet ? 'Snippet Updated' : 'Snippet Created');
	}

	async function handleDelete(id: string) {
		await deleteSnippet(id);
		snippets = await getSnippets();
		toasts.success('Snippet Deleted');
	}

	onMount(async () => {
		nav.navigate('/snippets');
		snippets = await getSnippets();
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="flex items-center justify-between px-6 py-4 border-b shrink-0" style="border-color: var(--border-default);">
		<div class="flex items-center gap-3">
			<Icon icon="ph:code-bold" width={22} height={22} style="color: #14b8a6;" />
			<h1 class="text-lg font-bold" style="color: var(--text-primary);">Code Snippets</h1>
			<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" style="background: rgba(20, 184, 166, 0.1); color: #14b8a6;">{snippets.length}</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style="background: var(--bg-input); border: 1px solid var(--border-default);">
				<Icon icon="ph:magnifying-glass" width={14} height={14} style="color: var(--text-tertiary);" />
				<input type="text" bind:value={searchQuery} placeholder="Search snippets..." class="bg-transparent text-xs outline-none w-36" style="color: var(--text-primary);" />
			</div>
			<button onclick={() => startEdit()} class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white" style="background: var(--color-primary-600);">
				<Icon icon="ph:plus-bold" width={14} height={14} /> New Snippet
			</button>
		</div>
	</div>

	<div class="flex items-center gap-1 px-6 py-2 border-b overflow-x-auto shrink-0" style="border-color: var(--border-default);">
		<button onclick={() => { activeLanguage = 'all'; }} class="rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0" style="background: {activeLanguage === 'all' ? 'var(--bg-active)' : 'transparent'}; color: {activeLanguage === 'all' ? 'var(--text-accent)' : 'var(--text-secondary)'};">All</button>
		{#each ['javascript', 'typescript', 'python', 'rust', 'css', 'html', 'sql', 'bash'] as lang}
			<button onclick={() => { activeLanguage = lang; }} class="rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0" style="background: {activeLanguage === lang ? 'var(--bg-active)' : 'transparent'}; color: {activeLanguage === lang ? 'var(--text-accent)' : 'var(--text-secondary)'};">{lang}</button>
		{/each}
	</div>

	<div class="flex-1 overflow-y-auto px-6 py-4">
		{#if showEditor}
			<div class="max-w-2xl mx-auto animate-slide-up">
				<div class="rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border-default);">
					<h3 class="text-sm font-semibold" style="color: var(--text-primary);">{editingSnippet ? 'Edit Snippet' : 'New Snippet'}</h3>
					<input type="text" bind:value={sTitle} placeholder="Snippet title..." class="w-full rounded-lg border px-3 py-2 text-sm outline-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
					<div class="flex gap-3">
						<select bind:value={sLanguage} class="rounded-lg border px-3 py-2 text-xs" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);">
							{#each LANGUAGES as lang}
								<option value={lang}>{lang}</option>
							{/each}
						</select>
						<input type="text" bind:value={sDescription} placeholder="Description..." class="flex-1 rounded-lg border px-3 py-2 text-xs outline-none" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary);" />
					</div>
					<textarea bind:value={sCode} placeholder="Paste your code here..." rows={12} class="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none font-mono leading-relaxed" style="background: var(--bg-input); border-color: var(--border-default); color: var(--text-primary); tab-size: 2;"></textarea>
					<div class="flex justify-end gap-2">
						<button onclick={() => { showEditor = false; }} class="rounded-lg px-4 py-2 text-xs" style="color: var(--text-secondary);">Cancel</button>
						<button onclick={handleSave} class="rounded-lg px-4 py-2 text-xs font-medium text-white" style="background: var(--color-primary-600);">Save</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each filteredSnippets() as snippet (snippet.id)}
					<div class="group rounded-xl border overflow-hidden transition-all duration-150 hover:shadow-md" style="background: var(--bg-card); border-color: var(--border-default);">
						<div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--border-subtle);">
							<div class="flex items-center gap-2 min-w-0">
								<h3 class="text-sm font-semibold truncate" style="color: var(--text-primary);">{snippet.title}</h3>
								<span class="rounded-md px-1.5 py-0.5 text-[10px] font-mono shrink-0" style="background: var(--bg-surface-raised); color: var(--text-secondary);">{snippet.language}</span>
							</div>
							<div class="flex items-center gap-1">
								<button onclick={() => handleCopy(snippet)} class="rounded-md px-2 py-1 text-[11px] font-medium text-white" style="background: var(--color-primary-600);">
									<Icon icon="ph:copy" width={12} height={12} style="display: inline; vertical-align: -1px;" /> Copy
								</button>
							</div>
						</div>
						<pre class="px-4 py-3 text-xs leading-relaxed overflow-x-auto max-h-40" style="color: var(--text-secondary); background: var(--bg-surface);">{snippet.code.slice(0, 500)}</pre>
						<div class="flex items-center justify-between px-4 py-2 border-t" style="border-color: var(--border-subtle);">
							<span class="text-[10px]" style="color: var(--text-tertiary);">Used {snippet.usage_count}x</span>
							<div class="flex gap-1">
								<button onclick={() => startEdit(snippet)} class="rounded-md p-1" style="color: var(--text-tertiary);"><Icon icon="ph:pencil" width={12} height={12} /></button>
								<button onclick={() => handleDelete(snippet.id)} class="rounded-md p-1" style="color: var(--text-tertiary);"><Icon icon="ph:trash" width={12} height={12} /></button>
							</div>
						</div>
					</div>
				{/each}
			</div>
			{#if filteredSnippets().length === 0}
				<div class="flex flex-col items-center justify-center py-20">
					<Icon icon="ph:code" width={48} height={48} style="color: var(--text-tertiary); opacity: 0.3;" />
					<p class="mt-3 text-sm" style="color: var(--text-tertiary);">No snippets yet</p>
					<button onclick={() => startEdit()} class="mt-3 rounded-lg px-4 py-2 text-xs font-medium text-white" style="background: var(--color-primary-600);">Create your first snippet</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
