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
    await client.connect();
    const deathsCollection = client.db("COVID-New").collection("Deaths");
    const { date } = req.query;

    const query = date
      ? { "Non-overlapping 14-day period": new RegExp(date, "i") }
      : {};

    const deathsData = await deathsCollection.find(query).toArray();
    res.status(200).json(deathsData);
  } catch (error) {
    console.error("Error fetching COVID-19 deaths:", error);
    res.status(500).send("Internal Server Error");
  }
};