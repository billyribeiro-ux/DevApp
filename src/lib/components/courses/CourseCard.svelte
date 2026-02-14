<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { Course } from '$types';
  import { getStatusColor } from '$utils/formatters';

  let {
    course,
    onselect,
  }: {
    course: Course;
    onselect: (id: string) => void;
  } = $props();

  const STATUS_LABELS: Record<Course['status'], string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    paused: 'Paused',
  };

  const STATUS_CLASSES: Record<Course['status'], string> = {
    not_started: 'bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)] dark:bg-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]',
    in_progress: 'bg-[var(--color-info-light)] text-[var(--color-info)] dark:bg-[rgba(59,130,246,0.15)] dark:text-[#60a5fa]',
    completed: 'bg-[var(--color-success-light)] text-[var(--color-success)] dark:bg-[rgba(34,197,94,0.15)] dark:text-[#4ade80]',
    paused: 'bg-[var(--color-warning-light)] text-[var(--color-warning)] dark:bg-[rgba(245,158,11,0.15)] dark:text-[#fbbf24]',
  };

  const PROGRESS_COLORS: Record<Course['status'], string> = {
    not_started: 'var(--color-neutral-400)',
    in_progress: 'var(--color-info)',
    completed: 'var(--color-success)',
    paused: 'var(--color-warning)',
  };

  let progressColor = $derived(PROGRESS_COLORS[course.status]);
  let statusLabel = $derived(STATUS_LABELS[course.status]);
  let statusClass = $derived(STATUS_CLASSES[course.status]);
  let clampedProgress = $derived(Math.min(100, Math.max(0, course.progress_percent)));

  // SVG progress ring calculations
  const RING_RADIUS = 20;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  let ringOffset = $derived(RING_CIRCUMFERENCE - (clampedProgress / 100) * RING_CIRCUMFERENCE);

  let ratingStars = $derived(
    Array.from({ length: 5 }, (_, i) => {
      if (!course.rating) return 'empty';
      if (i < Math.floor(course.rating)) return 'full';
      if (i < course.rating) return 'half';
      return 'empty';
    })
  );

  function handleClick() {
    onselect(course.id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onselect(course.id);
    }
  }
</script>

<button
  type="button"
  class="group w-full text-left rounded-[var(--radius-lg)] border border-[var(--border-default)]
    bg-[var(--bg-card)] p-4 transition-all duration-[var(--transition-fast)]
    hover:bg-[var(--bg-card-hover)] hover:shadow-[var(--shadow-md)]
    hover:border-[var(--border-active)] focus-visible:outline-2
    focus-visible:outline-[var(--color-primary-500)] focus-visible:outline-offset-2
    cursor-pointer"
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <!-- Top row: Progress ring + course info -->
  <div class="flex items-start gap-3">
    <!-- Progress ring -->
    <div class="relative flex-shrink-0">
      <svg width="52" height="52" viewBox="0 0 52 52" class="-rotate-90">
        <circle
          cx="26"
          cy="26"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--border-default)"
          stroke-width="4"
        />
        <circle
          cx="26"
          cy="26"
          r={RING_RADIUS}
          fill="none"
          stroke={progressColor}
          stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray={RING_CIRCUMFERENCE}
          stroke-dashoffset={ringOffset}
          class="transition-all duration-500 ease-out"
        />
      </svg>
      <span
        class="absolute inset-0 flex items-center justify-center text-[11px] font-semibold"
        style="color: {progressColor}"
      >
        {clampedProgress}%
      </span>
    </div>

    <!-- Course info -->
    <div class="min-w-0 flex-1">
      <h3 class="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
        {course.name}
      </h3>

      {#if course.instructor}
        <p class="mt-0.5 text-xs text-[var(--text-secondary)] truncate">
          {course.instructor}
        </p>
      {/if}

      <!-- Platform badge + status badge -->
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        {#if course.platform}
          <span class="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--bg-surface-raised)]
            px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
            <Icon icon="ph:monitor-play" class="text-xs" />
            {course.platform}
          </span>
        {/if}

        <span class="inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5
          text-[10px] font-semibold {statusClass}">
          {statusLabel}
        </span>
      </div>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="mt-3">
    <div class="flex items-center justify-between mb-1">
      <span class="text-[10px] text-[var(--text-tertiary)] font-medium">Progress</span>
      <span class="text-[10px] text-[var(--text-secondary)] font-semibold">
        {course.completed_lessons}/{course.total_lessons} lessons
      </span>
    </div>
    <div class="h-1.5 w-full rounded-full bg-[var(--bg-surface-raised)] overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        style="width: {clampedProgress}%; background-color: {progressColor}"
      ></div>
    </div>
  </div>

  <!-- Bottom row: Rating + lesson count -->
  <div class="mt-3 flex items-center justify-between">
    <!-- Star rating -->
    <div class="flex items-center gap-0.5">
      {#each ratingStars as star}
        {#if star === 'full'}
          <Icon icon="ph:star-fill" class="text-xs text-[var(--color-warning)]" />
        {:else if star === 'half'}
          <Icon icon="ph:star-half-fill" class="text-xs text-[var(--color-warning)]" />
        {:else}
          <Icon icon="ph:star" class="text-xs text-[var(--color-neutral-300)]" />
        {/if}
      {/each}
      {#if course.rating}
        <span class="ml-1 text-[10px] text-[var(--text-secondary)] font-medium">
          {course.rating.toFixed(1)}
        </span>
      {/if}
    </div>

    <!-- Lesson count -->
    <div class="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
      <Icon icon="ph:play-circle" class="text-xs" />
      <span>{course.total_lessons} lessons</span>
    </div>
  </div>
</button>
