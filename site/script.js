/* ============================================================
   EQUIL — site behaviour
   Shared across all pages. Every block guards for absent nodes.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Current year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Sticky header state ---------- */
  var header = document.getElementById('header');
  if (header) {
    var setScrolled = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () {
      setNav(!nav.classList.contains('open'));
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setNav(false);
    });
    // Reset when leaving the mobile breakpoint
    window.matchMedia('(min-width: 781px)').addEventListener('change', function (e) {
      if (e.matches) setNav(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.rv');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Stagger siblings for a softer cascade
        var parent = entry.target.parentElement;
        var siblings = parent ? Array.prototype.filter.call(parent.children, function (c) {
          return c.classList && c.classList.contains('rv');
        }) : [];
        var i = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
        entry.target.classList.add('in');
        revealIO.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var runCount = function (el) {
    var target = Number(el.dataset.count) || 0;
    var suffix = el.dataset.suffix || '';
    if (reduceMotion) {
      el.textContent = target.toLocaleString('ro-RO') + suffix;
      return;
    }
    var duration = 1500;
    var start = performance.now();
    var tick = function (now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ro-RO') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        countIO.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countIO.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------- Progress bars ---------- */
  var bars = document.querySelectorAll('.bar-fill[data-value]');
  if (bars.length) {
    if ('IntersectionObserver' in window) {
      var barIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.style.width = entry.target.dataset.value + '%';
          barIO.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      bars.forEach(function (el) { barIO.observe(el); });
    } else {
      bars.forEach(function (el) { el.style.width = el.dataset.value + '%'; });
    }
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    var panel = item.querySelector('.faq-a');
    if (!btn || !panel) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close siblings within the same .faq group
      var group = item.closest('.faq');
      if (group) {
        group.querySelectorAll('.faq-item.open').forEach(function (other) {
          if (other === item) return;
          other.classList.remove('open');
          var oBtn = other.querySelector('.faq-q');
          var oPanel = other.querySelector('.faq-a');
          if (oBtn) oBtn.setAttribute('aria-expanded', 'false');
          if (oPanel) oPanel.style.maxHeight = null;
        });
      }

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      panel.style.maxHeight = isOpen ? null : panel.scrollHeight + 'px';
    });
  });

  /* ---------- Forms (front-end only — no backend wired up) ---------- */
  document.querySelectorAll('[data-subscribe]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.value.trim()) return;
      var note = form.parentElement.querySelector('[data-subscribe-note]');
      if (note) note.textContent = 'Mulțumim — am trimis confirmarea la ' + input.value.trim() + '.';
      form.reset();
    });
  });

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      var ok = document.getElementById('formOk');
      if (ok) {
        ok.classList.add('show');
        ok.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      contactForm.reset();
    });
  }
})();
