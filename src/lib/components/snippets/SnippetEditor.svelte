<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { Snippet } from '$types';
  import { LANGUAGES } from '$config/constants';

  let {
    snippet,
    onsave,
    oncancel,
  }: {
    snippet: Snippet | null;
    onsave: (snippet: Partial<Snippet>) => void;
    oncancel: () => void;
  } = $props();

  let title = $state(snippet?.title ?? '');
  let language = $state(snippet?.language ?? 'javascript');
  let description = $state(snippet?.description ?? '');
  let code = $state(snippet?.code ?? '');

  let isEditing = $derived(snippet !== null);
  let canSave = $derived(title.trim().length > 0 && code.trim().length > 0);

  let lineNumbers = $derived(() => {
    const count = code.split('\n').length;
    return Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1);
  });

  let previewLines = $derived(() => {
    return code.split('\n').slice(0, 20);
  });

  function handleSave() {
    if (!canSave) return;

    const data: Partial<Snippet> = {
      title: title.trim(),
      language,
      description: description.trim() || null,
      code: code,
    };

    if (snippet) {
      data.id = snippet.id;
    }

    onsave(data);
  }

  function handleCancel() {
    oncancel();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  }

  function handleCodeKeydown(e: KeyboardEvent) {
    // Tab support in textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      code = code.substring(0, start) + '  ' + code.substring(end);
      // Restore cursor position after the inserted spaces
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex flex-col h-full"
  onkeydown={handleKeydown}
>
  <!-- Header -->
  <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
    <div class="flex items-center gap-2">
      <Icon
        icon={isEditing ? 'ph:pencil-simple' : 'ph:plus-circle'}
        class="text-lg text-[var(--text-accent)]"
      />
      <h2 class="text-base font-semibold text-[var(--text-primary)]">
        {isEditing ? 'Edit Snippet' : 'New Snippet'}
      </h2>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-secondary)]
          hover:bg-[var(--bg-surface-raised)] transition-colors"
        onclick={handleCancel}
      >
        Cancel
      </button>
      <button
        type="button"
        class="px-4 py-1.5 rounded-[var(--radius-md)] text-sm font-medium text-white
          transition-colors
          {canSave
            ? 'bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)]'
            : 'bg-[var(--color-neutral-400)] cursor-not-allowed'}"
        onclick={handleSave}
        disabled={!canSave}
      >
        <span class="flex items-center gap-1.5">
          <Icon icon="ph:floppy-disk" class="text-sm" />
          {isEditing ? 'Save Changes' : 'Create Snippet'}
        </span>
      </button>
    </div>
  </div>

  <!-- Form body -->
  <div class="flex-1 overflow-y-auto">
    <div class="flex flex-col lg:flex-row gap-0 h-full">
      <!-- Left: form fields + code editor -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Title + Language row -->
        <div class="flex gap-3 px-6 pt-5 pb-3">
          <div class="flex-1">
            <label for="snippet-title" class="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Title <span class="text-[var(--color-error)]">*</span>
            </label>
            <input
              id="snippet-title"
              type="text"
              bind:value={title}
              placeholder="e.g., React useDebounce Hook"
              class="w-full rounded-[var(--radius-md)] border border-[var(--border-default)]
                bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)]
                placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-active)]
                transition-colors"
            />
          </div>

          <div class="w-48">
            <label for="snippet-language" class="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Language
            </label>
            <select
              id="snippet-language"
              bind:value={language}
              class="w-full rounded-[var(--radius-md)] border border-[var(--border-default)]
                bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)]
                focus:outline-none focus:border-[var(--border-active)] transition-colors
                appearance-none cursor-pointer"
            >
              {#each LANGUAGES as lang}
                <option value={lang}>{lang}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="px-6 pb-3">
          <label for="snippet-description" class="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Description
          </label>
          <textarea
            id="snippet-description"
            bind:value={description}
            placeholder="Brief description of what this snippet does..."
            rows="2"
            class="w-full rounded-[var(--radius-md)] border border-[var(--border-default)]
              bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)]
              placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-active)]
              transition-colors resize-none"
          ></textarea>
        </div>

        <!-- Code editor -->
        <div class="flex-1 flex flex-col px-6 pb-5 min-h-0">
          <label for="snippet-code" class="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Code <span class="text-[var(--color-error)]">*</span>
          </label>
          <div class="flex-1 min-h-[240px] rounded-[var(--radius-lg)] border border-[var(--border-default)]
            bg-[var(--bg-surface-raised)] overflow-hidden flex">
            <!-- Line numbers gutter -->
            <div
              class="flex-shrink-0 select-none py-3 px-2 text-right border-r border-[var(--border-subtle)]
                bg-[var(--bg-surface)]"
              aria-hidden="true"
            >
              {#each lineNumbers() as num}
                <div class="text-[11px] leading-[1.625rem] text-[var(--text-tertiary)] font-mono tabular-nums">
                  {num}
                </div>
              {/each}
            </div>

            <!-- Code textarea -->
            <textarea
              id="snippet-code"
              bind:value={code}
              onkeydown={handleCodeKeydown}
              placeholder="Paste or write your code here..."
              spellcheck="false"
              class="flex-1 p-3 text-sm leading-[1.625rem] font-mono text-[var(--text-primary)]
                bg-transparent placeholder:text-[var(--text-tertiary)] focus:outline-none
                resize-none whitespace-pre overflow-x-auto tab-size-2"
            ></textarea>
          </div>
          <p class="mt-1.5 text-[10px] text-[var(--text-tertiary)]">
            {code.split('\n').length} lines
            {#if code.length > 0}
              &middot; {code.length} characters
            {/if}
            &middot; Tab inserts 2 spaces &middot;
            <kbd class="px-1 py-0.5 rounded bg-[var(--bg-surface-raised)] text-[9px] font-mono">Cmd+S</kbd> to save
          </p>
        </div>
      </div>

      <!-- Right: Live preview -->
      <div class="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border-default)]
        flex flex-col bg-[var(--bg-surface)]">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
          <Icon icon="ph:eye" class="text-sm text-[var(--text-secondary)]" />
          <span class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Preview
          </span>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          {#if title || code}
            <!-- Preview card -->
            <div class="rounded-[var(--radius-md)] border border-[var(--border-default)]
              bg-[var(--bg-card)] overflow-hidden">
              <!-- Preview header -->
              <div class="px-3 py-2.5 border-b border-[var(--border-subtle)]">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {title || 'Untitled Snippet'}
                  </h4>
                </div>
                {#if description}
                  <p class="mt-0.5 text-[10px] text-[var(--text-secondary)] truncate">
                    {description}
                  </p>
                {/if}
                <span
                  class="mt-1.5 inline-block rounded-[var(--radius-sm)] px-1.5 py-0.5
                    text-[10px] font-semibold bg-[var(--bg-surface-raised)] text-[var(--text-secondary)]"
                >
                  {language}
                </span>
              </div>

              <!-- Preview code block -->
              {#if code}
                <pre
                  class="px-3 py-2.5 text-[11px] leading-relaxed text-[var(--text-secondary)]
                    bg-[var(--bg-surface-raised)] overflow-hidden font-mono whitespace-pre
                    max-h-64"
                ><code>{previewLines().join('\n')}</code></pre>
                {#if code.split('\n').length > 20}
                  <div class="px-3 py-1.5 text-[9px] text-[var(--text-tertiary)] text-center border-t border-[var(--border-subtle)]">
                    Showing first 20 of {code.split('\n').length} lines
                  </div>
                {/if}
              {/if}
            </div>
          {:else}
            <div class="flex flex-col items-center justify-center h-full text-center py-12">
              <Icon icon="ph:code" class="text-3xl text-[var(--text-tertiary)] mb-2" />
              <p class="text-xs text-[var(--text-tertiary)]">
                Start typing to see a preview
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
