const { Router } = require('express');
const friendController = require('../controllers/friend.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

// Protect all network routes
router.use(protect);

router.post('/request', friendController.sendRequest);
router.post('/respond', friendController.respondRequest);
router.get('/', friendController.getFriends);
router.get('/pending', friendController.getPendingRequests);
router.get('/referrals', friendController.getReferrals);
router.post('/redeem-referral', friendController.redeemReferral);
router.get('/map', friendController.getFriendsLocations);

module.exports = router;
