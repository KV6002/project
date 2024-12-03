const express = require('express');
const client = require('./db');
const NodeCache = require('node-cache');
const cache = new NodeCache();
const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const covidDb = client.db("COVID-New");
        const casesCollection = covidDb.collection("Cases");
        const deathsCollection = covidDb.collection("Deaths");
        const vaccinationsCollection = covidDb.collection("Vaccines");

        if ((await casesCollection.countDocuments({})) === 0) {
            console.log("No documents found in cases collection!");
        }
        if ((await deathsCollection.countDocuments({})) === 0) {
            console.log("No documents found in deaths collection!");
        }
        if ((await vaccinationsCollection.countDocuments({})) === 0) {
            console.log("No documents found in vaccinations collection!");
        }

        const fetchData = async (collection, key) => {
            if (cache.has(key)) {
                return cache.get(key);
            }
            const data = await collection.find({}).toArray();
            cache.set(key, data);
            return data;
        };

        app.get('/api/COVID-New-Cases', async (req, res) => {
            try {
                const { date } = req.query;
                const query = date ? { Date: date } : {};
                const casesData = await casesCollection.find(query).toArray();
                res.json(casesData);
            } catch (error) {
                console.error("Error fetching COVID-19 cases:", error);
                res.status(500).send("Internal Server Error");
            }
        });
        
        app.get('/api/COVID-NEW-Deaths', async (req, res) => {
            try {
                const { date } = req.query;
                const query = date ? { Date: date } : {};
                const deathsData = await deathsCollection.find(query).toArray();
                res.json(deathsData);
            } catch (error) {
                console.error("Error fetching COVID-19 deaths:", error);
                res.status(500).send("Internal Server Error");
            }
        });
        
        app.get('/api/COVID-NEW-Vaccines', async (req, res) => {
            try {
                const { date } = req.query;
                const query = date ? { Date: date } : {};
                const vaccinationsData = await vaccinationsCollection.find(query).toArray();
                res.json(vaccinationsData);
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