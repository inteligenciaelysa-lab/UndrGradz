const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

// Public mock upload endpoint (no protect middleware because it acts like real GCS signed url)
router.put('/me/photos/mock-upload-receiver', userController.mockUploadReceiver);

// Protect all other routes under /users
router.use(protect);

router.get('/search', userController.searchUsers);
router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.patch('/me/location', userController.updateLocation);
router.post('/me/photos', userController.addPhoto);
router.delete('/me/photos/:photoId', userController.deletePhoto);
router.patch('/me/ghost-mode', userController.updateGhostMode);
router.post('/me/verification-request', userController.submitVerificationRequest);
router.get('/me/verification-request', userController.getVerificationStatus);
router.get('/me/notifications', userController.getNotifications);
router.patch('/me/notifications/read-all', userController.markAllNotificationsRead);
router.patch('/me/notifications/:id/read', userController.markNotificationRead);

module.exports = router;
