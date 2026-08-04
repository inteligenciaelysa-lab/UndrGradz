/* ════════════════════════════════════════════════════════════════════════
   UNDRGRADZ — /plans interactions
   Clicking a price card selects it and updates the CTA label. Visual only —
   no backend/payment calls.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var cards = document.querySelectorAll(".ap-plan");
  var cta = document.getElementById("apCta");
  if (!cards.length || !cta) return;

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      cards.forEach(function (c) { c.classList.remove("selected"); });
      card.classList.add("selected");
      cta.textContent = "Get A+ · " + card.getAttribute("data-price");
    });
  });
})();
