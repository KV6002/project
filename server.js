const express = require('express');
const client = require('./db');
<<<<<<< Updated upstream
const NodeCache = require('node-cache');
const cache = new NodeCache();
const app = express();
const PORT = process.env.PORT || 3000;
=======
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
// http://localhost:3000/api/test-filter-cases?month=Jan&year=23 example to filter month year cases just change the value 
//http://localhost:3000/api/test-filter-deaths?month=Jan&year=23  example to filter month year
//http://localhost:3000/api/test-filter-vaccines?month=Jan&year=23  example to filter month year




app.use(cors());  // Enable CORS for all routes
>>>>>>> Stashed changes

(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const covidDb = client.db("covid");
        const casesCollection = covidDb.collection("cases");
        const deathsCollection = covidDb.collection("deaths");
        const vaccinationsCollection = covidDb.collection("vaccines");
<<<<<<< Updated upstream

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

        app.get('/api/covid-cases', async (req, res) => {
            try {
                const { date } = req.query;
                const query = date ? { Date: date } : {};
                const casesData = await casesCollection.find(query).toArray();
=======

        // Route to test filtering for cases
        app.get('/api/test-filter-cases', async (req, res) => {
            const { month, year } = req.query;
            if (!month || !year) {
                return res.status(400).json({ error: "Please provide month and year parameters." });
            }

            const formattedDate = `${month}-${year.slice(-2)}`;
            try {
                const casesData = await casesCollection.find({ Date: { $regex: formattedDate } }).toArray();
>>>>>>> Stashed changes
                res.json(casesData);
            } catch (error) {
                console.error("Error fetching COVID-19 cases:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
<<<<<<< Updated upstream
        
        app.get('/api/covid-deaths', async (req, res) => {
            try {
                const { date } = req.query;
                const query = date ? { Date: date } : {};
                const deathsData = await deathsCollection.find(query).toArray();
=======

        // Route to test filtering for deaths
        app.get('/api/test-filter-deaths', async (req, res) => {
            const { month, year } = req.query;
            if (!month || !year) {
                return res.status(400).json({ error: "Please provide month and year parameters." });
            }

            const formattedDate = `${month}-${year.slice(-2)}`;
            try {
                const deathsData = await deathsCollection.find({ Date: { $regex: formattedDate } }).toArray();
>>>>>>> Stashed changes
                res.json(deathsData);
            } catch (error) {
                console.error("Error fetching COVID-19 deaths:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
<<<<<<< Updated upstream
        
        app.get('/api/covid-vaccines', async (req, res) => {
            try {
                const { date } = req.query;
                const query = date ? { Date: date } : {};
                const vaccinationsData = await vaccinationsCollection.find(query).toArray();
=======

        // Route to test filtering for vaccinations
        app.get('/api/test-filter-vaccines', async (req, res) => {
            const { month, year } = req.query;
            if (!month || !year) {
                return res.status(400).json({ error: "Please provide month and year parameters." });
            }

            const formattedDate = `${month}-${year.slice(-2)}`;
            try {
                const vaccinationsData = await vaccinationsCollection.find({ Date: { $regex: formattedDate } }).toArray();
>>>>>>> Stashed changes
                res.json(vaccinationsData);
            } catch (error) {
                console.error("Error fetching COVID-19 vaccinations:", error);
                res.status(500).json({ error: "Internal Server Error" });
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