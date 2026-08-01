const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = Router();

router.use(protect);

router.post('/', reportController.createReport);

module.exports = router;
