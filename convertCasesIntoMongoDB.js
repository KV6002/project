require("dotenv").config();
const { MongoClient } = require("mongodb");
const XLSX = require("xlsx");

// Use the MongoDB URI from .env
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function uploadExcelToMongoDB() {
  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db("COVID-New"); // Replace with your database name if different
    const collection = db.collection("Cases"); // Replace with the desired collection name

    // Load the Excel file
    const filePath = "casesRegion.xlsx"; // Replace with your Excel file path
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const data = XLSX.utils.sheet_to_json(sheet);

    // Insert data into MongoDB
    await collection.insertMany(data);
    console.log("Data uploaded successfully!");

  } catch (error) {
    console.error("Error uploading data:", error);
  } finally {
    await client.close();
  }
}

uploadExcelToMongoDB();