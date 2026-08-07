const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

// Protect all chat routes
router.use(protect);

router.get('/token', chatController.getToken);
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);
router.get('/presence', chatController.getPresence);
router.get('/:matchId/messages', chatController.getMessages);
router.post('/:matchId/messages', chatController.createMessage);
router.post('/:matchId/audio-url', chatController.getAudioUploadUrl);

module.exports = router;
