/* ================================================================
 * SHIPFORGE — Homepage Interactions (Tailwind Version)
 *
 * Zero dependencies. Progressive enhancement only.
 * The page works fully without JavaScript enabled.
 * All scroll listeners use { passive: true } for INP optimization.
 * ================================================================ */

(function () {
  'use strict';

  /* ================================================================
   * 1. MOBILE NAVIGATION
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
      mobileMenu.classList.remove('translate-y-full', 'opacity-0', 'invisible');
      mobileMenu.classList.add('translate-y-0', 'opacity-100', 'visible');
      document.body.style.overflow = 'hidden';

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
      mobileMenu.classList.add('translate-y-full', 'opacity-0', 'invisible');
      mobileMenu.classList.remove('translate-y-0', 'opacity-100', 'visible');
      document.body.style.overflow = '';
      hamburger.focus();
    }

    function toggleMenu() {
      if (isOpen) { closeMenu(); } else { openMenu(); }
    }

    hamburger.addEventListener('click', toggleMenu);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    var links = mobileMenu.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        if (isOpen) closeMenu();
      });
    }

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
   * ================================================================ */
  function initScrollHeader() {
    var nav = document.getElementById('site-nav');
    if (!nav) return;

    var ticking = false;
    var SCROLL_THRESHOLD = 50;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (window.scrollY > SCROLL_THRESHOLD) {
            nav.classList.add('shadow-sm', 'border-b-gray-200', 'dark:border-b-gray-700');
          } else {
            nav.classList.remove('shadow-sm', 'border-b-gray-200', 'dark:border-b-gray-700');
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ================================================================
   * 3. SCROLL ANIMATIONS
   * ================================================================ */
  function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('animate-visible');
            observer.unobserve(entries[i].target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    var elements = document.querySelectorAll('[data-animate]');
    for (var i = 0; i < elements.length; i++) {
      observer.observe(elements[i]);
    }
  }

  /* ================================================================
   * 4. THEME TOGGLE
   * ================================================================ */
  function initThemeToggle() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    var root = document.documentElement;
    var STORAGE_KEY = 'sf-theme';

    function getEffectiveTheme() {
      if (root.classList.contains('dark')) return 'dark';
      if (root.classList.contains('light')) return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
      toggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );

      /* Toggle icon visibility */
      var sunIcon = toggle.querySelector('.icon-sun');
      var moonIcon = toggle.querySelector('.icon-moon');
      if (sunIcon && moonIcon) {
        sunIcon.classList.toggle('hidden', theme === 'dark');
        moonIcon.classList.toggle('hidden', theme !== 'dark');
      }
    }

    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored === 'dark' || stored === 'light') applyTheme(stored);

    toggle.addEventListener('click', function () {
      var current = getEffectiveTheme();
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ================================================================
   * 5. STAT COUNTER ANIMATION
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
      var text = el.textContent || '';
      var suffix = text.replace(/[\d,.\s]/g, '');
      var DURATION = 2000;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var progress = Math.min(elapsed / DURATION, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(target * eased) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }
  }

  /* ================================================================
   * 6. CURRENT YEAR
   * ================================================================ */
  function initYear() {
    var el = document.getElementById('current-year');
    if (el) el.textContent = new Date().getFullYear();
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
