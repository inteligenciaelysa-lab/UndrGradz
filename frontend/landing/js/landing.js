/* ════════════════════════════════════════════════════════════════════════
   UNDRGRADZ — Landing v3 interactions
   One rAF loop, transform/opacity only. Degrades under reduced motion.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ── Preloader ─────────────────────────────────────────────────────── */
  var loader = document.getElementById("loader");
  function dismissLoader() {
    if (!loader || loader.classList.contains("done")) return;
    loader.classList.add("done");
    document.body.classList.add("ready");
  }
  window.addEventListener("load", function () { setTimeout(dismissLoader, reduced ? 0 : 800); });
  setTimeout(dismissLoader, 2300); // hard cap — never hold the page hostage

  /* ── Manifesto: split into words ───────────────────────────────────── */
  var mani = document.getElementById("manifesto");
  var maniWords = [];
  if (mani) {
    (function splitWords(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span");
            w.className = "w";
            w.textContent = p;
            frag.appendChild(w);
            maniWords.push(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          splitWords(child);
        }
      });
    })(mani);
  }

  /* ── Marquees: duplicate tracks for a seamless loop ────────────────── */
  document.querySelectorAll("[data-marquee]").forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ── Reveal on scroll ──────────────────────────────────────────────── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var d = el.getAttribute("data-delay");
      if (d) el.style.setProperty("--d", d + "ms");
      el.classList.add("in");
      io.unobserve(el);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -5% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* footer mega rise */
  var megaWrap = document.getElementById("megaWrap");
  if (megaWrap) {
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { megaWrap.classList.add("in"); obs.disconnect(); }
      });
    }, { threshold: 0.3 }).observe(megaWrap);
  }

  /* ── Nav + single rAF scroll loop (parallax + manifesto) ───────────── */
  var nav = document.getElementById("nav");
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function update() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;

    nav.classList.toggle("scrolled", y > 30);

    if (!reduced) {
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var mid = r.top + r.height / 2 - vh / 2;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0;
        el.style.translate = "0 " + (mid * speed).toFixed(1) + "px";
      });
    }

    /* manifesto — light words up as the block crosses the viewport */
    if (maniWords.length) {
      var mr = mani.getBoundingClientRect();
      var prog = (vh * 0.8 - mr.top) / (mr.height + vh * 0.3);
      prog = Math.max(0, Math.min(1, prog));
      var lit = Math.floor(prog * maniWords.length);
      for (var i = 0; i < maniWords.length; i++) {
        maniWords[i].classList.toggle("on", i < lit || reduced);
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();

  /* ── Store cards: pointer spotlight + tilt ─────────────────────────── */
  document.querySelectorAll(".store-card").forEach(function (card) {
    card.addEventListener("pointermove", function (ev) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((ev.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((ev.clientY - r.top) / r.height) * 100 + "%");
      if (finePointer && !reduced) {
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateY(" + (px * 5).toFixed(2) + "deg)" +
          " rotateX(" + (-py * 5).toFixed(2) + "deg) translateY(-5px)";
      }
    });
    card.addEventListener("pointerleave", function () { card.style.transform = ""; });
  });

  /* ── Footer wordmark shine follows the pointer ─────────────────────── */
  var megaLight = document.getElementById("megaLight");
  if (megaWrap && megaLight && finePointer && !reduced) {
    megaWrap.addEventListener("pointermove", function (ev) {
      var r = megaWrap.getBoundingClientRect();
      megaLight.style.setProperty("--fx", ((ev.clientX - r.left) / r.width) * 100 + "%");
      megaLight.style.setProperty("--fy", ((ev.clientY - r.top) / r.height) * 100 + "%");
    });
  }

  /* ── Store links: placeholders until the real URLs land ────────────── */
  document.querySelectorAll("[data-store]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (a.getAttribute("href") === "#") e.preventDefault();
    });
  });
})();
