require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGODB_URI);

app.use(cors()); // Enable CORS for all routes

(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("covid");
        const casesCollection = db.collection("cases");
        const deathsCollection = db.collection("deaths");
        const vaccinationsCollection = db.collection("vaccines");

        // Endpoint for COVID cases data
        app.get('/api/covid-cases', async (req, res) => {
            const { date, region } = req.query;
            const query = {};

            if (date) query.Date = new RegExp(date, "i"); // Filter by date
            if (region) query.Region = region; // Filter by exact region name

            try {
                const casesData = await casesCollection.find(query).toArray();
                res.json(casesData);
            } catch (error) {
                console.error("Error fetching COVID-19 cases:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Endpoint for COVID deaths data
        app.get('/api/covid-deaths', async (req, res) => {
            const { date, region } = req.query;
            const query = {};

            if (date) query.Date = new RegExp(date, "i"); // Filter by date
            if (region) query.Region = region; // Filter by exact region name

            try {
                const deathsData = await deathsCollection.find(query).toArray();
                res.json(deathsData);
            } catch (error) {
                console.error("Error fetching COVID-19 deaths:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Endpoint for COVID vaccinations data
        app.get('/api/covid-vaccines', async (req, res) => {
            const { date, region } = req.query;
            const query = {};

            if (date) query.Date = new RegExp(date, "i"); // Filter by date
            if (region) query.Region = region; // Filter by exact region name

            try {
                const vaccinesData = await vaccinationsCollection.find(query).toArray();
                res.json(vaccinesData);
            } catch (error) {
                console.error("Error fetching COVID-19 vaccinations:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
})();
