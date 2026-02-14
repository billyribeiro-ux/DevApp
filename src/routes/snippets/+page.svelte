<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { nav, toasts } from '$stores/app.svelte';
	import { getSnippets, createSnippet, updateSnippet, deleteSnippet } from '$services/database';
	import { LANGUAGES } from '$config/constants';
	import type { Snippet } from '$types';
	import { v4 as uuid } from 'uuid';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import DropZone from '$lib/components/ui/DropZone.svelte';

	let snippets = $state<Snippet[]>([]);
	let activeLanguage = $state('all');
	let showEditor = $state(false);
	let editingSnippet = $state<Snippet | null>(null);
	let searchQuery = $state('');

	let sTitle = $state('');
	let sCode = $state('');
	let sLanguage = $state('javascript');
	let sDescription = $state('');
	let confirmDeleteOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);

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

	function requestDelete(id: string) {
		pendingDeleteId = id;
		confirmDeleteOpen = true;
	}

	async function handleDelete() {
		if (!pendingDeleteId) return;
		await deleteSnippet(pendingDeleteId);
		snippets = await getSnippets();
		pendingDeleteId = null;
		toasts.success('Snippet Deleted');
	}

	const extToLang: Record<string, string> = {
		js: 'javascript', ts: 'typescript', py: 'python', rs: 'rust', go: 'go',
		java: 'java', css: 'css', scss: 'scss', html: 'html', svelte: 'svelte',
		vue: 'html', json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
		sql: 'sql', sh: 'bash', bash: 'bash', rb: 'ruby', php: 'php',
		swift: 'swift', kt: 'kotlin', dart: 'dart', c: 'c', cpp: 'cpp',
		cs: 'csharp', md: 'markdown', txt: 'plaintext',
	};

	async function handleFileDrop(files: File[]) {
		let imported = 0;
		for (const file of files) {
			const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
			const lang = extToLang[ext];
			if (!lang) continue;
			const code = await file.text();
			const title = file.name.replace(/\.[^.]+$/, '');
			await createSnippet({ id: uuid(), title, code, language: lang });
			imported++;
		}
		if (imported > 0) {
			snippets = await getSnippets();
			toasts.success(`Imported ${imported} snippet${imported > 1 ? 's' : ''}`);
		} else {
			toasts.warning('No recognized code files found');
		}
	}

	onMount(async () => {
		nav.navigate('/snippets');
		snippets = await getSnippets();
	});
</script>

