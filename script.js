(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Page loader ----------
     Shown by default (in HTML/CSS) on every page load; hidden here once
     a minimum duration has elapsed so it's always visible for "a few
     seconds" even on an instant local load. Also re-shown just before
     any internal same-site navigation (a link to a different page, not
     just a same-page anchor), so the transition between pages carries
     the same cue instead of a blank flash. */
  var pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    var LOADER_MIN_MS = prefersReducedMotion ? 0 : 1400;
    var LOADER_NAV_DELAY_MS = prefersReducedMotion ? 0 : 350;

    window.setTimeout(function () {
      pageLoader.classList.add('page-loader--hidden');
    }, Math.max(0, LOADER_MIN_MS - performance.now()));

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      pageLoader.classList.remove('page-loader--hidden');
      window.setTimeout(function () {
        window.location.href = link.href;
      }, LOADER_NAV_DELAY_MS);
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Navbar scroll state ---------- */
  var navbar = document.getElementById('navbar');
  function onScroll() {
    if (!navbar) return;
    if (window.scrollY > 12) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu toggle ---------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primary-nav');

  function closeMenu() {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    primaryNav.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    if (!navToggle || !primaryNav) return;
    var isOpen = primaryNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  if (navToggle) {
    navToggle.addEventListener('click', toggleMenu);
  }

  if (primaryNav) {
    primaryNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- Scroll-reveal animations ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Build With Us form (backend pending — see setup comment in HTML) ---------- */
  var buildForm = document.getElementById('buildForm');
  if (buildForm) {
    buildForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: real users never fill this hidden field; bots that
      // auto-fill every input do. Silently drop the submission.
      var honeypot = buildForm.querySelector('input[name="website"]');
      if (honeypot && honeypot.value.trim() !== '') {
        buildForm.reset();
        return;
      }

      var submitBtn = buildForm.querySelector('button[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';
      var successText = buildForm.getAttribute('data-success-text') || originalText;
      if (submitBtn) {
        submitBtn.textContent = successText;
        submitBtn.disabled = true;
      }
      setTimeout(function () {
        buildForm.reset();
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }, 3200);
    });
  }

  /* ---------- Cookie consent banner ---------- */
  var cookieBanner = document.getElementById('cookieBanner');
  var cookieAccept = document.getElementById('cookieAccept');
  var COOKIE_CONSENT_KEY = 'dbl_cookie_consent';

  if (cookieBanner) {
    var hasConsent = false;
    try {
      hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
    } catch (err) {
      hasConsent = false;
    }
    if (!hasConsent) {
      cookieBanner.hidden = false;
    }
    if (cookieAccept) {
      cookieAccept.addEventListener('click', function () {
        try {
          localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        } catch (err) {
          /* localStorage unavailable (private mode, etc.) — banner will just show again next visit */
        }
        cookieBanner.hidden = true;
      });
    }
  }

  /* ---------- Chat placeholder (no live-chat account connected yet) ---------- */
  var chatToggle = document.getElementById('chatToggle');
  var chatPopover = document.getElementById('chatPopover');

  if (chatToggle && chatPopover) {
    chatToggle.addEventListener('click', function () {
      var isHidden = chatPopover.hidden;
      chatPopover.hidden = !isHidden;
      chatToggle.setAttribute('aria-expanded', String(isHidden));
    });

    document.addEventListener('click', function (e) {
      if (!chatPopover.hidden && !chatPopover.contains(e.target) && e.target !== chatToggle && !chatToggle.contains(e.target)) {
        chatPopover.hidden = true;
        chatToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !chatPopover.hidden) {
        chatPopover.hidden = true;
        chatToggle.setAttribute('aria-expanded', 'false');
        chatToggle.focus();
      }
    });
  }

  /* ---------- Orbital timeline (Process section) ----------
     Nodes are positioned every frame from a slowly-advancing angle;
     clicking a node opens its detail card just outside the ring, at
     the same angle as the node but a bit further from the hub, linked
     to it by a thin temporary line. Both card and line are re-anchored
     every frame while open, so they keep tracking the node as it
     drifts. Positions are plain inline transforms, so prefers-reduced-
     motion just skips the per-frame advance and leaves everything at
     its initial spot. */
  document.querySelectorAll('[data-orbital]').forEach(function (root) {
    var stage = root.querySelector('.orbital__stage');
    var nodes = Array.prototype.slice.call(root.querySelectorAll('.orbital__node'));
    var card = root.querySelector('[data-orbital-card]');
    var line = root.querySelector('[data-orbital-line]');
    if (!stage || !nodes.length || !card) return;

    var cardTitle = card.querySelector('.orbital__card-title');
    var cardQuestion = card.querySelector('.orbital__card-question');
    var cardText = card.querySelector('.orbital__card-text');
    var cardResult = card.querySelector('.orbital__card-result');
    var closeBtn = card.querySelector('[data-orbital-close]');

    var angle = -90;
    var activeIndex = -1;
    var rafId = null;

    function radius() {
      return stage.clientWidth <= 480 ? 130 : 190;
    }

    function nodeAngleRad(i) {
      var step = 360 / nodes.length;
      return ((angle + step * i) * Math.PI) / 180;
    }

    function layout() {
      var r = radius();
      nodes.forEach(function (node, i) {
        var rad = nodeAngleRad(i);
        var x = Math.cos(rad) * r;
        var y = Math.sin(rad) * r;
        node.style.transform = 'translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px)';
      });
      if (activeIndex !== -1) updateCardAnchor();
    }

    function updateCardAnchor() {
      var r = radius();
      var rad = nodeAngleRad(activeIndex);
      var nodeX = Math.cos(rad) * r;
      var nodeY = Math.sin(rad) * r;
      var cardR = r + (stage.clientWidth <= 480 ? 150 : 230);
      var cardX = Math.cos(rad) * cardR;
      var cardY = Math.sin(rad) * cardR;

      // Keep the card's own box from sliding too far past the stage's
      // edge — clamp its center within the stage bounds plus a margin.
      var half = card.offsetWidth / 2 || 130;
      var stageHalf = stage.clientWidth / 2;
      var limit = stageHalf + half + 12;
      var clampedX = Math.max(-limit, Math.min(limit, cardX));
      var clampedY = Math.max(-limit, Math.min(limit, cardY));

      card.style.transform = 'translate(calc(-50% + ' + clampedX.toFixed(2) + 'px), calc(-50% + ' + clampedY.toFixed(2) + 'px))';

      if (line) {
        var dx = clampedX - nodeX;
        var dy = clampedY - nodeY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var lineAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        line.style.width = dist.toFixed(2) + 'px';
        line.style.transform = 'translate(' + nodeX.toFixed(2) + 'px, ' + nodeY.toFixed(2) + 'px) rotate(' + lineAngleDeg.toFixed(2) + 'deg)';
      }
    }

    function tick() {
      angle += 0.035;
      layout();
      rafId = window.requestAnimationFrame(tick);
    }

    layout();
    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(tick);
    }

    function openCard(node, index) {
      activeIndex = index;
      nodes.forEach(function (n) { n.classList.remove('is-active'); });
      node.classList.add('is-active');
      cardTitle.textContent = node.getAttribute('data-title') || '';
      cardQuestion.textContent = node.getAttribute('data-question') || '';
      cardText.textContent = node.getAttribute('data-text') || '';
      cardResult.innerHTML = node.getAttribute('data-result') || '';
      card.hidden = false;
      if (line) line.hidden = false;
      updateCardAnchor();
    }

    function closeCard() {
      activeIndex = -1;
      nodes.forEach(function (n) { n.classList.remove('is-active'); });
      card.hidden = true;
      if (line) line.hidden = true;
    }

    nodes.forEach(function (node, i) {
      node.addEventListener('click', function () {
        if (activeIndex === i) {
          closeCard();
        } else {
          openCard(node, i);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeCard);

    window.addEventListener('resize', layout, { passive: true });
  });

})();
