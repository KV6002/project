const { fetchCasesData, fetchVaccineData, fetchDeathsData } = require('./riskLevels/dbOperations');
const { createInstances, cleanCaseNumber, preprocessInstances, normalizeData } = require('./riskLevels/dataProcessing');
const { applyKMeans } = require('./riskLevels/clustering');
const { writeToCSV } = require('./riskLevels/csvWriter');

async function main() {
    try {
        const casesData = await fetchCasesData();
        const vaccinesData = await fetchVaccineData();
        const deathsData = await fetchDeathsData();

        // Data cleaning, preprocessing, and normalization
        const cleanedCasesData = casesData.map(entry => ({
            ...entry,
            "Number of tests positive for COVID-19": cleanCaseNumber(entry["Number of tests positive for COVID-19"]),
        }));

        const instances = createInstances(cleanedCasesData, vaccinesData, deathsData); // Define this utility if combining
        const preprocessedData = preprocessInstances(instances);
        const normalizedData = normalizeData(preprocessedData);

        // Apply clustering
        const clusteredData = await applyKMeans(normalizedData);

        // Write to CSV
        writeToCSV(clusteredData, 'riskScoreData.csv');
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
