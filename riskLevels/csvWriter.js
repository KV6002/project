const fs = require('fs');

function writeToCSV(data, fileName) {
    // Check if data is an array and all elements are objects
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array of objects');
    }

    if (data.length === 0) {
        // Handle empty data array case by creating an empty CSV
        fs.writeFileSync(fileName, '', 'utf8');
        return;
    }

    if (data.some(item => typeof item !== 'object' || item === null)) {
        throw new Error('Data must be an array of objects');
    }

    // Convert object into CSV string
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), 
        ...data.map(item => headers.map(header => item[header]).join(',')), 
    ];
    const csvString = csvRows.join('\n');

    // Write to CSV file
    fs.writeFileSync(fileName, csvString, 'utf8');
    console.log('CSV file has been written successfully.');
}

module.exports = {
    writeToCSV,
};

