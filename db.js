const { MongoClient } = require('mongodb');

// Load dotenv only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}

const uri = process.env.MONGODB_URI;

if (!uri || uri.trim().length === 0) {
  throw new Error('MONGODB_URI environment variable is not set.');
}

if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
  throw new Error('Invalid URI scheme. Expected "mongodb://" or "mongodb+srv://".');
}

const client = new MongoClient(uri);

module.exports = client;