<div class="flex flex-col h-full overflow-hidden">
	<div class="flex items-center justify-between px-8 py-5 border-b shrink-0" style="border-color: var(--border-default);">
		<div class="flex items-center gap-3">
			<Icon icon="ph:code-bold" width={24} height={24} style="color: #14b8a6;" />
			<h1 class="text-[22px] font-bold" style="color: var(--text-primary); letter-spacing: -0.02em;">Code Snippets</h1>
			<span class="rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style="background: rgba(20, 184, 166, 0.1); color: #14b8a6;">{snippets.length}</span>
		</div>
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-2 rounded-xl px-3 py-2" style="background: var(--bg-input); border: 1px solid var(--border-default);">
				<Icon icon="ph:magnifying-glass" width={16} height={16} style="color: var(--text-tertiary);" />
				<input type="text" bind:value={searchQuery} placeholder="Search snippets..." class="bg-transparent text-[14px] outline-none w-44" style="color: var(--text-primary);" />
			</div>
			<button onclick={() => startEdit()} class="btn-primary">
				<Icon icon="ph:plus-bold" width={15} height={15} /> New Snippet
			</button>
		</div>
	</div>

	<div class="flex items-center gap-1.5 px-8 py-3 border-b overflow-x-auto shrink-0" style="border-color: var(--border-default);">
		<button onclick={() => { activeLanguage = 'all'; }} class="rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors shrink-0" style="background: {activeLanguage === 'all' ? 'var(--bg-active)' : 'transparent'}; color: {activeLanguage === 'all' ? 'var(--text-accent)' : 'var(--text-secondary)'};">All</button>
		{#each ['javascript', 'typescript', 'python', 'rust', 'css', 'html', 'sql', 'bash'] as lang}
			<button onclick={() => { activeLanguage = lang; }} class="rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors shrink-0" style="background: {activeLanguage === lang ? 'var(--bg-active)' : 'transparent'}; color: {activeLanguage === lang ? 'var(--text-accent)' : 'var(--text-secondary)'};">{lang}</button>
		{/each}
	</div>

	<div class="flex-1 overflow-y-auto px-8 py-6">
		{#if showEditor}
			<div class="max-w-2xl mx-auto animate-slide-up">
				<div class="rounded-2xl border p-8 space-y-5" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
					<h3 class="text-base font-semibold" style="color: var(--text-primary);">{editingSnippet ? 'Edit Snippet' : 'New Snippet'}</h3>
					<input type="text" bind:value={sTitle} placeholder="Snippet title..." class="input-field" />
					<div class="flex gap-3">
						<select bind:value={sLanguage} class="input-field input-field-sm" style="width: auto;">
							{#each LANGUAGES as lang}
								<option value={lang}>{lang}</option>
							{/each}
						</select>
						<input type="text" bind:value={sDescription} placeholder="Description..." class="flex-1 input-field input-field-sm" />
					</div>
					<textarea bind:value={sCode} placeholder="Paste your code here..." rows={14} class="input-field resize-none font-mono leading-relaxed" style="tab-size: 2; font-size: 0.8125rem;"></textarea>
					<div class="flex justify-end gap-2 pt-2">
						<button onclick={() => { showEditor = false; }} class="btn-ghost">Cancel</button>
						<button onclick={handleSave} class="btn-primary">Save</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
				{#each filteredSnippets() as snippet (snippet.id)}
					<div class="group rounded-2xl border overflow-hidden transition-all duration-150 hover:shadow-md" style="background: var(--bg-card); border-color: var(--border-default); box-shadow: var(--shadow-card);">
						<div class="flex items-center justify-between px-5 py-4 border-b" style="border-color: var(--border-subtle);">
							<div class="flex items-center gap-2.5 min-w-0">
								<h3 class="text-[16px] font-semibold truncate" style="color: var(--text-primary);">{snippet.title}</h3>
								<span class="rounded-lg px-2 py-0.5 text-[12px] font-mono shrink-0" style="background: var(--bg-surface-raised); color: var(--text-secondary);">{snippet.language}</span>
							</div>
							<div class="flex items-center gap-1.5">
								<button onclick={() => handleCopy(snippet)} class="rounded-xl px-3.5 py-1.5 text-[12px] font-medium text-white" style="background: var(--color-primary-600);">
									<Icon icon="ph:copy" width={13} height={13} style="display: inline; vertical-align: -1px;" /> Copy
								</button>
							</div>
						</div>
						<pre class="px-5 py-4 text-[13px] leading-relaxed overflow-x-auto max-h-44" style="color: var(--text-secondary); background: var(--bg-surface);">{snippet.code.slice(0, 500)}</pre>
						<div class="flex items-center justify-between px-5 py-3 border-t" style="border-color: var(--border-subtle);">
							<span class="text-[12px]" style="color: var(--text-tertiary);">Used {snippet.usage_count}x</span>
							<div class="flex gap-1">
								<button onclick={() => startEdit(snippet)} class="rounded-xl p-1.5" style="color: var(--text-tertiary);"><Icon icon="ph:pencil" width={14} height={14} /></button>
								<button onclick={() => requestDelete(snippet.id)} class="rounded-xl p-1.5" style="color: var(--text-tertiary);"><Icon icon="ph:trash" width={14} height={14} /></button>
							</div>
						</div>
					</div>
				{/each}
			</div>
			{#if filteredSnippets().length === 0}
				<DropZone onfiledrop={handleFileDrop}>
					<div class="flex flex-col items-center justify-center py-24">
						<Icon icon="ph:code" width={56} height={56} style="color: var(--text-tertiary); opacity: 0.3;" />
						<p class="mt-4 text-sm" style="color: var(--text-tertiary);">No snippets yet</p>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">Drop code files here to import as snippets</p>
						<button onclick={() => startEdit()} class="mt-4 btn-primary">Create your first snippet</button>
					</div>
				</DropZone>
			{/if}
		{/if}
	</div>
</div>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete Snippet"
	description="Are you sure you want to delete this snippet? This action cannot be undone."
	confirmLabel="Delete"
	variant="danger"
	onconfirm={handleDelete}
/>
