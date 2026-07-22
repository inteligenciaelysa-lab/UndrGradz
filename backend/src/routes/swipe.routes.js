const { Router } = require('express');
const swipeController = require('../controllers/swipe.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

// Protect all campus routes
router.use(protect);

router.get('/crush-feed', swipeController.getFeed);
router.get('/stats', swipeController.getStats);
router.post('/views', swipeController.recordView);
router.get('/views', swipeController.getViews);
router.get('/admirers', swipeController.getAdmirers);
router.get('/sent-likes', swipeController.getSentLikes);
router.post('/swipe', swipeController.swipe);

module.exports = router;
