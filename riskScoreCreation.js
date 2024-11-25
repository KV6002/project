const client = require('./db'); // script to connect to database
const KMeans = require('ml-kmeans'); // library for kmeans 
const fs = require('fs'); // library for writing csv file

async function fetchCasesData() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        // access cases data and remove rows where region is England
        const covidDb = client.db("COVID-New");
        const casesCollection = covidDb.collection("Cases");
        const casesData = await casesCollection.find({ Region: { $ne: "England" } }).toArray();

        // function to clean non-numerical case numbers
        function cleanCaseNumber(value) {
            if (value == null) return 0; 
            if (typeof value === 'number') return value; 
            if (typeof value === 'string') {
                return parseFloat(value.replace(/[^0-9.]/g, '')) || 0; 
            }
            return 0; 
        }

        // clean the case numbers in the data
        const cleanedCasesData = casesData.map(entry => ({
            ...entry,
            "Number of tests positive for COVID-19": cleanCaseNumber(entry["Number of tests positive for COVID-19"])
        }));

        return cleanedCasesData;

    } catch (error) {
        // throw error if problem occurs whilst fetching and cleaning data
        console.error("Error fetching and cleaning cases data:", error);
        throw error;
    } finally {
        await client.close();
    }
}

async function fetchVaccineData() {
    try {
        await client.connect();

        // connect to db and fetch all vaccine data
        const covidDb = client.db("COVID-New");
        const vaccinesCollection = covidDb.collection("Vaccines");
        const vaccinesData = await vaccinesCollection.find({}).toArray();
        return vaccinesData;

    } catch (error) { 
        // throw error if problem occurs whilst fetching vaccine data
        console.error("Error fetching vaccine data:", error);
        throw error;
    } finally {
        await client.close();
    }
}

