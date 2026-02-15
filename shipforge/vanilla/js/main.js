/* ================================================================
 * SHIPFORGE — Homepage Interactions
 *
 * Zero dependencies. Progressive enhancement only.
 * The page works fully without JavaScript enabled.
 * All scroll listeners use { passive: true } for INP optimization.
 * ================================================================ */

(function () {
  'use strict';

  /* ================================================================
   * 1. MOBILE NAVIGATION
   *
   * Toggle mobile menu with proper ARIA states, body scroll lock,
   * focus trap, and Escape key handling.
   * ================================================================ */
  function initMobileNav() {
    var hamburger = document.querySelector('[aria-controls="mobile-menu"]');
    var mobileMenu = document.getElementById('mobile-menu');
    if (!hamburger || !mobileMenu) return;

    var isOpen = false;

    function openMenu() {
      isOpen = true;
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close navigation menu');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      /* Focus the first link after transition */
      var firstLink = mobileMenu.querySelector('a');
      if (firstLink) {
        setTimeout(function () { firstLink.focus(); }, 100);
      }
    }

    function closeMenu() {
      isOpen = false;
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open navigation menu');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      hamburger.focus();
    }

    function toggleMenu() {
      if (isOpen) { closeMenu(); } else { openMenu(); }
    }

    hamburger.addEventListener('click', toggleMenu);

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    });

    /* Close when a link is clicked */
    var links = mobileMenu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        if (isOpen) closeMenu();
      });
    }

    /* Focus trap inside the mobile menu */
    mobileMenu.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !isOpen) return;

      var focusable = mobileMenu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ================================================================
   * 2. SCROLL-LINKED HEADER
   *
   * Adds sf-nav--scrolled class for visual shrink + shadow.
   * Uses requestAnimationFrame to avoid forced reflow.
   * ================================================================ */
  function initScrollHeader() {
    var nav = document.querySelector('.sf-nav');
    if (!nav) return;

    var ticking = false;
    var SCROLL_THRESHOLD = 50;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (window.scrollY > SCROLL_THRESHOLD) {
            nav.classList.add('sf-nav--scrolled');
          } else {
            nav.classList.remove('sf-nav--scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); /* Set initial state */
  }

  /* ================================================================
   * 3. SCROLL ANIMATIONS (Intersection Observer)
   *
   * Elements with [data-animate] fade/slide in when they enter
   * the viewport. Skipped entirely if the user prefers reduced motion.
   * ================================================================ */
  function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('sf-animate--visible');
            observer.unobserve(entries[i].target);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    var elements = document.querySelectorAll('[data-animate]');
    for (var i = 0; i < elements.length; i++) {
      observer.observe(elements[i]);
    }
  }

  /* ================================================================
   * 4. THEME TOGGLE
   *
   * Toggles .dark / .light on <html>. Persists to localStorage.
   * Falls back to OS preference via prefers-color-scheme.
   * ================================================================ */
  function initThemeToggle() {
    var toggle = document.querySelector('.sf-nav__theme-toggle');
    if (!toggle) return;

    var root = document.documentElement;
    var STORAGE_KEY = 'sf-theme';

    function getEffectiveTheme() {
      if (root.classList.contains('dark')) return 'dark';
      if (root.classList.contains('light')) return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    function applyTheme(theme) {
      root.classList.remove('dark', 'light');
      root.classList.add(theme);

      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        /* localStorage may be unavailable (private browsing, etc.) */
      }

      toggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }

    /* Restore saved preference */
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    if (stored === 'dark' || stored === 'light') {
      applyTheme(stored);
    }

    toggle.addEventListener('click', function () {
      var current = getEffectiveTheme();
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ================================================================
   * 5. STAT COUNTER ANIMATION
   *
   * Animates numbers from 0 to their data-count value when they
   * scroll into view. Uses requestAnimationFrame with easeOutCubic.
   * Skipped if the user prefers reduced motion.
   * ================================================================ */
  function initCounters() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    var counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            animateCounter(entries[i].target);
            observer.unobserve(entries[i].target);
          }
        }
      },
      { threshold: 0.5 }
    );

    for (var i = 0; i < counters.length; i++) {
      observer.observe(counters[i]);
    }

    function animateCounter(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;

      /* Extract suffix like "+" or "%" from the text content */
      var text = el.textContent || '';
      var suffix = text.replace(/[\d,.\s]/g, '');
      var DURATION = 2000;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var progress = Math.min(elapsed / DURATION, 1);

        /* easeOutCubic */
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(target * eased) + suffix;

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      }

      window.requestAnimationFrame(step);
    }
  }

  /* ================================================================
   * 6. CURRENT YEAR (Footer copyright)
   * ================================================================ */
  function initYear() {
    var el = document.getElementById('current-year');
    if (el) {
      el.textContent = new Date().getFullYear();
    }
  }

  /* ================================================================
   * INITIALIZE
   * ================================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initScrollHeader();
    initScrollAnimations();
    initThemeToggle();
    initCounters();
    initYear();
  });
})();
