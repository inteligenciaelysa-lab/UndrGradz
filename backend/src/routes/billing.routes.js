const { Router } = require('express');
const billingController = require('../controllers/billing.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

// Protect all billing routes
router.use(protect);

router.post('/purchase', billingController.purchasePremium);
router.post('/boost', billingController.activateBoost);

module.exports = router;
