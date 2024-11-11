import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

async function main() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('covid'); 

    async function getCoordinates(region) {
        
        const cachedRegion = await db.collection('geolocations').findOne({ region });
        if (cachedRegion) return cachedRegion.coordinates;

        
        let query = region;
        if (region !== "England" && region !== "London") {
            query = `${region}, England`; 
        }

       
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${process.env.OPENCAGE_API_KEY}`);
        const json = await response.json();

        
        if (!json.results || json.results.length === 0) {
            console.error(`No results found for region: ${query}`);
            return null;
        }

        const { lat, lng } = json.results[0].geometry;

        const coordinates = { lat, lng };
        await db.collection('geolocations').insertOne({ region, coordinates }); // Cache coordinates

        return coordinates;
    }

    async function processRegions() {
        const casesCollection = db.collection('cases');
        
       
        const sampleDocument = await casesCollection.findOne();
        console.log("Sample Document Fields:", Object.keys(sampleDocument));


        const fieldNames = Object.keys(sampleDocument);
        const regions = new Set();

        fieldNames.forEach(field => {
        
            const cleanField = field.replace(/\n/g, " ").trim();
            const region = cleanField.replace(/ Modelled % testing positive for COVID-19| 95% Lower credible interval for percentage| 95% Upper credible interval for percentage/g, "").trim();
            
            if (region && !regions.has(region) && !['_id', 'Date'].includes(region)) {
                regions.add(region);
            }
        });

        console.log("Extracted Regions:", Array.from(regions));

        
        const geocodedRegions = await Promise.all(Array.from(regions).map(async (region) => {
            const coordinates = await getCoordinates(region);
            if (coordinates) { 
                return { region, coordinates };
            }
            return null;
        }));

        // Filter out null values
        console.log("Geocoded Regions:", geocodedRegions.filter(Boolean));
    }

    await processRegions();
    await client.close();
}

main().catch(console.error);