import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

// Main function to establish MongoDB connection and process regions
async function main() {
    // Set up MongoDB client and connect
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('COVID-New');

    // Function to fetch coordinates for a given region
    async function getCoordinates(region) {
        // Check for cached coordinates in MongoDB
        const cachedRegion = await db.collection('geolocations').findOne({ region });
        if (cachedRegion) return cachedRegion.coordinates;

        // Modify query for better accuracy when querying OpenCage
        let query = region;
        if (region !== "England" && region !== "London") {
            query = `${region}, England`;
        }

        // Fetch coordinates from OpenCage API
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${process.env.OPENCAGE_API_KEY}`);
        const json = await response.json();

        // Handle case where no results are found
        if (!json.results || json.results.length === 0) {
            console.error(`No results found for region: ${query}`);
            return null;
        }

        // Extract and store coordinates in MongoDB
        const { lat, lng } = json.results[0].geometry;
        const coordinates = { lat, lng };
        await db.collection('geolocations').insertOne({ region, coordinates });

        return coordinates;
    }

    // Process specific regions from Excel file
    async function processRegions() {
        const regions = [
            "East Midlands", "East of England", "London", "North East", "North West",
            "South East", "South West", "West Midlands", "Yorkshire and The Humber"
        ];
        
        // Geocode each unique region
        const geocodedRegions = await Promise.all(regions.map(async (region) => {
            const coordinates = await getCoordinates(region);
            if (coordinates) { 
                return { region, coordinates };
            }
            return null;
        }));

        console.log("Geocoded Regions:", geocodedRegions.filter(Boolean));
    }

    // Run the processRegions function and close the MongoDB client
    await processRegions();
    await client.close();
}

// Run the main function
main().catch(console.error);