(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Page loader ----------
     Shown by default (in HTML/CSS) on every page load; hidden here once
     a minimum duration has elapsed so it's always visible for "a few
     seconds" even on an instant local load. The very first page load of
     a browser session gets a longer 4s minimum (tracked via
     sessionStorage); every load after that — internal navigations, a
     refresh, a new tab on the same site — keeps the shorter 2s. Also
     re-shown just before any internal same-site navigation (a link to a
     different page, not just a same-page anchor), so the transition
     between pages carries the same cue instead of a blank flash. */
  var pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    var LOADER_SESSION_KEY = 'dbl_loader_seen';
    var isFirstLoad = true;
    try {
      isFirstLoad = !sessionStorage.getItem(LOADER_SESSION_KEY);
      sessionStorage.setItem(LOADER_SESSION_KEY, '1');
    } catch (err) {
      /* sessionStorage unavailable (private mode, etc.) — treat as first load */
    }

    var LOADER_MIN_MS = prefersReducedMotion ? 0 : (isFirstLoad ? 4000 : 2000);
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
      node.addEventListener('mouseenter', function () { openCard(node, i); });
      node.addEventListener('mouseleave', function () {
        if (activeIndex === i) closeCard();
      });
      node.addEventListener('focus', function () { openCard(node, i); });
      node.addEventListener('blur', function () {
        if (activeIndex === i) closeCard();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeCard);

    window.addEventListener('resize', layout, { passive: true });
  });

  /* ---------- Interactive globe (Our Lab section) ----------
     Canvas-drawn globe in DBL's palette (lime dots/arcs, white
     markers): a Fibonacci-sphere point cloud plus a chain of great-
     circle arcs starting at Miami and running through Latin America
     and on to Europe and Tokyo. Draggable via Pointer Events; auto-
     rotates when idle. prefers-reduced-motion stops the auto-rotate
     and the traveling pulse along each arc, but dragging still works. */
  var GLOBE_MARKERS = [
    { lat: 25.76, lng: -80.19, label: 'Miami' },
    { lat: 19.43, lng: -99.13, label: 'Mexico City' },
    { lat: 4.71, lng: -74.07, label: 'Bogotá' },
    { lat: -23.55, lng: -46.63, label: 'São Paulo' },
    { lat: 40.42, lng: -3.70, label: 'Madrid' },
    { lat: 41.90, lng: 12.50, label: 'Rome' },
    { lat: 51.51, lng: -0.13, label: 'London' },
    { lat: 35.68, lng: 139.69, label: 'Tokyo' }
  ];
  var GLOBE_CONNECTIONS = [
    { from: [25.76, -80.19], to: [19.43, -99.13] },
    { from: [19.43, -99.13], to: [4.71, -74.07] },
    { from: [4.71, -74.07], to: [-23.55, -46.63] },
    { from: [-23.55, -46.63], to: [40.42, -3.70] },
    { from: [40.42, -3.70], to: [41.90, 12.50] },
    { from: [41.90, 12.50], to: [51.51, -0.13] },
    { from: [51.51, -0.13], to: [35.68, 139.69] }
  ];

  function latLngToXYZ(lat, lng, radius) {
    var phi = ((90 - lat) * Math.PI) / 180;
    var theta = ((lng + 180) * Math.PI) / 180;
    return [
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    ];
  }

  function rotateY(x, y, z, angle) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    return [x * cos + z * sin, y, -x * sin + z * cos];
  }

  function rotateX(x, y, z, angle) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    return [x, y * cos - z * sin, y * sin + z * cos];
  }

  function projectPoint(x, y, z, cx, cy, fov) {
    var scale = fov / (fov + z);
    return [x * scale + cx, y * scale + cy];
  }

  function initGlobe(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var DOT_COLOR = 'rgba(225, 255, 60, ALPHA)';
    var ARC_COLOR = 'rgba(225, 255, 60, 0.45)';
    var MARKER_COLOR = 'rgba(255, 255, 255, 1)';
    var AUTO_ROTATE_SPEED = 0.0018;

    // Starting orientation: Miami centered and facing the viewer, with
    // Mexico City/Bogota/Sao Paulo fanning up-left and the Madrid/Rome/
    // London cluster low on the left edge — matches the requested first
    // frame — before the usual auto-rotation takes over.
    var rotY = 2.98, rotX = 0.46;
    var time = 0;
    var drag = { active: false, startX: 0, startY: 0, startRotY: 0, startRotX: 0 };
    var rafId = null;

    var dots = [];
    var numDots = 900;
    var goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (var i = 0; i < numDots; i++) {
      var theta = (2 * Math.PI * i) / goldenRatio;
      var phi = Math.acos(1 - (2 * (i + 0.5)) / numDots);
      dots.push([
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi)
      ]);
    }

    function draw() {
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (!w || !h) {
        rafId = window.requestAnimationFrame(draw);
        return;
      }
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var cx = w / 2, cy = h / 2;
      var radius = Math.min(w, h) * 0.4;
      var fov = 600;

      if (!drag.active && !prefersReducedMotion) rotY += AUTO_ROTATE_SPEED;
      if (!prefersReducedMotion) time += 0.015;

      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(225, 255, 60, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      var d, x, y, z, sxy, depthAlpha, dotSize;
      for (var j = 0; j < dots.length; j++) {
        d = dots[j];
        x = d[0] * radius; y = d[1] * radius; z = d[2] * radius;
        var rXd = rotateX(x, y, z, rotX);
        var rYd = rotateY(rXd[0], rXd[1], rXd[2], rotY);
        x = rYd[0]; y = rYd[1]; z = rYd[2];
        if (z > 0) continue;

        sxy = projectPoint(x, y, z, cx, cy, fov);
        depthAlpha = Math.max(0.08, 1 - (z + radius) / (2 * radius));
        dotSize = 0.8 + depthAlpha * 0.7;

        ctx.beginPath();
        ctx.arc(sxy[0], sxy[1], dotSize, 0, Math.PI * 2);
        ctx.fillStyle = DOT_COLOR.replace('ALPHA', depthAlpha.toFixed(2));
        ctx.fill();
      }

      GLOBE_CONNECTIONS.forEach(function (conn) {
        var p1 = latLngToXYZ(conn.from[0], conn.from[1], radius);
        var p2 = latLngToXYZ(conn.to[0], conn.to[1], radius);
        var r1 = rotateY.apply(null, rotateX(p1[0], p1[1], p1[2], rotX).concat(rotY));
        var r2 = rotateY.apply(null, rotateX(p2[0], p2[1], p2[2], rotX).concat(rotY));

        if (r1[2] > radius * 0.3 && r2[2] > radius * 0.3) return;

        var s1 = projectPoint(r1[0], r1[1], r1[2], cx, cy, fov);
        var s2 = projectPoint(r2[0], r2[1], r2[2], cx, cy, fov);

        var midX = (r1[0] + r2[0]) / 2, midY = (r1[1] + r2[1]) / 2, midZ = (r1[2] + r2[2]) / 2;
        var midLen = Math.sqrt(midX * midX + midY * midY + midZ * midZ) || 1;
        var arcHeight = radius * 1.25;
        var elev = [
          (midX / midLen) * arcHeight,
          (midY / midLen) * arcHeight,
          (midZ / midLen) * arcHeight
        ];
        var sc = projectPoint(elev[0], elev[1], elev[2], cx, cy, fov);

        ctx.beginPath();
        ctx.moveTo(s1[0], s1[1]);
        ctx.quadraticCurveTo(sc[0], sc[1], s2[0], s2[1]);
        ctx.strokeStyle = ARC_COLOR;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        var t = (Math.sin(time * 1.2 + conn.from[0] * 0.1) + 1) / 2;
        var tx = (1 - t) * (1 - t) * s1[0] + 2 * (1 - t) * t * sc[0] + t * t * s2[0];
        var ty = (1 - t) * (1 - t) * s1[1] + 2 * (1 - t) * t * sc[1] + t * t * s2[1];

        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fillStyle = MARKER_COLOR;
        ctx.fill();
      });

      GLOBE_MARKERS.forEach(function (marker) {
        var p = latLngToXYZ(marker.lat, marker.lng, radius);
        var rP = rotateY.apply(null, rotateX(p[0], p[1], p[2], rotX).concat(rotY));
        if (rP[2] > radius * 0.1) return;

        var s = projectPoint(rP[0], rP[1], rP[2], cx, cy, fov);
        var pulse = Math.sin(time * 2 + marker.lat) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(s[0], s[1], 4 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = MARKER_COLOR.replace('1)', (0.2 + pulse * 0.15).toFixed(2) + ')');
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s[0], s[1], 2.5, 0, Math.PI * 2);
        ctx.fillStyle = MARKER_COLOR;
        ctx.fill();

        if (marker.label) {
          ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fillText(marker.label, s[0] + 8, s[1] + 3);
        }
      });

      rafId = window.requestAnimationFrame(draw);
    }

    canvas.addEventListener('pointerdown', function (e) {
      drag.active = true;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.startRotY = rotY;
      drag.startRotX = rotX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag.active) return;
      var dx = e.clientX - drag.startX;
      var dy = e.clientY - drag.startY;
      rotY = drag.startRotY + dx * 0.005;
      rotX = Math.max(-1, Math.min(1, drag.startRotX + dy * 0.005));
    });
    canvas.addEventListener('pointerup', function () { drag.active = false; });
    canvas.addEventListener('pointercancel', function () { drag.active = false; });

    rafId = window.requestAnimationFrame(draw);
  }

  document.querySelectorAll('[data-globe]').forEach(initGlobe);
})();
