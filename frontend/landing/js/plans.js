/* ════════════════════════════════════════════════════════════════════════
   UNDRGRADZ — /plans interactions
   Plan selection + purchase flow: login (real UndrGradz account) -> fake
   card modal -> POST /billing/purchase -> success. Card details never leave
   this page as a real charge — see js/landing-auth.js for the client, and
   backend/src/services/payment/fakePaymentProvider.js for the swappable
   "charge" step.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var cards = document.querySelectorAll(".ap-plan");
  var cta = document.getElementById("apCta");
  if (!cards.length || !cta) return;

  var selectedPlan = {
    period: null,
    price: null,
    label: null,
  };

  function readPlanFromCard(card) {
    return {
      period: card.getAttribute("data-plan"),
      price: card.getAttribute("data-price"),
      label: card.getAttribute("data-price-label"),
      badge: (card.querySelector(".ap-plan-badge") || {}).textContent || "",
      title: (card.querySelector(".ap-plan-title") || {}).textContent || "",
      sub: (card.querySelector(".ap-plan-sub") || {}).textContent || "",
      hue: card.style.getPropertyValue("--hue"),
    };
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      cards.forEach(function (c) { c.classList.remove("selected"); });
      card.classList.add("selected");
      var plan = readPlanFromCard(card);
      selectedPlan = plan;
      cta.querySelector("span").textContent = "Get A+ · " + plan.label;
    });
  });

  var initiallySelected = document.querySelector(".ap-plan.selected") || cards[0];
  selectedPlan = readPlanFromCard(initiallySelected);

  // ── Modal helpers ────────────────────────────────────────────────────
  function showModal(overlay) { overlay.hidden = false; }
  function hideModal(overlay) { overlay.hidden = true; }

  var loginOverlay = document.getElementById("apLoginOverlay");
  var loginForm = document.getElementById("apLoginForm");
  var loginError = document.getElementById("apLoginError");

  var cardOverlay = document.getElementById("apCardOverlay");
  var cardForm = document.getElementById("apCardForm");
  var cardError = document.getElementById("apCardError");
  var summaryCard = document.getElementById("apCardSummary");
  var summaryBadge = document.getElementById("apSummaryBadge");
  var summaryTitle = document.getElementById("apSummaryTitle");
  var summaryPrice = document.getElementById("apSummaryPrice");
  var summarySave = document.getElementById("apSummarySave");
  var summaryPerMonth = document.getElementById("apSummaryPerMonth");

  var PERIOD_MONTHS = { mo: 1, "6mo": 6, yr: 12 };
  var PERIOD_LABEL = { mo: "1 Month", "6mo": "6 Months", yr: "12 Months" };

  var successOverlay = document.getElementById("apSuccessOverlay");

  [loginOverlay, cardOverlay, successOverlay].forEach(function (overlay) {
    if (!overlay) return;
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) hideModal(overlay);
    });
  });
  document.getElementById("apLoginClose").addEventListener("click", function () { hideModal(loginOverlay); });
  document.getElementById("apCardClose").addEventListener("click", function () { hideModal(cardOverlay); });
  document.getElementById("apSuccessClose").addEventListener("click", function () { hideModal(successOverlay); });

  function setError(el, message) {
    if (!message) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = message;
  }

  function setSubmitting(form, submitting) {
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = submitting;
    btn.style.opacity = submitting ? "0.6" : "";
  }

  // ── Step 0: start ────────────────────────────────────────────────────
  function startPurchase() {
    setError(loginError, "");
    setError(cardError, "");
    if (window.landingAuth.isLoggedIn()) {
      openCardModal();
    } else {
      showModal(loginOverlay);
    }
  }
  cta.addEventListener("click", startPurchase);

  // ── Step 1: login ────────────────────────────────────────────────────
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    setError(loginError, "");
    var email = loginForm.email.value.trim();
    var password = loginForm.password.value;
    setSubmitting(loginForm, true);
    try {
      await window.landingAuth.login(email, password);
      hideModal(loginOverlay);
      loginForm.reset();
      openCardModal();
    } catch (err) {
      setError(loginError, err.message || "Couldn't log in. Check your email and password.");
    } finally {
      setSubmitting(loginForm, false);
    }
  });

  // ── Step 2: fake card ────────────────────────────────────────────────
  function openCardModal() {
    var months = PERIOD_MONTHS[selectedPlan.period] || 1;
    var price = parseFloat(selectedPlan.price) || 0;

    summaryCard.style.setProperty("--hue", selectedPlan.hue || "var(--n-gold)");
    summaryBadge.textContent = selectedPlan.badge;
    summaryTitle.textContent = "A+ Student · " + (PERIOD_LABEL[selectedPlan.period] || selectedPlan.title);
    summaryPrice.textContent = selectedPlan.label;
    summarySave.textContent = selectedPlan.sub;
    if (months > 1) {
      summaryPerMonth.textContent = "Only $" + (price / months).toFixed(2) + "/month";
      summaryPerMonth.hidden = false;
    } else {
      summaryPerMonth.hidden = true;
    }

    showModal(cardOverlay);
  }

  cardForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    setError(cardError, "");
    var cardNumber = cardForm.cardNumber.value.replace(/\s+/g, "");
    var expiry = cardForm.expiry.value.trim();
    var cvv = cardForm.cvv.value.trim();
    var cardholderName = cardForm.cardholderName.value.trim();

    if (!/^\d{12,19}$/.test(cardNumber)) { setError(cardError, "Enter a valid card number."); return; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { setError(cardError, "Expiry should look like MM/YY."); return; }
    if (!/^\d{3,4}$/.test(cvv)) { setError(cardError, "Enter a valid CVV."); return; }
    if (!cardholderName) { setError(cardError, "Enter the cardholder name."); return; }

    var fakeCard = { last4: cardNumber.slice(-4), expiry: expiry };

    setSubmitting(cardForm, true);
    try {
      await window.landingAuth.purchasePlan(selectedPlan.period, fakeCard);
      hideModal(cardOverlay);
      cardForm.reset();
      showModal(successOverlay);
    } catch (err) {
      setError(cardError, err.message || "Couldn't complete the purchase. Please try again.");
    } finally {
      setSubmitting(cardForm, false);
    }
  });
})();
