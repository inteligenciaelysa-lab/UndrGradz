/**
 * crush-dock.js — Crush swipe "dock": one bottom bar that slides between the
 * swipe action buttons and the app navigation (only while the Crush deck is on
 * screen). Swipe left/right on the bar to toggle; dots show which page you're on.
 * The global bottom nav is hidden while the deck is visible so there's only one
 * bar. Isolated on purpose — safe to remove by deleting this file + its <script>.
 */
(function () {
  'use strict';

  var pageB = null;

  function init() {
    var actions = document.getElementById('deck-action-bar');
    if (!actions || actions.__docked) return;
    actions.__docked = true;

    // Build the dock structure in place of the action bar.
    var dock = document.createElement('div');
    dock.className = 'crush-dock no-swipe-back';
    dock.id = 'crush-dock';

    var track = document.createElement('div');
    track.className = 'crush-dock-track';

    var pageA = document.createElement('div');
    pageA.className = 'crush-dock-page';

    pageB = document.createElement('div');
    pageB.className = 'crush-dock-page crush-dock-nav';

    actions.parentNode.insertBefore(dock, actions);
    pageA.appendChild(actions);          // page 1 = swipe action buttons
    track.appendChild(pageA);
    track.appendChild(pageB);            // page 2 = navigation
    dock.appendChild(track);

    var dots = document.createElement('div');
    dots.className = 'crush-dock-dots';
    dots.innerHTML = '<span class="on"></span><span></span>';
    dock.appendChild(dots);

    rebuildNav();
    setupSwipe(dock, track, dots);
    observeDeck(dock);
  }

  // Page 2: mirror the real bottom nav (clone keeps its icons/labels/badges),
  // then re-wire each button to navigate via sw(id, label).
  function rebuildNav() {
    if (!pageB) return;
    var src = document.getElementById('bot-inner');
    if (!src || !src.children.length) return;
    var clone = src.cloneNode(true);
    clone.id = 'crush-dock-navinner';
    Array.prototype.forEach.call(clone.querySelectorAll('.np'), function (b) {
      var id = (b.id || '').replace('np-', '');
      var lbl = (b.querySelector('.nl') || {}).textContent || '';
      b.id = 'dock-np-' + id;
      b.onclick = function () { if (typeof window.sw === 'function') window.sw(id, lbl); };
    });
    pageB.innerHTML = '';
    pageB.appendChild(clone);
  }

  function setupSwipe(dock, track, dots) {
    var startX = 0, dragging = false, moved = false, baseTx = 0, w = 0, navShown = false;

    function setState(nav, animate) {
      navShown = nav;
      track.style.transition = animate ? '' : 'none';
      track.style.transform = '';
      track.classList.toggle('show-nav', nav);
      var ds = dots.children;
      if (ds[0]) ds[0].classList.toggle('on', !nav);
      if (ds[1]) ds[1].classList.toggle('on', nav);
      if (!animate) { /* force no-anim frame */ void track.offsetWidth; track.style.transition = ''; }
    }

    dock.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX; w = dock.offsetWidth; baseTx = navShown ? -w : 0;
      dragging = true; moved = false;
      track.style.transition = 'none';
    });
    dock.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 8) { moved = true; try { dock.setPointerCapture(e.pointerId); } catch (_) {} }
      if (moved) {
        var tx = Math.max(-w, Math.min(0, baseTx + dx));
        track.style.transform = 'translateX(' + tx + 'px)';
      }
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      if (!moved) return;                 // it was a tap → let the click through
      var dx = e.clientX - startX;
      if (dx < -40) setState(true, true);
      else if (dx > 40) setState(false, true);
      else setState(navShown, true);
      track.style.transform = '';
    }
    dock.addEventListener('pointerup', end);
    dock.addEventListener('pointercancel', end);
    // Swallow the click that fires right after a real drag so a swipe doesn't
    // also trigger the button under your finger.
    dock.addEventListener('click', function (e) {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);
    // Tap the dots to jump.
    Array.prototype.forEach.call(dots.children, function (d, i) {
      d.style.cursor = 'pointer';
      d.addEventListener('click', function () { setState(i === 1, true); });
    });

    setState(false, false);
  }

  // Only treat the deck as "on" while its bar is actually on screen. This makes
  // the global nav come back automatically on every other tab/section.
  function observeDeck(dock) {
    if (!('IntersectionObserver' in window)) { document.body.classList.add('crush-deck-on'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          document.body.classList.add('crush-deck-on');
          rebuildNav();                   // refresh badges / mode each time
        } else {
          document.body.classList.remove('crush-deck-on');
        }
      });
    }, { threshold: 0.01 });
    io.observe(dock);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  } else {
    setTimeout(init, 0);
  }
})();
