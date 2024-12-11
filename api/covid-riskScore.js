const client = require('../db');

module.exports = async (req, res) => {
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end(); 
    return;
  }

  try {
   
    await client.connect();
    const deathsCollection = client.db("COVID-New").collection("RiskLevels"); 
   
    const { date } = req.query;

   
    const query = date
      ? { date: { $regex: new RegExp(date, "i") } } 
      : {};

   
    const deathsData = await deathsCollection.find(query).toArray();

  
    res.status(200).json(deathsData);
  } catch (error) {
    console.error("Error fetching COVID-19 risk scores:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    
    await client.close();
  }
};