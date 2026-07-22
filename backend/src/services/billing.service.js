const prisma = require('../database/prisma');
const AppError = require('../errors/appError');

class BillingService {
  async purchasePremium(userId, tier) {
    if (!['GOLD', 'PLATINUM', 'FREE', 'APLUS'].includes(tier)) {
      throw new AppError('Invalid subscription tier', 400);
    }

    const durationDays = 30;
    const expiresAt = tier === 'FREE' ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        subscriptionTier: tier,
        subscriptionEnds: expiresAt,
        lastActive: new Date(),
      },
      create: {
        userId,
        subscriptionTier: tier,
        subscriptionEnds: expiresAt,
        lastActive: new Date(),
      },
    });

    return {
      userId,
      subscriptionTier: profile.subscriptionTier,
      subscriptionEnds: profile.subscriptionEnds,
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
