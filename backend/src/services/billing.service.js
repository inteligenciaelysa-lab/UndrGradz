const prisma = require('../database/prisma');
const AppError = require('../errors/appError');

// Billing periods, longest last. The rank is what enforces "you may upgrade but
// not downgrade while your subscription is still running" — the tier alone
// ('APLUS') says nothing about which of the three plans you are on.
const PERIOD_RANK = { mo: 1, '6mo': 2, yr: 3 };
const PERIOD_DAYS = { mo: 30, '6mo': 180, yr: 365 };
const PERIOD_LABEL = { mo: '1 month', '6mo': '6 months', yr: '12 months' };

class BillingService {
  async purchasePremium(userId, tier, period) {
    if (!['GOLD', 'PLATINUM', 'FREE', 'APLUS'].includes(tier)) {
      throw new AppError('Invalid subscription tier', 400);
    }
    if (period && !PERIOD_RANK[period]) {
      throw new AppError('Invalid billing period', 400);
    }

    const current = await prisma.userProfile.findUnique({
      where: { userId },
      select: { subscriptionEnds: true, subscriptionPeriod: true },
    });

    const stillRunning = !!(current && current.subscriptionEnds && current.subscriptionEnds > new Date());
    const currentRank = (current && PERIOD_RANK[current.subscriptionPeriod]) || 0;

    // The downgrade guard. This is the real rule — the UI dims the lower cards,
    // but nothing stops a direct API call, so it is enforced here.
    if (tier !== 'FREE' && period && stillRunning && PERIOD_RANK[period] < currentRank) {
      throw new AppError(
        `You are on the ${PERIOD_LABEL[current.subscriptionPeriod]} plan until ` +
        `${current.subscriptionEnds.toISOString().slice(0, 10)}. You can upgrade to a longer ` +
        `plan, but not switch to a shorter one until the current one ends.`,
        409
      );
    }

    // Was hardcoded to 30 days for every plan, so buying the yearly plan bought
    // a month. Upgrading restarts the clock from today at the new duration.
    const durationDays = (period && PERIOD_DAYS[period]) || 30;
    const expiresAt = tier === 'FREE' ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const nextPeriod = tier === 'FREE' ? null : (period || (current && current.subscriptionPeriod) || null);

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        subscriptionTier: tier,
        subscriptionEnds: expiresAt,
        subscriptionPeriod: nextPeriod,
        lastActive: new Date(),
      },
      create: {
        userId,
        subscriptionTier: tier,
        subscriptionEnds: expiresAt,
        subscriptionPeriod: nextPeriod,
        lastActive: new Date(),
      },
    });

    return {
      userId,
      subscriptionTier: profile.subscriptionTier,
      subscriptionEnds: profile.subscriptionEnds,
      subscriptionPeriod: profile.subscriptionPeriod,
    };
  }

  async activateBoost(userId) {
    const boostDurationMinutes = 30;
    const boostEndsAt = new Date(Date.now() + boostDurationMinutes * 60 * 1000);

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        boostEndsAt,
        lastActive: new Date(),
      },
      create: {
        userId,
        boostEndsAt,
        lastActive: new Date(),
      },
    });

    return {
      userId,
      boostEndsAt: profile.boostEndsAt,
    };
  }
}

module.exports = new BillingService();
