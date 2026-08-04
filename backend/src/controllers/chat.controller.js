const chatService = require('../services/chat.service');
const AppError = require('../errors/appError');
const { validateImageDataUri } = require('../utils/dataUriImage');

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

      console.log(`[CHAT DEBUG BACKEND] GET /chats/${matchId}/messages received | userId: ${userId}`);

      const messages = await chatService.getMessages(
        userId,
        matchId
      );

      console.log(`[CHAT DEBUG BACKEND] GET /chats/${matchId}/messages returning ALL ${messages.length} messages`);

      res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
          messages,
        },
      });
    } catch (error) {
      console.error(`[CHAT DEBUG BACKEND ERROR] GET /chats/${req.params.matchId}/messages:`, error.message);
      next(error);
    }
  }

  async createMessage(req, res, next) {
    try {
      const userId = req.user.userId;
      const { matchId } = req.params;
      const { content, type, mediaUrl, duration } = req.body;

      if (type === 'IMAGE' && mediaUrl) {
        const result = validateImageDataUri(mediaUrl);
        if (!result.valid) {
          throw new AppError(result.reason, 400);
        }
      }

      console.log(`[CHAT DEBUG BACKEND] POST /chats/${matchId}/messages received | userId: ${userId} | content: "${content}"`);

      const message = await chatService.createMessage(
        userId,
        matchId,
        content,
        type,
        mediaUrl,
        duration
      );

      console.log(`[CHAT DEBUG BACKEND] DATABASE MESSAGE ID: ${message.id} | matchId: ${message.matchId} | senderId: ${message.senderId}`);

      // Broadcast via socket if available
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`room_${message.matchId}`).emit('messageReceived', message);
        }
      } catch(e) {}

      res.status(201).json({
        status: 'success',
        data: { message },
      });
    } catch (error) {
      console.error(`[CHAT DEBUG BACKEND ERROR] POST /chats/${req.params.matchId}/messages:`, error.message);
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

  async getAudioUploadUrl(req, res, next) {
    try {
      const userId = req.user.userId;
      const { matchId } = req.params;
      const { contentType } = req.body;

      const result = await chatService.getAudioUploadUrl(userId, matchId, contentType, req);

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
