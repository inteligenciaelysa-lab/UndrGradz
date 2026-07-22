const { Router } = require('express');
const eventController = require('../controllers/event.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

// Protect all event routes
router.use(protect);

router.post('/', eventController.createEvent);
router.get('/', eventController.getAllEvents);
router.post('/:eventId/join', eventController.joinEvent);
router.post('/:eventId/leave', eventController.leaveEvent);
router.put('/:eventId', eventController.updateEvent);
router.delete('/:eventId', eventController.deleteEvent);

module.exports = router;
