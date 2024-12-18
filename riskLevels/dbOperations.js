const client = require('../db'); // Database connection

async function fetchCasesData() {
    try {
        await client.connect();
        const covidDb = client.db("COVID-New");
        const casesCollection = covidDb.collection("Cases");
        const casesData = await casesCollection.find({ Region: { $ne: "England" } }).toArray();
        return casesData;
    } catch (error) {
        console.error("Error fetching cases data:", error);
        throw error;
    } finally {
        await client.close();
    }
}

async function fetchVaccineData() {
    try {
        await client.connect();
        const covidDb = client.db("COVID-New");
        const vaccinesCollection = covidDb.collection("Vaccines");
        const vaccinesData = await vaccinesCollection.find({}).toArray();
        return vaccinesData;
    } catch (error) {
        console.error("Error fetching vaccine data:", error);
        throw error;
    } finally {
        await client.close();
    }
}

async function fetchDeathsData() {
    try {
        await client.connect();
        const covidDb = client.db("COVID-New");
        const deathsCollection = covidDb.collection("Deaths");
        const deathsData = await deathsCollection.find({}).toArray();
        return deathsData;
    } catch (error) {
        console.error("Error fetching deaths data:", error);
        throw error;
    } finally {
        await client.close();
    }
}

module.exports = {
    fetchCasesData,
    fetchVaccineData,
    fetchDeathsData,
};
