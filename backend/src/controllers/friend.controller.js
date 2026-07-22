const friendService = require('../services/friend.service');
const { friendRequestSchema, respondRequestSchema } = require('../validators/friend.validator');
const AppError = require('../errors/appError');

class FriendController {
  async sendRequest(req, res, next) {
    try {
      const senderId = req.user.userId;

      // Validate inputs
      const parseResult = friendRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const { receiverId } = parseResult.data;
      const result = await friendService.sendRequest(senderId, receiverId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async respondRequest(req, res, next) {
    try {
      const userId = req.user.userId;

      // Validate inputs
      const parseResult = respondRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const { senderId, accept } = parseResult.data;
      const result = await friendService.respondToRequest(userId, senderId, accept);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFriends(req, res, next) {
    try {
      const userId = req.user.userId;
      const friends = await friendService.getFriends(userId);

      res.status(200).json({
        status: 'success',
        results: friends.length,
        data: {
          friends,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingRequests(req, res, next) {
    try {
      const userId = req.user.userId;
      const requests = await friendService.getPendingRequests(userId);

      res.status(200).json({
        status: 'success',
        results: requests.length,
        data: {
          requests,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getReferrals(req, res, next) {
    try {
      const userId = req.user.userId;
      const referralData = await friendService.getReferralData(userId);

      res.status(200).json({
        status: 'success',
        data: referralData,
      });
    } catch (error) {
      next(error);
    }
  }

  async redeemReferral(req, res, next) {
    try {
      const userId = req.user.userId;
      const { referralCode } = req.body;
      const result = await friendService.redeemReferral(userId, referralCode);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFriendsLocations(req, res, next) {
    try {
      const userId = req.user.userId;
      const locations = await friendService.getFriendsLocations(userId);

      res.status(200).json({
        status: 'success',
        results: locations.length,
        data: {
          locations,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FriendController();
