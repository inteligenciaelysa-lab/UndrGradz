const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');

const router = Router();

// Appeal routes identify the account by email alone (no password re-check —
// see appeal.service.js), so rate-limit them against enumeration/spam.
const appealLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    status: 'error',
    message: 'Too many appeal requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/appeal-status', appealLimiter, authController.appealStatus);
router.post('/appeal', appealLimiter, authController.appeal);

module.exports = router;
