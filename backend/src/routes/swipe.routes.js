const { Router } = require('express');
const swipeController = require('../controllers/swipe.controller');
const adminService = require('../services/admin.service');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

// Public university catalog lookup for Student App
router.get('/universities', async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const universities = await adminService.getPublicUniversities({ q, limit });
    res.status(200).json({
      status: 'success',
      data: { universities },
    });
  } catch (error) {
    next(error);
  }
});

// Protect remaining campus routes
router.use(protect);

router.get('/crush-feed', swipeController.getFeed);
router.get('/stats', swipeController.getStats);
router.post('/views', swipeController.recordView);
router.get('/views', swipeController.getViews);
router.get('/admirers', swipeController.getAdmirers);
router.get('/sent-likes', swipeController.getSentLikes);
router.post('/swipe', swipeController.swipe);

module.exports = router;
