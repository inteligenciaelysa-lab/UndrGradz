const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

// Protect all chat routes
router.use(protect);

router.get('/token', chatController.getToken);
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);
router.get('/:matchId/messages', chatController.getMessages);

module.exports = router;
