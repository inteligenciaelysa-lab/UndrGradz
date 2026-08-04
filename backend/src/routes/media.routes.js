const { Router } = require('express');
const mediaController = require('../controllers/media.controller');

const router = Router();

// Public — redirects to a signed URL of a private GCS object.
router.get('/', mediaController.getMedia);

module.exports = router;
