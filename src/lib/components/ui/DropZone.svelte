<script lang="ts">
  import Icon from '@iconify/svelte';
  import gsap from 'gsap';
  import type { Snippet } from 'svelte';

  let {
    onfiledrop,
    class_,
    children,
  }: {
    onfiledrop?: (files: File[]) => void;
    class_?: string;
    children?: Snippet;
  } = $props();

  let isDragOver = $state(false);
  let dropZoneEl: HTMLDivElement | undefined = $state();
  let dragCounter = $state(0);
  let pulseTween: gsap.core.Tween | null = null;

  function startPulse() {
    if (!dropZoneEl || pulseTween) return;
    pulseTween = gsap.to(dropZoneEl, {
      scale: 1.015,
      duration: 0.6,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  function stopPulse() {
    if (pulseTween) {
      pulseTween.kill();
      pulseTween = null;
    }
    if (dropZoneEl) {
      gsap.to(dropZoneEl, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
      });
    }
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (dragCounter === 1) {
      isDragOver = true;
      startPulse();
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      isDragOver = false;
      stopPulse();
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    isDragOver = false;
    stopPulse();

    if (!e.dataTransfer) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onfiledrop) {
      // Animate a brief "received" flash
      if (dropZoneEl) {
        gsap.fromTo(
          dropZoneEl,
          { borderColor: 'var(--color-primary-500)' },
          {
            borderColor: 'var(--border-default)',
            duration: 0.5,
            ease: 'power2.out',
          }
        );
      }
      onfiledrop(files);
    }
  }

  // Cleanup GSAP tween on component teardown
  $effect(() => {
    return () => {
      if (pulseTween) {
        pulseTween.kill();
        pulseTween = null;
      }
    };
  });
</script>

<div
  bind:this={dropZoneEl}
  class="relative rounded-xl transition-all duration-200 ease-in-out {class_ ?? ''}"
  class:dropzone-idle={!isDragOver}
  class:dropzone-active={isDragOver}
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="region"
  aria-label="File drop zone"
>
  {#if children}
    <div class={isDragOver ? 'opacity-30 pointer-events-none transition-opacity duration-200' : 'transition-opacity duration-200'}>
      {@render children()}
    </div>

    {#if isDragOver}
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl z-10">
        <div
          class="flex items-center justify-center w-14 h-14 rounded-2xl"
          style="background: var(--bg-active);"
        >
          <Icon
            icon="ph:upload-simple-fill"
            width={28}
            height={28}
            style="color: var(--color-primary-500);"
          />
        </div>
        <p
          class="text-sm font-semibold"
          style="color: var(--color-primary-500);"
        >
          Release to upload
        </p>
      </div>
    {/if}
  {:else}
    <div class="flex flex-col items-center justify-center gap-3 py-12 px-6">
      <div
        class="flex items-center justify-center w-14 h-14 rounded-2xl transition-colors duration-200"
        style="background: {isDragOver ? 'var(--bg-active)' : 'var(--bg-surface-raised)'};"
      >
        <Icon
          icon={isDragOver ? 'ph:upload-simple-fill' : 'ph:upload-simple'}
          width={28}
          height={28}
          style="color: {isDragOver ? 'var(--color-primary-500)' : 'var(--text-tertiary)'}; transition: color 200ms;"
        />
      </div>

      <div class="text-center">
        <p
          class="text-sm font-semibold transition-colors duration-200"
          style="color: {isDragOver ? 'var(--color-primary-500)' : 'var(--text-primary)'};"
        >
          {isDragOver ? 'Release to upload' : 'Drop files here'}
        </p>
        <p
          class="text-xs mt-1"
          style="color: var(--text-tertiary);"
        >
          or click to browse your files
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  .dropzone-idle {
    border: 2px dashed var(--border-default);
    background: transparent;
  }

  .dropzone-idle:hover {
    border-color: var(--border-active);
    background: var(--bg-surface-raised);
  }

  .dropzone-active {
    border: 2px dashed var(--color-primary-500);
    background: var(--bg-active);
  }
</style>
