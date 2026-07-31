const { Country, State, City } = require('country-state-city');

/**
 * Thin, stateless wrapper around the bundled country/state/city reference
 * data. Pure in-memory lookups — no Prisma, no audit logging — kept separate
 * from admin.service.js because it shares nothing with the rest of that file.
 */
class GeoService {
  getCountries() {
    return Country.getAllCountries().map(c => ({ name: c.name, isoCode: c.isoCode }));
  }

  getStates(countryCode) {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map(s => ({ name: s.name, isoCode: s.isoCode }));
  }

  getCities(countryCode, stateCode) {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map(c => ({ name: c.name }));
  }
}

module.exports = new GeoService();
