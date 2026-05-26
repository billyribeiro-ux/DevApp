<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { Course, CourseSection, CourseLesson } from '$types';
  import { getStatusColor } from '$utils/formatters';

  let {
    course,
    sections,
    onupdatecourse,
    ontogglelesson,
    onsavenotes,
  }: {
    course: Course;
    sections: CourseSection[];
    onupdatecourse: (updates: Partial<Course>) => void;
    ontogglelesson: (lessonId: string, completed: boolean) => void;
    onsavenotes?: (lessonId: string, notes: string) => void;
  } = $props();

  const STATUS_LABELS: Record<Course['status'], string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    paused: 'Paused',
  };

  const STATUS_ICONS: Record<Course['status'], string> = {
    not_started: 'ph:circle-dashed',
    in_progress: 'ph:circle-half',
    completed: 'ph:check-circle-fill',
    paused: 'ph:pause-circle',
  };

  // svelte-ignore state_referenced_locally
  let expandedSections = $state<Set<string>>(new Set(sections.map((s) => s.id)));
  // svelte-ignore state_referenced_locally
  let editingNotes = $state<string | null>(null);
  // svelte-ignore state_referenced_locally
  let noteText = $state('');

  let clampedProgress = $derived(Math.min(100, Math.max(0, course.progress_percent)));

  let totalDuration = $derived(
    sections.reduce((total, section) => {
      return (
        total +
        (section.lessons?.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0) ?? 0)
      );
    }, 0)
  );

  let totalLessons = $derived(
    sections.reduce((total, section) => total + (section.lessons?.length ?? 0), 0)
  );

  let completedLessons = $derived(
    sections.reduce((total, section) => {
      return (
        total +
        (section.lessons?.filter((l) => l.is_completed === 1).length ?? 0)
      );
    }, 0)
  );

  function toggleSection(sectionId: string) {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    expandedSections = next;
  }

  function handleLessonToggle(lesson: CourseLesson) {
    const newCompleted = lesson.is_completed !== 1;
    ontogglelesson(lesson.id, newCompleted);
  }

  function openNotes(lesson: CourseLesson) {
    editingNotes = lesson.id;
    // svelte-ignore state_referenced_locally
    noteText = lesson.notes ?? '';
  }

  function saveNotes() {
    if (editingNotes) {
      onsavenotes?.(editingNotes, noteText);
    }
    editingNotes = null;
    noteText = '';
  }

  function closeNotes() {
    editingNotes = null;
    noteText = '';
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  function formatTotalDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m total` : `${h}h total`;
  }

  function getSectionProgress(section: CourseSection): number {
    if (!section.lessons || section.lessons.length === 0) return 0;
    const completed = section.lessons.filter((l) => l.is_completed === 1).length;
    return Math.round((completed / section.lessons.length) * 100);
  }
</script>

<div class="flex flex-col gap-6">
  <!-- Course Header -->
  <div class="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span
            class="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-semibold"
            style="background-color: color-mix(in srgb, {getStatusColor(course.status)} 15%, transparent);
                   color: {getStatusColor(course.status)}"
          >
            <Icon icon={STATUS_ICONS[course.status]} class="text-sm" />
            {STATUS_LABELS[course.status]}
          </span>

          {#if course.platform}
            <span class="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--bg-surface-raised)]
              px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
              <Icon icon="ph:monitor-play" class="text-sm" />
              {course.platform}
            </span>
          {/if}
        </div>

        <h1 class="text-xl font-bold text-[var(--text-primary)] leading-tight">
          {course.name}
        </h1>

        {#if course.instructor}
          <p class="mt-1 text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
            <Icon icon="ph:chalkboard-teacher" class="text-base" />
            {course.instructor}
          </p>
        {/if}

        {#if course.description}
          <p class="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
            {course.description}
          </p>
        {/if}

        {#if course.url}
          <a
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-accent)]
              hover:underline transition-colors"
          >
            <Icon icon="ph:arrow-square-out" class="text-base" />
            Open course link
          </a>
        {/if}
      </div>

      <!-- Edit button -->
      <button
        type="button"
        class="flex-shrink-0 flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-default)]
          bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]
          hover:bg-[var(--bg-surface-raised)] hover:text-[var(--text-primary)] transition-colors"
        onclick={() => onupdatecourse({})}
      >
        <Icon icon="ph:pencil-simple" class="text-sm" />
        Edit
      </button>
    </div>

    <!-- Progress overview -->
    <div class="mt-5 pt-5 border-t border-[var(--border-subtle)]">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-[var(--text-primary)]">Overall Progress</span>
        <div class="flex items-center gap-3">
          <span class="text-xs text-[var(--text-secondary)]">
            {completedLessons}/{totalLessons} lessons
          </span>
          {#if totalDuration > 0}
            <span class="text-xs text-[var(--text-tertiary)]">
              {formatTotalDuration(totalDuration)}
            </span>
          {/if}
          <span class="text-sm font-bold" style="color: {getStatusColor(course.status)}">
            {clampedProgress}%
          </span>
        </div>
      </div>
      <div class="h-2 w-full rounded-full bg-[var(--bg-surface-raised)] overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          style="width: {clampedProgress}%; background-color: {getStatusColor(course.status)}"
        ></div>
      </div>
    </div>
  </div>

  <!-- Sections / Lessons tree -->
  <div class="flex flex-col gap-2">
    <h2 class="text-sm font-semibold text-[var(--text-primary)] px-1 flex items-center gap-2">
      <Icon icon="ph:list-checks" class="text-base text-[var(--text-secondary)]" />
      Course Content
      <span class="text-xs font-normal text-[var(--text-tertiary)]">
        ({sections.length} sections)
      </span>
    </h2>

    {#each sections as section (section.id)}
      {@const sectionProgress = getSectionProgress(section)}
      {@const isExpanded = expandedSections.has(section.id)}
      {@const lessonCount = section.lessons?.length ?? 0}
      {@const sectionCompleted = section.lessons?.filter((l) => l.is_completed === 1).length ?? 0}

      <div class="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
        <!-- Section header -->
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-card-hover)]
            transition-colors"
          onclick={() => toggleSection(section.id)}
        >
          <Icon
            icon={isExpanded ? 'ph:caret-down-bold' : 'ph:caret-right-bold'}
            class="text-xs text-[var(--text-tertiary)] flex-shrink-0 transition-transform"
          />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-[var(--text-primary)] truncate">
                {section.name}
              </span>
              <span class="text-[10px] text-[var(--text-tertiary)] font-medium flex-shrink-0">
                {sectionCompleted}/{lessonCount}
              </span>
            </div>
          </div>

          <!-- Section mini progress bar -->
          <div class="w-16 h-1 rounded-full bg-[var(--bg-surface-raised)] overflow-hidden flex-shrink-0">
            <div
              class="h-full rounded-full transition-all duration-300"
              style="width: {sectionProgress}%; background-color: {sectionProgress === 100 ? 'var(--color-success)' : 'var(--color-info)'}"
            ></div>
          </div>

          {#if sectionProgress === 100}
            <Icon icon="ph:check-circle-fill" class="text-base text-[var(--color-success)] flex-shrink-0" />
          {/if}
        </button>

        <!-- Lessons list -->
        {#if isExpanded && section.lessons && section.lessons.length > 0}
          <div class="border-t border-[var(--border-subtle)]">
            {#each section.lessons as lesson, lessonIdx (lesson.id)}
              <div
                class="flex items-center gap-3 px-4 py-2.5 {lessonIdx !== (section.lessons?.length ?? 0) - 1 ? 'border-b border-[var(--border-subtle)]' : ''}
                  hover:bg-[var(--bg-card-hover)] transition-colors group"
              >
                <!-- Checkbox -->
                <button
                  type="button"
                  class="flex-shrink-0 w-5 h-5 rounded-[var(--radius-sm)] border-2 flex items-center
                    justify-center transition-all duration-200
                    {lesson.is_completed === 1
                      ? 'bg-[var(--color-success)] border-[var(--color-success)]'
                      : 'border-[var(--color-neutral-300)] hover:border-[var(--color-primary-500)]'}"
                  onclick={() => handleLessonToggle(lesson)}
                  aria-label={lesson.is_completed === 1 ? `Mark ${lesson.name} as incomplete` : `Mark ${lesson.name} as complete`}
                >
                  {#if lesson.is_completed === 1}
                    <Icon icon="ph:check-bold" class="text-[10px] text-white" />
                  {/if}
                </button>

                <!-- Lesson info -->
                <div class="flex-1 min-w-0">
                  <span
                    class="text-sm transition-colors
                      {lesson.is_completed === 1
                        ? 'text-[var(--text-tertiary)] line-through'
                        : 'text-[var(--text-primary)]'}"
                  >
                    {lesson.name}
                  </span>
                </div>

                <!-- Duration -->
                {#if lesson.duration_minutes}
                  <span class="text-[10px] text-[var(--text-tertiary)] font-medium flex-shrink-0 tabular-nums">
                    {formatDuration(lesson.duration_minutes)}
                  </span>
                {/if}

                <!-- Notes button -->
                <button
                  type="button"
                  class="flex-shrink-0 p-1 rounded-[var(--radius-sm)] opacity-0 group-hover:opacity-100
                    transition-opacity hover:bg-[var(--bg-surface-raised)]
                    {lesson.notes ? 'text-[var(--text-accent)]' : 'text-[var(--text-tertiary)]'}"
                  onclick={(e) => { e.stopPropagation(); openNotes(lesson); }}
                  aria-label="Lesson notes"
                >
                  <Icon icon={lesson.notes ? 'ph:note-fill' : 'ph:note'} class="text-sm" />
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Empty state for sections with no lessons -->
        {#if isExpanded && (!section.lessons || section.lessons.length === 0)}
          <div class="border-t border-[var(--border-subtle)] px-4 py-6 text-center">
            <Icon icon="ph:list-dashes" class="text-2xl text-[var(--text-tertiary)] mx-auto mb-1" />
            <p class="text-xs text-[var(--text-tertiary)]">No lessons in this section</p>
          </div>
        {/if}
      </div>
    {/each}

    <!-- Empty state for no sections -->
    {#if sections.length === 0}
      <div class="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-card)]
        px-6 py-12 text-center">
        <Icon icon="ph:books" class="text-4xl text-[var(--text-tertiary)] mx-auto mb-2" />
        <p class="text-sm font-medium text-[var(--text-secondary)]">No sections yet</p>
        <p class="text-xs text-[var(--text-tertiary)] mt-1">
          Add sections and lessons to track your course progress.
        </p>
      </div>
    {/if}
  </div>

  <!-- Notes modal overlay -->
  {#if editingNotes !== null}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-sm"
      onkeydown={(e) => { if (e.key === 'Escape') closeNotes(); }}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="absolute inset-0" onclick={closeNotes}></div>
      <div class="relative z-10 w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border-default)]
        bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xl)] animate-scale-in">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Icon icon="ph:note-pencil" class="text-base" />
            Lesson Notes
          </h3>
          <button
            type="button"
            class="p-1 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-surface-raised)] transition-colors"
            onclick={closeNotes}
          >
            <Icon icon="ph:x" class="text-base" />
          </button>
        </div>

        <textarea
          class="w-full h-32 rounded-[var(--radius-md)] border border-[var(--border-default)]
            bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)]
            placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none
            focus:border-[var(--border-active)]"
          placeholder="Add notes for this lesson..."
          bind:value={noteText}
        ></textarea>

        <div class="flex justify-end gap-2 mt-3">
          <button
            type="button"
            class="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[var(--text-secondary)]
              hover:bg-[var(--bg-surface-raised)] transition-colors"
            onclick={closeNotes}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-white
              bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] transition-colors"
            onclick={saveNotes}
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
