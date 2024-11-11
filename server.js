const express = require('express');
const client = require('./db'); 
const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
    try {
        
        await client.connect();
        console.log("Connected to MongoDB");

        const covidDb = client.db("covid");
        const casesCollection = covidDb.collection("cases");
        const deathsCollection = covidDb.collection("deaths");
        const vaccinationsCollection = covidDb.collection("vaccines");

       
        if ((await casesCollection.countDocuments({})) === 0) {
            console.log("No documents found in cases collection!");
        }
        if ((await deathsCollection.countDocuments({})) === 0) {
            console.log("No documents found in deaths collection!");
        }
        if ((await vaccinationsCollection.countDocuments({})) === 0) {
            console.log("No documents found in vaccinations collection!");
        }


        app.get('/api/covid-cases', async (req, res) => {
            try {
                const casesData = await casesCollection.find({}).toArray();
                console.log("Cases Data:", casesData); 
                res.json(casesData);
            } catch (error) {
                console.error("Error fetching COVID-19 cases:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Define API route for COVID-19 deaths data
        app.get('/api/covid-deaths', async (req, res) => {
            try {
                const deathsData = await deathsCollection.find({}).toArray();
                console.log("Deaths Data:", deathsData); // Log for debugging
                res.json(deathsData);
            } catch (error) {
                console.error("Error fetching COVID-19 deaths:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Define API route for COVID-19 vaccinations data
        app.get('/api/covid-vaccines', async (req, res) => {
            try {   
                const vaccinationsData = await vaccinationsCollection.find({}).toArray();
                console.log("Vaccinations Data:", vaccinationsData); // Log for debugging
                res.json(vaccinationsData);
            } catch (error) {
                console.error("Error fetching COVID-19 vaccinations:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
})();
