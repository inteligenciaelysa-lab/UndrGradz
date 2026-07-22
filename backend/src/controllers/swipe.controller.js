const swipeService = require('../services/swipe.service');
const { swipeSchema } = require('../validators/swipe.validator');
const AppError = require('../errors/appError');

class SwipeController {
  async getFeed(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const feed = await swipeService.getCrushFeed(userId);

      res.status(200).json({
        status: 'success',
        results: feed.length,
        data: {
          feed,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const stats = await swipeService.getStats(userId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordView(req, res, next) {
    try {
      const viewerId = req.user.userId || req.user.id;
      const targetId = req.body.targetId || req.body.viewedUserId || req.body.targetIdentifier;
      const result = await swipeService.recordView(viewerId, targetId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getViews(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const views = await swipeService.getViews(userId);

      res.status(200).json({
        status: 'success',
        data: {
          views,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdmirers(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const admirers = await swipeService.getAdmirers(userId);

      res.status(200).json({
        status: 'success',
        data: {
          admirers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSentLikes(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const sentLikes = await swipeService.getSentLikes(userId);

      res.status(200).json({
        status: 'success',
        data: {
          likes: sentLikes,
          sentLikes,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async swipe(req, res, next) {
    try {
      const senderId = req.user.userId || req.user.id;

      // Validate request body
      const parseResult = swipeSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const { receiverId, type } = parseResult.data;
      const swipeResult = await swipeService.registerSwipe(senderId, receiverId, type);

      res.status(200).json({
        status: 'success',
        data: swipeResult,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SwipeController();
