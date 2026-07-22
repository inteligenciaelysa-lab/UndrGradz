const eventService = require('../services/event.service');
const { createEventSchema } = require('../validators/event.validator');
const AppError = require('../errors/appError');

class EventController {
  async createEvent(req, res, next) {
    try {
      const creatorId = req.user.userId;

      // Validate inputs
      const parseResult = createEventSchema.safeParse(req.body);
      if (!parseResult.success) {
        const messages = parseResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(messages, 400);
      }

      const event = await eventService.createEvent(creatorId, parseResult.data);

      res.status(201).json({
        status: 'success',
        data: {
          event,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllEvents(req, res, next) {
    try {
      const events = await eventService.getAllEvents(req.user.userId);

      res.status(200).json({
        status: 'success',
        results: events.length,
        data: {
          events,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async joinEvent(req, res, next) {
    try {
      const userId = req.user.userId;
      const { eventId } = req.params;

      const result = await eventService.joinEvent(userId, eventId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async leaveEvent(req, res, next) {
    try {
      const userId = req.user.userId;
      const { eventId } = req.params;

      const result = await eventService.leaveEvent(userId, eventId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      const userId = req.user.userId;
      const { eventId } = req.params;

      const result = await eventService.deleteEvent(userId, eventId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const userId = req.user.userId;
      const { eventId } = req.params;

      const updated = await eventService.updateEvent(userId, eventId, req.body);

      res.status(200).json({
        status: 'success',
        data: { event: updated },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
