/* ============================================================
   VOID v1.0 — behaviour layer

   Drop in after void.css. Everything here is optional: without it
   the light sits at its resting vector, menus and folds stay in
   whatever state their markup declares, and every component is
   still legible. Nothing in this file styles anything — it moves
   two numbers and toggles attributes.

   ONE rAF loop exists on the page. It is started by an activation,
   it is cancelled the moment the light settles and no registered
   frame wants another, and it is never started at all under
   prefers-reduced-motion. Zero CPU at rest is a requirement, not
   an optimisation.

   Markup contracts
     [data-menu]     > [data-menu-trigger] + .void-menu__panel
     [data-fold]     > .void-fold__head + .void-fold__panel
     [data-rail]     an element whose child <i> reports scroll position
     [data-scroller] a scroll region whose .void-group headers pin
     [data-reveal]   fires .is-revealed once, on entering the viewport

   Public API (window.Void)
     rest(deg | {x, y})   move the light's resting position
     wake()               start the loop if it is not running
     nudge(el, gain)      inject an impulse toward an element
     registerFrame(fn)    fn(dt) → truthy to keep the loop alive
     onLight(fn)          called after every write of --lx / --ly
     state()              { running, frames, x, y }
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* Tell the CSS a driver is present. Reveals hide themselves only
     when something exists to un-hide them. */
  root.setAttribute('data-void', 'on');

  /* ---------------------------------------------------------
     light — fixed rest, impulse on action, sleeps when settled
  --------------------------------------------------------- */

  var FIXED = { x: -0.22, y: 0.97 }; // y-up; --ly is written negated
  var STIFF = 0.14;
  var DAMP = 0.76;
  var EPS = 0.002;

  var light = { x: FIXED.x, y: FIXED.y, vx: 0, vy: 0 };
  var running = false;
  var last = 0;
  var frames = 0;

  var frameFns = [];
  var lightFns = [];
  var wakeFns = [];
  var sleepFns = [];

  function announce(list) {
    for (var i = 0; i < list.length; i++) list[i]();
  }

  function writeLight() {
    var m = Math.hypot(light.x, light.y) || 1;
    var lx = (light.x / m).toFixed(3);
    var ly = (-light.y / m).toFixed(3);
    root.style.setProperty('--lx', lx);
    root.style.setProperty('--ly', ly);
    for (var i = 0; i < lightFns.length; i++) lightFns[i](lx, ly);
  }

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    frames++;

    light.vx += (FIXED.x - light.x) * STIFF;
    light.vy += (FIXED.y - light.y) * STIFF;
    light.vx *= DAMP;
    light.vy *= DAMP;
    light.x += light.vx;
    light.y += light.vy;
    writeLight();

    var busy = false;
    for (var i = 0; i < frameFns.length; i++) {
      if (frameFns[i](dt)) busy = true;
    }

    var settled =
      Math.hypot(light.x - FIXED.x, light.y - FIXED.y) < EPS &&
      Math.hypot(light.vx, light.vy) < EPS;

    if (settled && !busy) {
      light.x = FIXED.x;
      light.y = FIXED.y;
      light.vx = light.vy = 0;
      writeLight();
      running = false;
      announce(sleepFns);
      return;
    }

    requestAnimationFrame(frame);
  }

  function wake() {
    if (reduced.matches || running) return;
    running = true;
    announce(wakeFns);
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function nudge(el, gain) {
    if (reduced.matches || !el) return;
    var r = el.getBoundingClientRect();
    var g = gain || 0.055;
    light.vx += (((r.left + r.width / 2) / innerWidth) * 2 - 1) * g;
    light.vy += -((((r.top + r.height / 2) / innerHeight) * 2 - 1)) * g;
    wake();
  }

  function rest(a) {
    if (typeof a === 'number') {
      var rad = (a * Math.PI) / 180;
      FIXED.x = Math.sin(rad);
      FIXED.y = Math.cos(rad);
    } else {
      FIXED.x = a.x;
      FIXED.y = a.y;
    }
    if (reduced.matches) {
      light.x = FIXED.x;
      light.y = FIXED.y;
      light.vx = light.vy = 0;
      writeLight();
    } else {
      wake();
    }
  }

  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest(
      'button, input, a, .void-row, .void-knob, .void-card, .void-disc, .void-fold__head',
    );
    if (el) nudge(el);
  });

  document.addEventListener('focusin', function (e) {
    if (e.target.matches('input, button, a')) nudge(e.target, 0.03);
  });

  /* ---------------------------------------------------------
     menus — one open at a time, full keyboard, focus returned
  --------------------------------------------------------- */

  var openMenu = null;

  function menuItems(menu) {
    return Array.prototype.slice.call(menu.querySelectorAll('.void-menu__item'));
  }

  function closeMenu(menu, focusTrigger) {
    if (!menu) return;
    menu.removeAttribute('data-open');
    var trigger = menu.querySelector('[data-menu-trigger]');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (openMenu === menu) openMenu = null;
    if (focusTrigger && trigger) trigger.focus();
  }

  function openMenuEl(menu) {
    if (openMenu && openMenu !== menu) closeMenu(openMenu, false);
    menu.setAttribute('data-open', '');
    var trigger = menu.querySelector('[data-menu-trigger]');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    openMenu = menu;
  }

  function moveWithin(items, from, delta) {
    if (!items.length) return;
    var i = items.indexOf(from);
    var next = i < 0 ? (delta > 0 ? 0 : items.length - 1) : (i + delta + items.length) % items.length;
    items[next].focus();
  }

  function initMenu(menu) {
    var trigger = menu.querySelector('[data-menu-trigger]');
    var panel = menu.querySelector('.void-menu__panel');
    if (!trigger || !panel) return;

    if (!panel.id) panel.id = 'void-menu-' + Math.random().toString(36).slice(2, 8);
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', panel.id);

    trigger.addEventListener('click', function () {
      if (menu.hasAttribute('data-open')) closeMenu(menu, false);
      else openMenuEl(menu);
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenuEl(menu);
        var items = menuItems(menu);
        if (items.length) items[e.key === 'ArrowDown' ? 0 : items.length - 1].focus();
      }
    });

    menu.addEventListener('keydown', function (e) {
      var items = menuItems(menu);
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeMenu(menu, true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveWithin(items, document.activeElement, 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveWithin(items, document.activeElement, -1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (items[0]) items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        if (items.length) items[items.length - 1].focus();
      } else if (e.key === 'Tab') {
        closeMenu(menu, false);
      }
    });

    menuItems(menu).forEach(function (item) {
      item.addEventListener('click', function () {
        /* single-select menus report the choice on their trigger */
        if (item.getAttribute('role') === 'menuitemradio') {
          menuItems(menu).forEach(function (other) {
            other.setAttribute('aria-checked', String(other === item));
          });
          var label = trigger.querySelector('[data-menu-value]');
          if (label) label.textContent = item.dataset.value || item.textContent.trim();
        }
        closeMenu(menu, true);
      });
    });
  }

  document.addEventListener('pointerdown', function (e) {
    if (openMenu && !openMenu.contains(e.target)) closeMenu(openMenu, false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openMenu) closeMenu(openMenu, true);
  });

  /* ---------------------------------------------------------
     folds — a disclosure whose panel is a well
  --------------------------------------------------------- */

  function initFold(fold) {
    var head = fold.querySelector('.void-fold__head');
    var panel = fold.querySelector('.void-fold__panel');
    if (!head || !panel) return;

    if (!panel.id) panel.id = 'void-fold-' + Math.random().toString(36).slice(2, 8);
    head.setAttribute('aria-controls', panel.id);
    head.setAttribute('aria-expanded', String(fold.hasAttribute('data-open')));

    head.addEventListener('click', function () {
      var open = fold.toggleAttribute('data-open');
      head.setAttribute('aria-expanded', String(open));
      if (fold.dataset.foldGroup) {
        document
          .querySelectorAll('[data-fold][data-fold-group="' + fold.dataset.foldGroup + '"]')
          .forEach(function (other) {
            if (other === fold || !open) return;
            other.removeAttribute('data-open');
            var h = other.querySelector('.void-fold__head');
            if (h) h.setAttribute('aria-expanded', 'false');
          });
      }
    });
  }

  /* ---------------------------------------------------------
     scroll — readouts, not decoration

     The rail reports position; it does not animate on the way
     there. Writes are rAF-coalesced and skipped below a 0.4%
     delta, so a settled page writes nothing.
  --------------------------------------------------------- */

  function initRail(rail) {
    var target = rail.dataset.rail ? document.querySelector(rail.dataset.rail) : null;
    var queued = false;
    var lastP = -1;

    function read() {
      queued = false;
      var p;
      if (target) {
        p = target.scrollTop / Math.max(1, target.scrollHeight - target.clientHeight);
      } else {
        var h = document.documentElement.scrollHeight - innerHeight;
        p = h > 0 ? scrollY / h : 0;
      }
      p = Math.min(1, Math.max(0, p));
      if (Math.abs(p - lastP) < 0.004) return;
      lastP = p;
      rail.style.setProperty('--p', p.toFixed(4));
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(read);
    }

    (target || window).addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    read();
  }

  /* A group header reports that it has pinned. One observer per
     scroller, no scroll handler, no per-frame work. */
  function initScroller(scroller) {
    var groups = scroller.querySelectorAll('.void-group');
    if (!groups.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var pinned = entry.intersectionRatio < 1 && entry.boundingClientRect.top <= entry.rootBounds.top + 1;
          entry.target.toggleAttribute('data-pinned', pinned);
        });
      },
      { root: scroller, threshold: [1], rootMargin: '0px 0px -100% 0px' },
    );

    groups.forEach(function (g) { io.observe(g); });
  }

  /* ---------------------------------------------------------
     reveal — the light finds an object, once
  --------------------------------------------------------- */

  function initReveals() {
    var nodes = document.querySelectorAll('[data-reveal]');
    if (!nodes.length) return;

    if (reduced.matches || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target); /* once, then never again */
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------------
     boot
  --------------------------------------------------------- */

  /* Reveals go first and every initialiser is isolated: this file hides
     [data-reveal] content the moment it announces itself, so a throw in
     an unrelated component must never be able to strand it. */
  function each(host, selector, fn) {
    host.querySelectorAll(selector).forEach(function (node) {
      try {
        fn(node);
      } catch (err) {
        if (window.console) console.error('[void] ' + selector, err);
      }
    });
  }

  function init(scope) {
    var host = scope || document;
    initReveals();
    each(host, '[data-menu]', initMenu);
    each(host, '[data-fold]', initFold);
    each(host, '[data-rail]', initRail);
    each(host, '[data-scroller]', initScroller);
  }

  window.Void = {
    rest: rest,
    wake: wake,
    nudge: nudge,
    init: init,
    registerFrame: function (fn) { frameFns.push(fn); },
    onWake: function (fn) { wakeFns.push(fn); },
    onSleep: function (fn) { sleepFns.push(fn); },
    onLight: function (fn) { lightFns.push(fn); fn(getComputedStyle(root).getPropertyValue('--lx'), getComputedStyle(root).getPropertyValue('--ly')); },
    state: function () { return { running: running, frames: frames, x: light.x, y: light.y }; },
  };

  writeLight();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();
