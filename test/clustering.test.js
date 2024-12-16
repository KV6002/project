const { expect } = require('chai');  // Import Chai's expect function for assertions
const { applyKMeans } = require('../riskLevels/clustering');  // Import the applyKMeans function
const KMeans = require('ml-kmeans');  // Import the KMeans module

// Mock the KMeans.kmeans method to return predefined clusters
describe('clustering', () => {
    describe('applyKMeans', () => {
        before(() => {
            // Mock the KMeans.kmeans method to avoid actual clustering calculations
            KMeans.kmeans = () => ({
                clusters: [0, 1, 2, 3, 4],  // Return predefined cluster assignments
            });
        });

        it('should assign the correct risk category to each instance based on clustering', async () => {
            // Prepare mock instances for testing
            const instances = [
                { casesPercentage: 10, deathsPercentage: 2, vaccinesPercentage: 80, density: 300 },
                { casesPercentage: 20, deathsPercentage: 5, vaccinesPercentage: 60, density: 500 },
                { casesPercentage: 30, deathsPercentage: 8, vaccinesPercentage: 40, density: 700 },
                { casesPercentage: 40, deathsPercentage: 10, vaccinesPercentage: 20, density: 900 },
                { casesPercentage: 50, deathsPercentage: 12, vaccinesPercentage: 10, density: 1200 },
            ];

            // Apply KMeans clustering
            const result = await applyKMeans(instances, 5);

            // Assert that the riskCategory field is correctly assigned based on the cluster index
            expect(result[0].riskCategory).to.equal('Very Low Risk');  // Cluster 0 -> 'Very Low Risk'
            expect(result[1].riskCategory).to.equal('Low Risk');       // Cluster 1 -> 'Low Risk'
            expect(result[2].riskCategory).to.equal('Medium Risk');    // Cluster 2 -> 'Medium Risk'
            expect(result[3].riskCategory).to.equal('High Risk');      // Cluster 3 -> 'High Risk'
            expect(result[4].riskCategory).to.equal('Very High Risk'); // Cluster 4 -> 'Very High Risk'
        });

        it('should handle cases with less than k instances gracefully', async () => {
            // Prepare fewer than 'k' instances
            const instances = [
                { casesPercentage: 10, deathsPercentage: 2, vaccinesPercentage: 80, density: 300 },
                { casesPercentage: 20, deathsPercentage: 5, vaccinesPercentage: 60, density: 500 },
            ];

            // Mock the result of KMeans.kmeans
            KMeans.kmeans = () => ({
                clusters: [0, 1], // Only two clusters for two instances
            });

            // Apply KMeans clustering
            const result = await applyKMeans(instances, 5);

            // Assert that the result still assigns risk categories based on the clusters
            expect(result[0].riskCategory).to.equal('Very Low Risk'); // Cluster 0 -> 'Very Low Risk'
            expect(result[1].riskCategory).to.equal('Low Risk');      // Cluster 1 -> 'Low Risk'
        });

        it('should return the same number of instances after clustering', async () => {
            // Prepare mock instances for testing
            const instances = [
                { casesPercentage: 10, deathsPercentage: 2, vaccinesPercentage: 80, density: 300 },
                { casesPercentage: 20, deathsPercentage: 5, vaccinesPercentage: 60, density: 500 },
                { casesPercentage: 30, deathsPercentage: 8, vaccinesPercentage: 40, density: 700 },
            ];

            // Mock the result of KMeans.kmeans
            KMeans.kmeans = () => ({
                clusters: [0, 0, 1], // Assign instances to two clusters
            });

            // Apply KMeans clustering
            const result = await applyKMeans(instances, 2);

            // Assert that the number of instances in the result is the same as the input
            expect(result.length).to.equal(instances.length);

            // Optionally, check if the clustering is working as expected
            expect(result[0].riskCategory).to.equal('Very Low Risk'); // Cluster 0 -> 'Very Low Risk'
            expect(result[1].riskCategory).to.equal('Very Low Risk'); // Cluster 0 -> 'Very Low Risk'
            expect(result[2].riskCategory).to.equal('Low Risk');     // Cluster 1 -> 'Low Risk'
        });
    });
});

