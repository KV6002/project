const { expect } = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const { writeToCSV } = require('../riskLevels/csvWriter'); // Import the writeToCSV function

describe('csvWriter', () => {
    const fileName = 'test.csv'; // Temporary file name for testing

    // Mock fs.writeFileSync to avoid actual file writing
    before(() => {
        sinon.stub(fs, 'writeFileSync');
    });

    after(() => {
        // Restore all sinon stubs to avoid issues with other tests
        sinon.restore();
    });

    it('should write data to a CSV file correctly', () => {
        const data = [
            { name: 'John', age: 30, city: 'New York' },
            { name: 'Jane', age: 25, city: 'London' },
        ];

        // Call the function to write data to CSV
        writeToCSV(data, fileName);

        // Prepare the expected CSV string
        const expectedCSV = 'name,age,city\nJohn,30,New York\nJane,25,London';

        // Check that writeFileSync was called with the correct parameters
        expect(fs.writeFileSync.calledOnce).to.be.true;
        expect(fs.writeFileSync.calledWith(fileName, expectedCSV, 'utf8')).to.be.true;
    });

    it('should throw an error if data is not an array of objects', () => {
        const invalidData = 'Invalid data'; // Invalid data type

        // Expect the function to throw an error
        expect(() => writeToCSV(invalidData, fileName)).to.throw('Data must be an array of objects');
    });

    it('should throw an error if data contains non-object elements', () => {
        const invalidData = [{ name: 'John' }, 'invalid string']; // Array with a non-object element

        // Expect the function to throw an error
        expect(() => writeToCSV(invalidData, fileName)).to.throw('Data must be an array of objects');
    });
});


