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

        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(region)}&key=${process.env.OPENCAGE_API_KEY}`);
        const json = await response.json();
        if (!json.results || json.results.length === 0) {
            console.error(`No results found for region: ${region}`);
            return null;
        }

        const { lat, lng } = json.results[0].geometry;
        const coordinates = { lat, lng };
        await db.collection('geolocations').insertOne({ region, coordinates });
        return coordinates;
    }

    async function processRegions() {
        const casesCollection = db.collection('cases');
        const deathsCollection = db.collection('deaths');
        const vaccinesCollection = db.collection('vaccines');

        const regions = new Set();

        const casesRegions = await casesCollection.distinct("Area of usual residence");
        const deathsRegions = await deathsCollection.distinct("Area of usual residence");
        const vaccinesRegions = await vaccinesCollection.distinct("Sub-category");

        casesRegions.concat(deathsRegions, vaccinesRegions).forEach(region => regions.add(region));

        await Promise.all(Array.from(regions).map(async region => {
            if (region) {
                const coordinates = await getCoordinates(region);
                if (coordinates) {
                    console.log(`Geocoded ${region}:`, coordinates);
                }
            }
        }));
    }

    await processRegions();
    await client.close();
}

main().catch(console.error);
