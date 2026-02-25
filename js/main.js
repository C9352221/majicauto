/* ══════════════════════════════════════════════════ */
/* Majic Auto — Main JavaScript                      */
/* ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Reduced Motion Check ──
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Mobile Detection ──
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

  // ══════════════════════════════════════
  // NAVBAR SCROLL TRANSITION
  // ══════════════════════════════════════
  const navbar = document.querySelector('.navbar');

  function handleNavScroll() {
    if (!navbar) return;
    const scrolled = window.scrollY > 50;
    navbar.classList.toggle('scrolled', scrolled);
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ══════════════════════════════════════
  // HAMBURGER MENU
  // ══════════════════════════════════════
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (mobileLinks.length > 0) {
      setTimeout(function () { mobileLinks[0].focus(); }, 100);
    }
  }

  function closeMenu() {
    menuOpen = false;
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    navToggle.focus();
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) {
        closeMenu();
      }
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Focus trap
    document.addEventListener('keydown', function (e) {
      if (!menuOpen || e.key !== 'Tab') return;

      var focusable = mobileMenu.querySelectorAll('a, button');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // ══════════════════════════════════════
  // SCROLL ANIMATIONS (IntersectionObserver)
  // ══════════════════════════════════════
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.fade-up').forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.fade-up').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ══════════════════════════════════════
  // PARALLAX — MOBILE FALLBACK
  // ══════════════════════════════════════
  if (isMobile) {
    document.querySelectorAll('.hero, .parallax-cta').forEach(function (el) {
      el.style.backgroundAttachment = 'scroll';
    });
  }

  // ══════════════════════════════════════
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ══════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = navbar ? navbar.offsetHeight + 20 : 20;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  // ══════════════════════════════════════
  // CONTACT FORM → GHL WEBHOOK
  // ══════════════════════════════════════
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    // ⚠️ REPLACE THIS with your deployed Cloudflare Worker URL
    var WORKER_URL = 'https://majic-contact.alfanoministries.workers.dev/';

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot check
      if (contactForm.querySelector('[name="_gotcha"]').value) return;

      var btn = document.getElementById('contactSubmitBtn');
      var status = document.getElementById('contactFormStatus');
      var originalText = btn.textContent;

      btn.disabled = true;
      btn.textContent = 'Sending...';
      status.style.display = 'none';

      var data = {
        first_name: contactForm.querySelector('[name="first_name"]').value.trim(),
        last_name: contactForm.querySelector('[name="last_name"]').value.trim(),
        email: contactForm.querySelector('[name="email"]').value.trim(),
        phone: contactForm.querySelector('[name="phone"]').value.trim(),
        service: contactForm.querySelector('[name="service"]').value,
        vehicle: contactForm.querySelector('[name="vehicle"]').value.trim(),
        message: contactForm.querySelector('[name="message"]').value.trim()
      };

      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed');
        status.textContent = 'Message sent! We\'ll get back to you within 24 hours.';
        status.style.display = 'block';
        status.style.background = '#d4edda';
        status.style.color = '#155724';
        contactForm.reset();
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Please call us or try again.';
        status.style.display = 'block';
        status.style.background = '#f8d7da';
        status.style.color = '#721c24';
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = originalText;
      });
    });
  }

})();