async function fetchDeathsData() {
    try {
        // connect to db and fetch all deaths data as array
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

async function createInstances() {
    try {
        // fetch cleaned cases, vaccine, and deaths data
        const casesData = await fetchCasesData();
        const vaccinesData = await fetchVaccineData();
        const deathsData = await fetchDeathsData();

        // define population density values for each region
        const populationDensity = {
            "East Midlands": 345,
            "East of England": 430,
            "London": 5600,
            "North East": 200,
            "North West": 500,
            "South East": 600,
            "South West": 450,
            "West Midlands": 750,
            "Yorkshire and The Humber": 600
        };

        // map vaccine data for quick lookup by date and region
        const vaccineMap = {};
        vaccinesData.forEach(entry => {
            const key = `${entry["Non-overlapping 14-day period"]}_${entry.Region}`;
            vaccineMap[key] = {
                vaccines: entry.Number_received_three_vaccines || 0,
                population: entry.Population || 0
            };
        });

        // function to reformat date
        function reformatDate(dateString) {
            const dateParts = dateString.split(' '); 
            if (dateParts.length === 3) {
                return `${dateParts[1]} ${dateParts[2]}`; 
            }
            return dateString; 
        }

        // create a map for deaths data: track the least deaths by date and region
        const deathsMap = {};
        deathsData.forEach(entry => {
            if (entry.Sex === 'All people' && entry["Age group (years)"] === 'All ages') {
                const rawDate = entry["Non-overlapping 14-day period"];
                const region = entry.Region;
                const date = reformatDate(rawDate);
                const deaths = entry["Number of deaths"] || 0;

                // create a key based on the region and date
                const key = `${date}_${region}`;

                // if the key doesn't exist or the current entry has fewer deaths, update it
                if (!deathsMap[key] || deaths < deathsMap[key]) {
                    deathsMap[key] = deaths;
                }
            }
        });

        // create instances by combining cases, vaccines, deaths, and population density
        const instances = casesData
            .map(entry => {
                const rawDate = entry["Non-overlapping 14-day period"];
                const date = reformatDate(rawDate); 
                const region = entry.Region;
                const cases = entry["Number of tests positive for COVID-19"];

                // find the corresponding vaccine data
                const vaccineEntry = vaccineMap[`${rawDate}_${region}`];
                if (!vaccineEntry) return null; // Exclude if no corresponding vaccine data

                const { vaccines, population } = vaccineEntry;

                // find the corresponding death data and population density
                const deaths = deathsMap[`${date}_${region}`] || 0; // Use 0 if no deaths data is found
                const density = populationDensity[region] || 0; // Use 0 if no density is available

                // exclude entry if any required field is missing
                if (
                    cases === undefined || cases === null ||
                    vaccines === undefined || vaccines === null ||
                    population === undefined || population === null
                ) {
                    return null;
                }

                // return a complete instance with original data included for use later
                return {
                    date, // Reformatted date
                    region,
                    cases,
                    vaccines,
                    population,
                    deaths, 
                    density  
                };
            })
            .filter(instance => instance !== null); 
        return instances;

    } catch (error) {
        // throw error if any problem occurs
        console.error("Error creating instances:", error);
        throw error;
    }
}

function preprocessInstances(instances) {
    // preprocess each instance: Calculate percentages for cases, deaths, vaccines
    return instances.map(instance => {
        const { population, cases, deaths, vaccines } = instance;
        const casesPercentage = (cases / population) * 100 || 0;
        const deathsPercentage = (deaths / population) * 100 || 0;
        const vaccinesPercentage = (vaccines / population) * 100 || 0;

        // invert vaccines to lower the risk with higher vaccine numbers
        const invertedVaccines = 100 - vaccinesPercentage;

        // return the original structure with additional calculated fields
        return {
            ...instance,
            casesPercentage,
            deathsPercentage,
            vaccinesPercentage: invertedVaccines,
            cases,
            deaths,
            vaccines
        };
    });
}

function cleanPreprocessedData(preprocessedInstances) {
    // extract only the relevant fields for model input
    return preprocessedInstances.map(instance => {
        const { date, region, casesPercentage, deathsPercentage, vaccinesPercentage, density, cases, deaths, vaccines } = instance;

        return {
            date,               
            region,             
            casesPercentage,    
            deathsPercentage,   
            vaccinesPercentage, 
            density,             
            cases,
            deaths,
            vaccines
        };
    });
}

function normalizeData(instances) {
    // extract numeric features and keep track of non-numeric data
    const featuresOnly = instances.map(instance => {
        const { casesPercentage, deathsPercentage, vaccinesPercentage, density, cases, deaths, vaccines } = instance;

        // replace undefined or null values with 0 just in case 
        return [
            casesPercentage || 0,
            deathsPercentage || 0,
            vaccinesPercentage || 0,
            density || 0
        ];
    });

    // calculate min and max for each column
    const numFeatures = featuresOnly[0].length;
    const mins = Array(numFeatures).fill(Infinity);
    const maxs = Array(numFeatures).fill(-Infinity);

    // calculate min and max for each feature
    featuresOnly.forEach(feature => {
        feature.forEach((value, index) => {
            if (value < mins[index]) mins[index] = value;
            if (value > maxs[index]) maxs[index] = value;
        });
    });

    // apply normalization
    const normalizedFeatures = featuresOnly.map(feature => {
        return feature.map((value, index) => {
            const min = mins[index];
            const max = maxs[index];

            // avoid division by zero if all values are the same
            return max === min ? 0 : (value - min) / (max - min);
        });
    });

    // reintegrate the normalized features with the original `date` and `region`
    const normalizedInstances = instances.map((instance, index) => {
        const { date, region, cases, deaths, vaccines } = instance; 
        const normalized = normalizedFeatures[index];

        return {
            date,
            region,
            casesPercentage: normalized[0],
            deathsPercentage: normalized[1],
            vaccinesPercentage: normalized[2],
            density: normalized[3],
            cases,
            deaths,
            vaccines
        };
    });

    return normalizedInstances;
}


async function applyKMeans(normalizedData) {
    // extract features for clustering
    const features = normalizedData.map(instance => [
        instance.casesPercentage,
        instance.deathsPercentage,
        instance.vaccinesPercentage,
        instance.density
    ]);

    // perform k-means clustering with k = 5
    const k = 5;
    const kmeansResult = KMeans.kmeans(features, k);

    // define and map risk categories corresponding to cluster labels
    const riskCategories = ['Very Low Risk', 'Low Risk', 'Medium Risk', 'High Risk', 'Very High Risk'];
    const clusters = kmeansResult.clusters;
    const categorizedData = normalizedData.map((instance, index) => {
        const cluster = clusters[index];
        const riskCategory = riskCategories[cluster];

        // return only the necessary fields with riskCategory
        return {
            date: instance.date,
            region: instance.region,
            cases: instance.cases,
            deaths: instance.deaths,
            vaccines: instance.vaccines,
            riskCategory
        };
    });

    return categorizedData;
}

async function writeToCSV() {
    // run all functions and return instances with only required data for addition to database
    const instances = await createInstances();
    const preinstances = preprocessInstances(instances);
    const cleaninstances = cleanPreprocessedData(preinstances);
    const norminstances = normalizeData(cleaninstances);
    const data = await applyKMeans(norminstances);

    // convert object into csv string
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), 
        ...data.map(item => headers.map(header => item[header]).join(',')), 
    ];
    const csvString = csvRows.join('\n');

    // write to csv file 
    fs.writeFileSync('riskScoreData.csv', csvString, 'utf8');
    console.log('CSV file has been written successfully.');
}

writeToCSV();