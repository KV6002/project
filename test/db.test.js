const test = require('unit.js');

describe('Database Client', () => {
  const clearCache = () => {
    delete require.cache[require.resolve('../db')];
  };

  before(() => {
    // Set NODE_ENV to 'test' to bypass dotenv
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    clearCache();
  });

  it('should initialize MongoClient with the correct URI', () => {
    process.env.MONGODB_URI = 'mongodb://mockuri:27017/testdb';

    const client = require('../db');

    test.value(client.s.url).is('mongodb://mockuri:27017/testdb');
  });

  it('should throw an error if MONGODB_URI is missing', () => {
    delete process.env.MONGODB_URI;

    try {
      clearCache();
      require('../db');
      test.fail('Expected an error but none was thrown');
    } catch (error) {
      test.string(error.message).is('MONGODB_URI environment variable is not set.');
    }
  });

  it('should throw an error for an invalid URI scheme', () => {
    process.env.MONGODB_URI = 'http://invalid-scheme';

    try {
      clearCache();
      require('../db');
      test.fail('Expected an error but none was thrown');
    } catch (error) {
      test.string(error.message).is('Invalid URI scheme. Expected "mongodb://" or "mongodb+srv://".');
    }
  });
});
