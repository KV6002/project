import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';

const cache = new NodeCache();

async function main() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('covid');

    async function getCoordinates(region) {
        if (!region) {
            console.error(`Invalid region: ${region}`);
            return null;
        }

        // Check cache first
        const cachedCoordinates = cache.get(region);
        if (cachedCoordinates) return cachedCoordinates;

        // Check database cache
        const cachedRegion = await db.collection('geolocations').findOne({ region });
        if (cachedRegion) {
            cache.set(region, cachedRegion.coordinates);
            return cachedRegion.coordinates;
        }

        // Fetch from external API
        try {
            const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(region)}&key=${process.env.OPENCAGE_API_KEY}`);
            const json = await response.json();

            if (!json.results || json.results.length === 0) {
                console.error(`No results found for region: ${region}`);
                return null;
            }

            const { lat, lng } = json.results[0].geometry;
            const coordinates = { lat, lng };

            // Cache in database and memory
            await db.collection('geolocations').insertOne({ region, coordinates });
            cache.set(region, coordinates);

            return coordinates;
        } catch (error) {
            console.error(`Error fetching coordinates for region ${region}:`, error);
            return null;
        }
    }

    async function processRegions() {
        const collections = ['cases', 'deaths', 'vaccines'];
        const regions = new Set();

        // Collect regions from all collections
        for (const collectionName of collections) {
            const collection = db.collection(collectionName);
            const distinctRegions = await collection.distinct(collectionName === 'vaccines' ? 'Sub-category' : 'Area of usual residence');
            distinctRegions.forEach(region => regions.add(region));
        }

        // Geocode regions
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