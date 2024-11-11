const express = require('express');
const client = require('./db');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all requests

(async () => {
    try {
        // Connect to MongoDB
        await client.connect();
        const db = client.db("covid");

        // Define collections
        const casesCollection = db.collection("cases");
        const deathsCollection = db.collection("deaths");
        const vaccinesCollection = db.collection("vaccines");
        const geolocationsCollection = db.collection("geolocations");

        // Route for COVID-19 cases
        app.get('/api/covid-cases', async (req, res) => {
            try {
                const casesData = await casesCollection.find().toArray();
                // Fetch and add coordinates for each case item
                const casesWithCoordinates = await Promise.all(casesData.map(async (caseItem) => {
                    const geoData = await geolocationsCollection.findOne({ region: caseItem["Area of usual residence"] });
                    return { ...caseItem, coordinates: geoData ? geoData.coordinates : null };
                }));
                res.json(casesWithCoordinates);
            } catch (error) {
                console.error("Error fetching cases:", error);
                res.status(500).json({ error: "Error fetching COVID-19 cases data" });
            }
        });

        // Route for COVID-19 deaths
        app.get('/api/covid-deaths', async (req, res) => {
            try {
                const deathsData = await deathsCollection.find().toArray();
                // Fetch and add coordinates for each death item
                const deathsWithCoordinates = await Promise.all(deathsData.map(async (deathItem) => {
                    const geoData = await geolocationsCollection.findOne({ region: deathItem["Area of usual residence"] });
                    return { ...deathItem, coordinates: geoData ? geoData.coordinates : null };
                }));
                res.json(deathsWithCoordinates);
            } catch (error) {
                console.error("Error fetching deaths:", error);
                res.status(500).json({ error: "Error fetching COVID-19 deaths data" });
            }
        });

        // Route for COVID-19 vaccines
        app.get('/api/covid-vaccines', async (req, res) => {
            try {
                const vaccinesData = await vaccinesCollection.find().toArray();
                // Fetch and add coordinates for each vaccine item
                const vaccinesWithCoordinates = await Promise.all(vaccinesData.map(async (vaccineItem) => {
                    const geoData = await geolocationsCollection.findOne({ region: vaccineItem["Sub-category"] });
                    return { ...vaccineItem, coordinates: geoData ? geoData.coordinates : null };
                }));
                res.json(vaccinesWithCoordinates);
            } catch (error) {
                console.error("Error fetching vaccines:", error);
                res.status(500).json({ error: "Error fetching COVID-19 vaccinations data" });
            }
        });

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
})();
