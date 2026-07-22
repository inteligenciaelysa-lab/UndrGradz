const chatService = require('../services/chat.service');
const AppError = require('../errors/appError');

class ChatController {
  async getToken(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await chatService.getChatToken(userId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req, res, next) {
    try {
      const userId = req.user.userId;
      const conversations = await chatService.getConversations(userId);

      res.status(200).json({
        status: 'success',
        results: conversations.length,
        data: {
          conversations,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const userId = req.user.userId;
      const { matchId } = req.params;
      const { limit } = req.query;

      const messages = await chatService.getMessages(
        userId,
        matchId,
        limit ? parseInt(limit, 10) : 50
      );

      res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
          messages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { partnerId } = req.body;

      if (!partnerId) {
        throw new AppError('partnerId is required', 400);
      }

      const result = await chatService.getOrCreateConversation(userId, partnerId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
