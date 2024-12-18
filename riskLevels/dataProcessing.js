// Function to clean case numbers
function cleanCaseNumber(value) {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    }
    return 0;
}

// Function to create instances by combining cases, vaccines, and deaths data
function createInstances(casesData, vaccinesData, deathsData) {
    // Create a map for quick lookup of vaccine data
    const vaccineMap = vaccinesData.reduce((map, entry) => {
        const key = `${entry["Non-overlapping 14-day period"]}_${entry.Region}`;
        map[key] = {
            vaccines: entry.Number_received_three_vaccines || 0,
            population: entry.Population || 0,
        };
        return map;
    }, {});

    // Create a map for quick lookup of death data
    const deathsMap = deathsData.reduce((map, entry) => {
        if (entry.Sex === 'All people' && entry["Age group (years)"] === 'All ages') {
            const key = `${entry["Non-overlapping 14-day period"]}_${entry.Region}`;
            const deaths = entry["Number of deaths"] || 0;
            map[key] = deaths;
        }
        return map;
    }, {});

    // Population density values for each region
    const populationDensity = {
        "East Midlands": 345,
        "East of England": 430,
        "London": 5600,
        "North East": 200,
        "North West": 500,
        "South East": 600,
        "South West": 450,
        "West Midlands": 750,
        "Yorkshire and The Humber": 600,
    };

    // Combine cases, vaccines, and deaths into unified instances
    return casesData.map(entry => {
        const rawDate = entry["Non-overlapping 14-day period"];
        const region = entry.Region;
        const cases = entry["Number of tests positive for COVID-19"];

        // Find corresponding vaccine and death data
        const vaccineEntry = vaccineMap[`${rawDate}_${region}`];
        const deaths = deathsMap[`${rawDate}_${region}`] || 0;

        // Check for missing or invalid required fields: cases, vaccines, population
        if (!rawDate || !region || !cases || !vaccineEntry || !vaccineEntry.vaccines || !vaccineEntry.population) {
            return null; // Skip this instance if any essential data is missing or invalid
        }

        const { vaccines, population } = vaccineEntry;
        const density = populationDensity[region] || 0;

        // Skip instances with invalid or missing required fields (cases, vaccines, population)
        if (population <= 0 || cases <= 0 || vaccines <= 0) {
            return null; // Skip instances with invalid values
        }

        return {
            date: rawDate,
            region,
            cases,
            vaccines,
            population,
            deaths,
            density,
        };
    }).filter(instance => instance !== null); // Exclude null instances
}





// Function to preprocess instances by calculating percentages
function preprocessInstances(instances) {
    return instances.map(instance => {
        const { population, cases, deaths, vaccines } = instance;

        // Guard against division by zero or invalid population
        const casesPercentage = (population > 0 && cases) ? (cases / population) * 100 : 0;
        const deathsPercentage = (population > 0 && deaths) ? (deaths / population) * 100 : 0;
        const vaccinesPercentage = (population > 0 && vaccines) ? 100 - (vaccines / population) * 100 : 100; // Inverted to reflect risk reduction

        return {
            ...instance,
            casesPercentage,
            deathsPercentage,
            vaccinesPercentage,
        };
    });
}

// Function to clean preprocessed data, keeping only relevant fields
function cleanPreprocessedData(preprocessedInstances) {
    return preprocessedInstances.map(instance => ({
        date: instance.date,
        region: instance.region,
        casesPercentage: instance.casesPercentage,
        deathsPercentage: instance.deathsPercentage,
        vaccinesPercentage: instance.vaccinesPercentage,
        density: instance.density,
        cases: instance.cases,
        deaths: instance.deaths,
        vaccines: instance.vaccines,
    }));
}

// Function to normalize data for clustering
function normalizeData(instances) {
    const featuresOnly = instances.map(instance => [
        instance.casesPercentage || 0,
        instance.deathsPercentage || 0,
        instance.vaccinesPercentage || 0,
        instance.density || 0,
    ]);

    const numFeatures = featuresOnly[0].length;
    const mins = Array(numFeatures).fill(Infinity);
    const maxs = Array(numFeatures).fill(-Infinity);

    // Calculate min and max for each feature
    featuresOnly.forEach(feature => {
        feature.forEach((value, index) => {
            mins[index] = Math.min(mins[index], value);
            maxs[index] = Math.max(maxs[index], value);
        });
    });

    // Normalize the features
    const normalizedFeatures = featuresOnly.map(feature =>
        feature.map((value, index) => {
            const min = mins[index];
            const max = maxs[index];
            return max === min ? 0 : (value - min) / (max - min);
        })
    );

    // Reinstate normalized features into instances
    return instances.map((instance, index) => {
        const normalized = normalizedFeatures[index];
        return {
            ...instance,
            casesPercentage: normalized[0],
            deathsPercentage: normalized[1],
            vaccinesPercentage: normalized[2],
            density: normalized[3],
        };
    });
}

// Export all functions
module.exports = {
    cleanCaseNumber,
    createInstances,
    preprocessInstances,
    cleanPreprocessedData,
    normalizeData,
};



