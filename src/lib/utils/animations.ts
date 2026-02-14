import gsap from 'gsap';

export function fadeIn(node: HTMLElement, duration = 0.25) {
  gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration, ease: 'power2.out' });
}

export function fadeOut(node: HTMLElement, duration = 0.2) {
  return gsap.to(node, { opacity: 0, duration, ease: 'power2.in' });
}

export function slideUp(node: HTMLElement, duration = 0.25) {
  gsap.fromTo(node,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration, ease: 'power2.out' }
  );
}

export function slideDown(node: HTMLElement, duration = 0.25) {
  gsap.fromTo(node,
    { opacity: 0, y: -8 },
    { opacity: 1, y: 0, duration, ease: 'power2.out' }
  );
}

export function scaleIn(node: HTMLElement, duration = 0.25) {
  gsap.fromTo(node,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration, ease: 'back.out(1.7)' }
  );
}

export function expandHeight(node: HTMLElement, duration = 0.3) {
  const height = node.scrollHeight;
  gsap.fromTo(node,
    { height: 0, opacity: 0, overflow: 'hidden' },
    { height, opacity: 1, duration, ease: 'power2.out', onComplete: () => { node.style.height = 'auto'; node.style.overflow = ''; } }
  );
}

export function collapseHeight(node: HTMLElement, duration = 0.25) {
  return gsap.to(node, {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    duration,
    ease: 'power2.in'
  });
}

export function staggerChildren(parent: HTMLElement, selector: string, duration = 0.3, stagger = 0.05) {
  gsap.fromTo(parent.querySelectorAll(selector),
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration, stagger, ease: 'power2.out' }
  );
}

export function cardHover(node: HTMLElement) {
  const enter = () => gsap.to(node, { scale: 1.02, boxShadow: '0 8px 25px rgba(0,0,0,0.1)', duration: 0.15, ease: 'power1.out' });
  const leave = () => gsap.to(node, { scale: 1, boxShadow: 'none', duration: 0.15, ease: 'power1.out' });
  node.addEventListener('mouseenter', enter);
  node.addEventListener('mouseleave', leave);
  return {
    destroy() {
      node.removeEventListener('mouseenter', enter);
      node.removeEventListener('mouseleave', leave);
    }
  };
}

export function springSettle(node: HTMLElement, x: number, y: number, duration = 0.4) {
  gsap.to(node, { x, y, duration, ease: 'elastic.out(1, 0.5)' });
}
