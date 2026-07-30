const { z } = require('zod');
const billingService = require('../services/billing.service');
const AppError = require('../errors/appError');

// 'APLUS' was missing, so every A+ purchase the app sent was rejected here with
// a 400 before it ever reached the service (which has always accepted it) —
// the plan looked bought client-side and was gone on the next reload.
const purchaseSchema = z.object({
  tier: z.enum(['GOLD', 'PLATINUM', 'FREE', 'APLUS']),
  period: z.enum(['mo', '6mo', 'yr']).optional(),
});

class BillingController {
  async purchasePremium(req, res, next) {
    try {
      const userId = req.user.userId;

      // Validate inputs
      const parseResult = purchaseSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const { tier, period } = parseResult.data;
      const result = await billingService.purchasePremium(userId, tier, period);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async activateBoost(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await billingService.activateBoost(userId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BillingController();
