const sinon = require('sinon');
const { expect } = require('chai'); // Import Chai for assertions
const dbOperations = require('../riskLevels/dbOperations'); // Path to dbOperations module
const client = require('../db'); // MongoDB client module

describe('dbOperations', function () {
    let dbMock;
    let collectionMock;

    // Runs before each test to set up mocks
    beforeEach(() => {
        collectionMock = {
            find: sinon.stub().returns({
                toArray: sinon.stub().resolves([]), // Mock toArray to return an empty array by default
            }),
        };

        dbMock = {
            collection: sinon.stub().returns(collectionMock),
        };

        // Mock the client.db() method
        sinon.stub(client, 'db').returns(dbMock);
    });

    // Runs after each test to restore the original methods
    afterEach(() => {
        sinon.restore(); // Restore all stubs
    });

    describe('fetchCasesData', function () {
        it('should fetch cases data correctly', async function () {
            // Mock data for cases
            collectionMock.find.returns({
                toArray: sinon.stub().resolves([
                    { Region: 'North East', 'Number of tests positive for COVID-19': 100 },
                ]),
            });

            const result = await dbOperations.fetchCasesData();

            // Assert the result matches expectations
            expect(result).to.be.an('array').that.is.not.empty;
            expect(result[0].Region).to.equal('North East');
            expect(result[0]['Number of tests positive for COVID-19']).to.equal(100);
        });

        it('should handle errors and throw', async function () {
            // Simulate an error in toArray
            collectionMock.find.returns({
                toArray: sinon.stub().rejects(new Error('Database error')),
            });

            try {
                await dbOperations.fetchCasesData();
                throw new Error('Test should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Database error');
            }
        });
    });

    describe('fetchVaccineData', function () {
        it('should fetch vaccine data correctly', async function () {
            // Mock data for vaccines
            collectionMock.find.returns({
                toArray: sinon.stub().resolves([
                    { Region: 'North East', 'Vaccine Doses Administered': 5000 },
                ]),
            });

            const result = await dbOperations.fetchVaccineData();

            // Assert the result matches expectations
            expect(result).to.be.an('array').that.is.not.empty;
            expect(result[0].Region).to.equal('North East');
            expect(result[0]['Vaccine Doses Administered']).to.equal(5000);
        });

        it('should handle errors and throw', async function () {
            // Simulate an error in toArray
            collectionMock.find.returns({
                toArray: sinon.stub().rejects(new Error('Database error')),
            });

            try {
                await dbOperations.fetchVaccineData();
                throw new Error('Test should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Database error');
            }
        });
    });

    describe('fetchDeathsData', function () {
        it('should fetch deaths data correctly', async function () {
            // Mock data for deaths
            collectionMock.find.returns({
                toArray: sinon.stub().resolves([
                    { Region: 'North East', 'Number of Deaths': 150 },
                ]),
            });

            const result = await dbOperations.fetchDeathsData();

            // Assert the result matches expectations
            expect(result).to.be.an('array').that.is.not.empty;
            expect(result[0].Region).to.equal('North East');
            expect(result[0]['Number of Deaths']).to.equal(150);
        });

        it('should handle errors and throw', async function () {
            // Simulate an error in toArray
            collectionMock.find.returns({
                toArray: sinon.stub().rejects(new Error('Database error')),
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