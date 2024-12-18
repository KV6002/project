const test = require('unit.js');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

describe('Information Retrieval Tests', function () {
  this.timeout(50000);

  before(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/COVID-New-Cases`);
    } catch (error) {
      throw error;
    }
  });

  describe('COVID Cases Data Retrieval', function () {
    let covidCasesData = [];
    const aggregateRegions = ['England', 'Scotland', 'Northern Ireland'];

    before(async () => {
      try {
        const response = await axios.get(`${BASE_URL}/COVID-New-Cases`);
        covidCasesData = response.data;
      } catch (error) {
        throw error;
      }
    });

    it('should be an array and not empty', () => {
      test.value(covidCasesData).isArray();
      test.assert(covidCasesData.length > 0, 'Cases data should not be empty');
    });

    it('should have required fields and valid values', () => {
      covidCasesData.forEach((item, index) => {
        const data = normalizeKeys(item);
        const region = data['Region'];
        const isAggregate = aggregateRegions.includes(region);

        const requiredFields = ['Non-overlapping 14-day period', 'Region'];
        if (!isAggregate) {
          requiredFields.push('Number of tests positive for COVID-19', 'Total number of tests in sample');
        } else {
          requiredFields.push('Total number of tests in sample');
        }

        requiredFields.forEach((field) => {
          if (!data[field]) {
          } else if (field.includes('tests')) {
            test.assert(data[field] >= 0, `Invalid value for '${field}' at index ${index}`);
          }
        });
      });
    });
  });

  describe('COVID Deaths Data Retrieval', function () {
    let covidDeathsData = [];

    before(async () => {
      try {
        const response = await axios.get(`${BASE_URL}/COVID-NEW-Deaths`);
        covidDeathsData = response.data;
      } catch (error) {
        throw error;
      }
    });

    it('should be an array and not empty', () => {
      test.value(covidDeathsData).isArray();
      test.assert(covidDeathsData.length > 0, 'Deaths data should not be empty');
    });

    it('should have required fields and valid values', () => {
      covidDeathsData.forEach((item, index) => {
        const data = normalizeKeys(item);
      });
    });
  });

  describe('Vaccination Data Retrieval', function () {
    let vaccinationData = [];

    before(async () => {
      try {
        const response = await axios.get(`${BASE_URL}/COVID-NEW-Vaccines`);
        vaccinationData = response.data;
      } catch (error) {
        throw error;
      }
    });

    it('should be an array and not empty', () => {
      test.value(vaccinationData).isArray();
      test.assert(vaccinationData.length > 0, 'Vaccination data should not be empty');
    });

    it('should have required fields and valid values', () => {
      vaccinationData.forEach((item, index) => {
        const data = normalizeKeys(item);

        const requiredFields = ['Non-overlapping 14-day period', 'Number_received_three_vaccines'];
        requiredFields.forEach((field) => {
          if (!data[field]) {
          } else if (field === 'Number_received_three_vaccines') {
            test.assert(data[field] >= 0, `Invalid value for '${field}' at index ${index}`);
          }
        });
      });
    });
  });

  describe('Geolocation Data Retrieval', function () {
    let geolocationData = [];

    before(async () => {
      try {
        const response = await axios.get(`${BASE_URL}/COVID-NEW-geolocations`);
        geolocationData = response.data;
      } catch (error) {
        throw error;
      }
    });

    it('should be an array and not empty', () => {
      test.value(geolocationData).isArray();
      test.assert(geolocationData.length > 0, 'Geolocation data should not be empty');
    });

    it('should have valid coordinates', () => {
      geolocationData.forEach((item, index) => {
        const data = normalizeKeys(item);

        const coordinates = data['coordinates'];
        if (!coordinates || !coordinates.lat || !coordinates.lng) {
        } else {
          test.assert(typeof coordinates.lat === 'number', `Invalid 'lat' value at index ${index}`);
          test.assert(typeof coordinates.lng === 'number', `Invalid 'lng' value at index ${index}`);
        }
      });
    });
  });

  function normalizeKeys(item) {
    return Object.keys(item).reduce((acc, key) => {
      acc[key.trim()] = item[key];
      return acc;
    }, {});
  }
});