import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

async function main() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('covid');

    async function getCoordinates(region) {
        // Check MongoDB cache for existing coordinates
        const cachedRegion = await db.collection('geolocations').findOne({ region });
        if (cachedRegion) return cachedRegion.coordinates;

        // Modify query for better geocoding accuracy
        let query = region;
        if (region !== "England" && region !== "London") {
            query = `${region}, England`;
        }

        // Fetch coordinates from OpenCage API
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${process.env.OPENCAGE_API_KEY}`);
        const json = await response.json();

        // Check for results
        if (!json.results || json.results.length === 0) {
            console.error(`No results found for region: ${query}`);
            return null;
        }

        // Extract and cache coordinates in MongoDB
        const { lat, lng } = json.results[0].geometry;
        const coordinates = { lat, lng };
        await db.collection('geolocations').insertOne({ region, coordinates }); // Cache coordinates

        return coordinates;
    }

    async function processRegions() {
        const casesCollection = db.collection('cases');
        
        // Retrieve a sample document to extract fields for potential regions
        const sampleDocument = await casesCollection.findOne();
        console.log("Sample Document Fields:", Object.keys(sampleDocument));

        // Extract region names from field names
        const fieldNames = Object.keys(sampleDocument);
        const regions = new Set();

        fieldNames.forEach(field => {
            // Clean and parse field names to extract region names
            const cleanField = field.replace(/\n/g, " ").trim();
            const region = cleanField.replace(/ Modelled % testing positive for COVID-19| 95% Lower credible interval for percentage| 95% Upper credible interval for percentage/g, "").trim();
            
            if (region && !regions.has(region) && !['_id', 'Date'].includes(region)) {
                regions.add(region);
            }
        });

        console.log("Extracted Regions:", Array.from(regions));

        // Geocode each unique region and filter out null values
        const geocodedRegions = await Promise.all(Array.from(regions).map(async (region) => {
            const coordinates = await getCoordinates(region);
            if (coordinates) { 
                return { region, coordinates };
            }
            return null;
        }));

        console.log("Geocoded Regions:", geocodedRegions.filter(Boolean));
    }

    await processRegions();
    await client.close();
}

main().catch(console.error);
