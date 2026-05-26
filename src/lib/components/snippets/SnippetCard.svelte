<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { Snippet } from '$types';

  let {
    snippet,
    oncopy,
    onedit,
  }: {
    snippet: Snippet;
    oncopy: (id: string) => void;
    onedit: (id: string) => void;
  } = $props();

  const LANGUAGE_COLORS: Record<string, string> = {
    javascript: '#f59e0b',
    typescript: '#3b82f6',
    python: '#3776ab',
    rust: '#dea584',
    go: '#00add8',
    java: '#b07219',
    svelte: '#ff3e00',
    html: '#e34c26',
    css: '#264de4',
    scss: '#cd6799',
    sql: '#336791',
    json: '#71717a',
    yaml: '#71717a',
    toml: '#71717a',
    markdown: '#71717a',
    bash: '#4eaa25',
    shell: '#4eaa25',
    ruby: '#cc342d',
    php: '#777bb4',
    swift: '#f05138',
    kotlin: '#7f52ff',
    dart: '#00b4ab',
    c: '#555555',
    cpp: '#f34b7d',
    csharp: '#68217a',
    plaintext: '#71717a',
  };

  let langColor = $derived(LANGUAGE_COLORS[snippet.language] ?? '#71717a');

  let codePreview = $derived.by(() => {
    const lines = snippet.code.split('\n');
    return lines.slice(0, 6).join('\n');
  });

  let lineCount = $derived(snippet.code.split('\n').length);
  let hasMoreLines = $derived(lineCount > 6);

  let copyLabel = $state('Copy');
  let copyTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleCopy() {
    oncopy(snippet.id);
    copyLabel = 'Copied!';
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copyLabel = 'Copy';
    }, 2000);
  }

  function handleEdit() {
    onedit(snippet.id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleEdit();
    }
  }
</script>

<div
  class="group rounded-[var(--radius-lg)] border border-[var(--border-default)]
    bg-[var(--bg-card)] overflow-hidden transition-all duration-[var(--transition-fast)]
    hover:shadow-[var(--shadow-md)] hover:border-[var(--border-active)]"
  role="article"
>
  <!-- Header -->
  <div class="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-[var(--text-primary)] truncate">
          {snippet.title}
        </h3>

        <!-- Favorite star -->
        {#if snippet.is_favorited === 1}
          <Icon icon="ph:star-fill" class="text-sm text-[var(--color-warning)] flex-shrink-0" />
        {/if}
      </div>

      {#if snippet.description}
        <p class="mt-0.5 text-xs text-[var(--text-secondary)] truncate-2 leading-relaxed">
          {snippet.description}
        </p>
      {/if}
    </div>

    <!-- Action buttons -->
    <div class="flex items-center gap-1 flex-shrink-0">
      <button
        type="button"
        class="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)]
          text-xs font-medium transition-colors
          {copyLabel === 'Copied!'
            ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
            : 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-100)] dark:bg-[rgba(99,102,241,0.15)] dark:text-[var(--color-primary-400)] dark:hover:bg-[rgba(99,102,241,0.25)]'}"
        onclick={handleCopy}
        aria-label="Copy snippet code"
      >
        <Icon icon={copyLabel === 'Copied!' ? 'ph:check-bold' : 'ph:copy'} class="text-sm" />
        {copyLabel}
      </button>

      <button
        type="button"
        class="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)]
          hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)]
          transition-colors opacity-0 group-hover:opacity-100"
        onclick={handleEdit}
        aria-label="Edit snippet"
      >
        <Icon icon="ph:pencil-simple" class="text-sm" />
      </button>
    </div>
  </div>

  <!-- Language badge + usage count row -->
  <div class="flex items-center justify-between px-4 pb-2">
    <span
      class="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5
        text-[10px] font-semibold"
      style="background-color: color-mix(in srgb, {langColor} 12%, transparent);
             color: {langColor}"
    >
      <Icon icon="ph:code" class="text-xs" />
      {snippet.language}
    </span>

    <span class="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
      <Icon icon="ph:copy-simple" class="text-xs" />
      {snippet.usage_count} uses
    </span>
  </div>

  <!-- Code preview -->
  <div class="relative border-t border-[var(--border-subtle)]">
    <pre
      class="px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-surface-raised)]
        overflow-hidden font-mono whitespace-pre"
    ><code>{codePreview}</code></pre>

    {#if hasMoreLines}
      <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-surface-raised)] to-transparent
        pointer-events-none"></div>
      <span class="absolute bottom-1 right-3 text-[9px] text-[var(--text-tertiary)] font-medium">
        +{lineCount - 6} more lines
      </span>
    {/if}
  </div>
</div>
