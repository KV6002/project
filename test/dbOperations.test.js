const sinon = require('sinon');
const { expect } = require('chai');  // Ensure you import Chai for assertions
const dbOperations = require('../riskLevels/dbOperations'); // Path to your dbOperations.js file
const client = require('../db'); // MongoDB client module

describe('dbOperations', function() {
    let dbMock;
    let collectionMock;

    // This runs before each test
    beforeEach(() => {
        // Create mocks for MongoDB client, db, and collections
        collectionMock = {
            find: sinon.stub().returns({
                toArray: sinon.stub().resolves([]) // Mock toArray to return an empty array by default
            })
        };
        dbMock = {
            collection: sinon.stub().returns(collectionMock)
        };

        // Replace client.db() with our mock
        sinon.stub(client, 'db').returns(dbMock);
    });

    // This runs after each test to restore the original method
    afterEach(() => {
        sinon.restore();  // Restore the original db method
    });

    describe('fetchCasesData', function() {
        it('should fetch cases data correctly', async function() {
            // Prepare mock data for cases
            collectionMock.find.returns({
                toArray: sinon.stub().resolves([
                    { Region: 'North East', 'Number of tests positive for COVID-19': 100 }
                ])
            });

            const result = await dbOperations.fetchCasesData();

            // Assert that the returned data matches the expected structure
            expect(result).to.be.an('array').that.is.not.empty;
            expect(result[0].Region).to.equal('North East');
            expect(result[0]['Number of tests positive for COVID-19']).to.equal(100);
        });

        it('should handle errors and throw', async function() {
            // Simulate an error when calling toArray
            collectionMock.find.returns({
                toArray: sinon.stub().rejects(new Error('Database error'))
            });

            try {
                await dbOperations.fetchCasesData();
                // If we get here, the test should fail
                throw new Error('Test should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Database error');
            }
        });
    });

    describe('fetchVaccineData', function() {
        it('should fetch vaccine data correctly', async function() {
            collectionMock.find.returns({
                toArray: sinon.stub().resolves([
                    { Region: 'North East', 'Vaccine Doses Administered': 5000 }
                ])
            });

            const result = await dbOperations.fetchVaccineData();

            expect(result).to.be.an('array').that.is.not.empty;
            expect(result[0].Region).to.equal('North East');
            expect(result[0]['Vaccine Doses Administered']).to.equal(5000);
        });

        it('should handle errors and throw', async function() {
            collectionMock.find.returns({
                toArray: sinon.stub().rejects(new Error('Database error'))
            });

            try {
                await dbOperations.fetchVaccineData();
                throw new Error('Test should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Database error');
            }
        });
    });

    describe('fetchDeathsData', function() {
        it('should fetch deaths data correctly', async function() {
            collectionMock.find.returns({
                toArray: sinon.stub().resolves([
                    { Region: 'North East', 'Number of Deaths': 150 }
                ])
            });

            const result = await dbOperations.fetchDeathsData();

            expect(result).to.be.an('array').that.is.not.empty;
            expect(result[0].Region).to.equal('North East');
            expect(result[0]['Number of Deaths']).to.equal(150);
        });

        it('should handle errors and throw', async function() {
            collectionMock.find.returns({
                toArray: sinon.stub().rejects(new Error('Database error'))
            });

            try {
                await dbOperations.fetchDeathsData();
                throw new Error('Test should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Database error');
            }
        });
    });
});
