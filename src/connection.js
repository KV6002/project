// connection.js
const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://matt:northumbria@covid-data.8prc5.mongodb.net/';
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    // Select your database and collection
    const database = client.db('covid');
    const collection = database.collection('deaths');

    // Sample data manipulation (fetching all documents)
    const documents = await collection.find().toArray();
    console.log('All Documents:', documents);

  } finally {
    // Ensure the client is closed when done
    await client.close();
  }
}

run().catch(console.dir);
