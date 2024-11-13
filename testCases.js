const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection URI
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

async function testNumberOfTestsPositive() {
    try {
        await client.connect();

        // Connect to your database and collection
        const database = client.db('COVID-New');
        const collection = database.collection('Cases');

        // 1. Query documents with a specific number of positive tests
        const exactValueQuery = { "Number of tests positive for COVID-19": 268 };
        const exactResults = await collection.find(exactValueQuery).toArray();
        console.log("Documents with exactly 50 positive tests:");
        console.log(exactResults);

      
    } finally {
        await client.close();
    }
}

testNumberOfTestsPositive().catch(console.error);