const { Router } = require('express');
const geoController = require('../controllers/geo.controller');

const router = Router();

// Public — used by the sign up flow (origin picker) before a session exists.
router.get('/countries', geoController.getCountries);
router.get('/states', geoController.getStates);
router.get('/cities', geoController.getCities);

module.exports = router;
