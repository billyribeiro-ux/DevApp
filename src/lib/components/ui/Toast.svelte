<script lang="ts">
  import Icon from '@iconify/svelte';
  import gsap from 'gsap';
  import { toasts } from '$stores/app.svelte';
  import type { ToastMessage } from '$types';

  const typeConfig: Record<
    ToastMessage['type'],
    { icon: string; bgColor: string; borderColor: string; iconColor: string; progressColor: string }
  > = {
    success: {
      icon: 'ph:check-circle-fill',
      bgColor: 'var(--color-success-light)',
      borderColor: 'var(--color-success)',
      iconColor: 'var(--color-success)',
      progressColor: 'var(--color-success)',
    },
    error: {
      icon: 'ph:x-circle-fill',
      bgColor: 'var(--color-error-light)',
      borderColor: 'var(--color-error)',
      iconColor: 'var(--color-error)',
      progressColor: 'var(--color-error)',
    },
    warning: {
      icon: 'ph:warning-fill',
      bgColor: 'var(--color-warning-light)',
      borderColor: 'var(--color-warning)',
      iconColor: 'var(--color-warning)',
      progressColor: 'var(--color-warning)',
    },
    info: {
      icon: 'ph:info-fill',
      bgColor: 'var(--color-info-light)',
      borderColor: 'var(--color-info)',
      iconColor: 'var(--color-info)',
      progressColor: 'var(--color-info)',
    },
  };

  function animateIn(node: HTMLElement) {
    const tween = gsap.fromTo(
      node,
      { opacity: 0, x: 80, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }
    );
    return {
      destroy() {
        tween.kill();
      }
    };
  }

  function handleDismiss(id: string, node: HTMLElement) {
    gsap.to(node, {
      opacity: 0,
      x: 80,
      scale: 0.95,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => toasts.remove(id),
    });
  }
</script>

{#if toasts.toasts.length > 0}
  <div
    class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
    style="max-width: 380px; width: 100%;"
    aria-live="polite"
    aria-label="Notifications"
  >
    {#each toasts.toasts as toast (toast.id)}
      {@const config = typeConfig[toast.type]}
      <div
        class="pointer-events-auto rounded-xl overflow-hidden"
        style="
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          box-shadow: var(--shadow-lg);
        "
        role="alert"
        use:animateIn
      >
        <!-- Toast content -->
        <div class="flex items-start gap-3 px-4 py-3">
          <!-- Type icon -->
          <div class="shrink-0 mt-0.5">
            <Icon
              icon={config.icon}
              width={20}
              height={20}
              style="color: {config.iconColor};"
            />
          </div>

          <!-- Text content -->
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-semibold leading-snug"
              style="color: var(--text-primary);"
            >
              {toast.title}
            </p>
            {#if toast.description}
              <p
                class="text-xs mt-0.5 leading-relaxed"
                style="color: var(--text-secondary);"
              >
                {toast.description}
              </p>
            {/if}
          </div>

          <!-- Close button -->
          <button
            onclick={(e) => {
              const toastEl = (e.currentTarget as HTMLElement).closest('[role="alert"]') as HTMLElement;
              handleDismiss(toast.id, toastEl);
            }}
            class="shrink-0 flex items-center justify-center w-6 h-6 rounded-md transition-colors duration-150 cursor-pointer"
            style="color: var(--text-tertiary);"
            onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-raised)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
            aria-label="Dismiss notification"
          >
            <Icon icon="ph:x" width={14} height={14} />
          </button>
        </div>

        <!-- Progress bar -->
        <div
          class="h-[3px] w-full"
          style="background: var(--border-subtle);"
        >
          <div
            class="h-full toast-progress-bar"
            style="
              background: {config.progressColor};
              animation-duration: {toast.duration ?? 4000}ms;
            "
          ></div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes toast-progress-shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .toast-progress-bar {
    animation-name: toast-progress-shrink;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }
</style>
