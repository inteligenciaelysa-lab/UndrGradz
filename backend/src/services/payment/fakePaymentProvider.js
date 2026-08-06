const crypto = require('crypto');

// Stand-in for a real payment gateway. Same shape a `stripePaymentProvider`
// would expose (`charge({ userId, plan, period, card }) -> { success, providerRef }`)
// so swapping providers later never touches billing.service.js's call site.
// Never persists the card number — only the last 4 digits/expiry it's handed.
class FakePaymentProvider {
  async charge({ userId, plan, period, card }) {
    return {
      success: true,
      providerRef: `FAKE-${crypto.randomUUID()}`,
    };
  }
}

module.exports = new FakePaymentProvider();
