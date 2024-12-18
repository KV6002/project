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
    const casesCollection = client.db("COVID-New").collection("Cases");
    const { date } = req.query;

    const query = date
      ? { "Non-overlapping 14-day period": new RegExp(date, "i") }
      : {};

    const casesData = await casesCollection.find(query).toArray();
    res.status(200).json(casesData);
  } catch (error) {
    console.error("Error fetching COVID-19 cases:", error);
    res.status(500).send("Internal Server Error");
  }
};