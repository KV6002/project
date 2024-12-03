// server.js

const express = require('express');
const client = require('./db'); // Ensure this db file is configured correctly for MongoDB
const cors = require('cors'); 
const app = express();
const PORT = 3000;

app.use(cors({ origin: 'http://127.0.0.1:5500' }));

(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const covidDb = client.db("COVID-New");
        const casesCollection = covidDb.collection("Cases");
        const deathsCollection = covidDb.collection("Deaths");
        const vaccinationsCollection = covidDb.collection("Vaccines");
        const geolocationsCollection = covidDb.collection("geolocations");
        // Debugging and API Response Verification
        app.get('/api/COVID-New-Cases', async (req, res) => {
            const { date } = req.query;
            console.log(`Fetching COVID cases for date: ${date}`);
            const query = date ? { "Non-overlapping 14-day period": new RegExp(date, "i") } : {};
            try {
                const casesData = await casesCollection.find(query).toArray();
                console.log(`Cases Data Retrieved:`, casesData); // Log data retrieved
                res.json(casesData);
            } catch (error) {
                console.error("Error fetching COVID-19 cases:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.get('/api/COVID-NEW-Deaths', async (req, res) => {
            const { date } = req.query;
            console.log(`Fetching COVID deaths for date: ${date}`);
            const query = date ? { "Non-overlapping 14-day period": new RegExp(date, "i") } : {};
            try {
                const deathsData = await deathsCollection.find(query).toArray();
                console.log(`Deaths Data Retrieved:`, deathsData); // Log data retrieved
                res.json(deathsData);
            } catch (error) {
                console.error("Error fetching COVID-19 deaths:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.get('/api/COVID-NEW-Vaccines', async (req, res) => {
            const { date } = req.query;
            console.log(`Fetching COVID vaccinations for date: ${date}`);
            const query = date ? { "Non-overlapping 14-day period": new RegExp(date, "i") } : {};
            try {
                const vaccinationsData = await vaccinationsCollection.find(query).toArray();
                console.log(`Vaccination Data Retrieved:`, vaccinationsData); // Log data retrieved
                res.json(vaccinationsData);
            } catch (error) {
                console.error("Error fetching COVID-19 vaccinations:", error);
                res.status(500).send("Internal Server Error");
            }
        });
        app.get('/api/COVID-NEW-geolocations', async (req, res) => {
            console.log("Fetching geolocations data");
        
            try {
                // Ensure we are querying the collection and then converting it to an array
                const geolocationsData = await geolocationsCollection.find({}).toArray();
                console.log("Geolocations Data Retrieved:", geolocationsData); // Log the retrieved data
                res.json(geolocationsData);
            } catch (error) {
                console.error("Error fetching Geolocations Data:", error);
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
