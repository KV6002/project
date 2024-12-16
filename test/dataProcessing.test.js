const sinon = require('sinon');
const { expect } = require('chai');
const dataProcessing = require('../riskLevels/dataProcessing');  // Path to your dataProcessing.js file

describe('dataProcessing', function () {

    describe('cleanCaseNumber', function () {
        it('should return 0 for null value', function () {
            const result = dataProcessing.cleanCaseNumber(null);
            expect(result).to.equal(0);
        });

        it('should return the number as is if the value is already a number', function () {
            const result = dataProcessing.cleanCaseNumber(100);
            expect(result).to.equal(100);
        });

        it('should extract number from a string', function () {
            const result = dataProcessing.cleanCaseNumber('100 cases');
            expect(result).to.equal(100);
        });

        it('should return 0 if the string cannot be parsed as a number', function () {
            const result = dataProcessing.cleanCaseNumber('abc');
            expect(result).to.equal(0);
        });
    });

    describe('createInstances', function () {
        it('should combine cases, vaccines, and deaths data into unified instances', function () {
            const casesData = [
                { "Non-overlapping 14-day period": '2021-01-01', Region: 'North East', "Number of tests positive for COVID-19": 100 }
            ];
            const vaccinesData = [
                { "Non-overlapping 14-day period": '2021-01-01', Region: 'North East', Number_received_three_vaccines: 500, Population: 2000 }
            ];
            const deathsData = [
                { "Non-overlapping 14-day period": '2021-01-01', Region: 'North East', Sex: 'All people', "Age group (years)": 'All ages', "Number of deaths": 10 }
            ];

            const result = dataProcessing.createInstances(casesData, vaccinesData, deathsData);

            expect(result).to.be.an('array').that.is.not.empty;
            expect(result[0]).to.have.property('region').that.equals('North East');
            expect(result[0]).to.have.property('cases').that.equals(100);
            expect(result[0]).to.have.property('vaccines').that.equals(500);
            expect(result[0]).to.have.property('deaths').that.equals(10);
        });

        it('should skip instances with missing required data', function () {
            const casesData = [
                { "Non-overlapping 14-day period": '2021-01-01', Region: 'North East', "Number of tests positive for COVID-19": 100 }
            ];
            const vaccinesData = [
                { "Non-overlapping 14-day period": '2021-01-01', Region: 'North East', Number_received_three_vaccines: 500, Population: 2000 }
            ];
            const deathsData = [];

            const result = dataProcessing.createInstances(casesData, vaccinesData, deathsData);
            expect(result).to.be.an('array').that.is.empty;
        });
    });

    describe('preprocessInstances', function () {
        it('should calculate percentages for cases, deaths, and vaccines', function () {
            const instances = [
                {
                    date: '2021-01-01',
                    region: 'North East',
                    cases: 100,
                    deaths: 10,
                    vaccines: 500,
                    population: 2000,
                    density: 200
                }
            ];

            const result = dataProcessing.preprocessInstances(instances);

            expect(result[0]).to.have.property('casesPercentage').that.equals(5);
            expect(result[0]).to.have.property('deathsPercentage').that.equals(0.5);
            expect(result[0]).to.have.property('vaccinesPercentage').that.equals(75);
        });

        it('should return 0 for percentages if population is 0 or invalid', function () {
            const instances = [
                {
                    date: '2021-01-01',
                    region: 'North East',
                    cases: 100,
                    deaths: 10,
                    vaccines: 500,
                    population: 0,
                    density: 200
                }
            ];

            const result = dataProcessing.preprocessInstances(instances);

            expect(result[0]).to.have.property('casesPercentage').that.equals(0);
            expect(result[0]).to.have.property('deathsPercentage').that.equals(0);
            expect(result[0]).to.have.property('vaccinesPercentage').that.equals(100);
        });
    });

    describe('cleanPreprocessedData', function () {
        it('should return only relevant fields after cleaning', function () {
            const preprocessedInstances = [
                {
                    date: '2021-01-01',
                    region: 'North East',
                    casesPercentage: 5,
                    deathsPercentage: 0.5,
                    vaccinesPercentage: 75,
                    density: 200,
                    cases: 100,
                    deaths: 10,
                    vaccines: 500
                }
            ];

            const result = dataProcessing.cleanPreprocessedData(preprocessedInstances);

            expect(result[0]).to.have.all.keys('date', 'region', 'casesPercentage', 'deathsPercentage', 'vaccinesPercentage', 'density', 'cases', 'deaths', 'vaccines');
        });
    });

    describe('normalizeData', function () {
        it('should normalize the data between 0 and 1 for all features', function () {
            const instances = [
                {
                    date: '2021-01-01',
                    region: 'North East',
                    casesPercentage: 10,
                    deathsPercentage: 1,
                    vaccinesPercentage: 50,
                    density: 200
                },
                {
                    date: '2021-01-02',
                    region: 'South East',
                    casesPercentage: 20,
                    deathsPercentage: 2,
                    vaccinesPercentage: 60,
                    density: 400
                }
            ];

            const result = dataProcessing.normalizeData(instances);

            expect(result[0]).to.have.property('casesPercentage').that.is.within(0, 1);
            expect(result[0]).to.have.property('deathsPercentage').that.is.within(0, 1);
            expect(result[0]).to.have.property('vaccinesPercentage').that.is.within(0, 1);
            expect(result[0]).to.have.property('density').that.is.within(0, 1);
        });
    });
});
