const KMeans = require('ml-kmeans');

async function applyKMeans(instances, k = 5) {
    const features = instances.map(instance => [
        instance.casesPercentage,
        instance.deathsPercentage,
        instance.vaccinesPercentage,
        instance.density,
    ]);

    const kmeansResult = KMeans.kmeans(features, k);
    const riskCategories = ['Very Low Risk', 'Low Risk', 'Medium Risk', 'High Risk', 'Very High Risk'];

    return instances.map((instance, index) => ({
        ...instance,
        riskCategory: riskCategories[kmeansResult.clusters[index]],
    }));
}

module.exports = {
    applyKMeans,
};
