/* ════════════════════════════════════════════════════════════════════════
   UNDRGRADZ — landing auth + billing client
   Minimal fetch wrapper so /plans can log in with a real UndrGradz account
   and buy A+ against the same backend the app uses. Independent of the app's
   own localStorage session — landing and app never need to share a session,
   the purchase just writes to the user's row in the DB, which the app reads
   on its own next `getMe()` call.
   ════════════════════════════════════════════════════════════════════════ */
(function (window) {
  "use strict";

  var HOST = window.location.hostname;
  var IS_LOCAL =
    HOST === "" ||
    HOST === "localhost" ||
    HOST === "127.0.0.1" ||
    /^192\.168\./.test(HOST) ||
    /^10\./.test(HOST) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(HOST);

  var BASE_URL = IS_LOCAL ? "http://" + (HOST || "localhost") + ":3000/api/v1" : "https://api.undrgradz.com/api/v1";
  var TOKEN_KEY = "ugz_landing_access_token";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function request(endpoint, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers["Content-Type"] = "application/json";
    var token = getToken();
    if (token) options.headers["Authorization"] = "Bearer " + token;

    var res = await fetch(BASE_URL + endpoint, options);
    var body = null;
    try { body = await res.json(); } catch (e) {}

    if (!res.ok) {
      var message = (body && body.message) || "Something went wrong. Please try again.";
      throw new Error(message);
    }
    return body;
  }

  async function login(email, password) {
    var result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email, password: password }),
    });
    if (result.data && result.data.accessToken) setToken(result.data.accessToken);
    return result.data;
  }

  /**
   * Charges a plan through whatever payment provider is wired server-side
   * (fake today, Stripe later) and marks the logged-in user as A+.
   * `card` is passed through as-is for the demo gateway to echo back a
   * last-4/expiry summary — the backend never persists the full number.
   */
  async function purchasePlan(period, card) {
    var result = await request("/billing/purchase", {
      method: "POST",
      body: JSON.stringify({ tier: "APLUS", period: period, payment: { provider: "FAKE", card: card } }),
    });
    return result.data;
  }

  window.landingAuth = {
    isLoggedIn: function () { return !!getToken(); },
    login: login,
    purchasePlan: purchasePlan,
    logout: clearToken,
  };
})(window);
