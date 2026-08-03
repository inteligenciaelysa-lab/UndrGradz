const geoService = require('../services/geo.service');

// Public country/state/city cascade for onboarding & event forms — no auth
// required since this data is needed before a session exists (sign up flow).
class GeoController {
  async getCountries(req, res, next) {
    try {
      res.status(200).json({ status: 'success', data: { countries: geoService.getCountries() } });
    } catch (error) {
      next(error);
    }
  }

  async getStates(req, res, next) {
    try {
      const { countryCode } = req.query;
      res.status(200).json({ status: 'success', data: { states: geoService.getStates(countryCode) } });
    } catch (error) {
      next(error);
    }
  }

  async getCities(req, res, next) {
    try {
      const { countryCode, stateCode } = req.query;
      res.status(200).json({ status: 'success', data: { cities: geoService.getCities(countryCode, stateCode) } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GeoController();
