const client = require('../db');

module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end(); // Handle preflight requests
    return;
  }

  try {
    // Connect to the database
    await client.connect();
    const riskLevelsCollection = client.db("COVID-New").collection("RiskLevels"); // Updated collection name

    // Extract query parameters
    const { date } = req.query;

    // Build query for MongoDB
    const query = date
      ? { date: { $regex: new RegExp(date, "i") } } // Case-insensitive regex for matching date
      : {};

    // Fetch data from the database
    const riskLevelsData = await riskLevelsCollection.find(query).toArray();

    // Return data as JSON response
    res.status(200).json(riskLevelsData);
  } catch (error) {
    console.error("Error fetching COVID-19 risk scores:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Ensure the database connection is closed
    try {
      await client.close();
    } catch (closeError) {
      console.error("Error closing the database connection:", closeError.message);
    }
  }
};