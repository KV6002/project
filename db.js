// db.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.databaseConnection;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;

const connectToDatabase = async () => {
  try {
    if (!dbConnection) {
      await client.connect();
      dbConnection = client.db();
      console.log("Successfully connected to MongoDB.");
    }
    return dbConnection;
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
    process.exit(1); // exit the application if unable to connect
  }
};

module.exports = connectToDatabase;
 