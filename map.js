// Initialize the Leaflet map
const map = L.map('map').setView([52.3555, -1.1743], 6); // Centered on the UK

// Base tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Define heatmap layers
let casesLayer, deathsLayer, vaccinationsLayer;
let currentLayer = null;
let selectedMonth = "Jan-23"; // Default month

// Fetch data and load into heatmap layers
async function loadData() {
    const endpoints = {
        cases: `/api/covid-cases?month=${selectedMonth}`,
        deaths: `/api/covid-deaths?month=${selectedMonth}`,
        vaccines: `/api/covid-vaccines?month=${selectedMonth}`
    };

    try {
        // Load and create the cases layer
        const casesResponse = await fetch(endpoints.cases);
        const casesData = await casesResponse.json();
        const casesPoints = casesData
            .filter(item => item.coordinates)
            .map(item => [item.coordinates.lat, item.coordinates.lng, 0.5]);
        casesLayer = L.heatLayer(casesPoints, { radius: 20, blur: 15 });

        // Load and create the deaths layer
        const deathsResponse = await fetch(endpoints.deaths);
        const deathsData = await deathsResponse.json();
        const deathsPoints = deathsData
            .filter(item => item.coordinates)
            .map(item => [item.coordinates.lat, item.coordinates.lng, 0.5]);
        deathsLayer = L.heatLayer(deathsPoints, { radius: 20, blur: 15 });

        // Load and create the vaccinations layer
        const vaccinationsResponse = await fetch(endpoints.vaccines);
        const vaccinationsData = await vaccinationsResponse.json();
        const vaccinationsPoints = vaccinationsData
            .filter(item => item.coordinates)
            .map(item => [item.coordinates.lat, item.coordinates.lng, 0.5]);
        vaccinationsLayer = L.heatLayer(vaccinationsPoints, { radius: 20, blur: 15 });

        // Show the initial layer if one is already selected
        if (currentLayer) {
            showLayer(currentLayer);
        }
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// Function to show the selected layer and hide others
function showLayer(type) {
    // Remove any existing layers
    if (casesLayer) map.removeLayer(casesLayer);
    if (deathsLayer) map.removeLayer(deathsLayer);
    if (vaccinationsLayer) map.removeLayer(vaccinationsLayer);

    // Add the selected layer to the map
    if (type === 'cases' && casesLayer) {
        casesLayer.addTo(map);
    } else if (type === 'deaths' && deathsLayer) {
        deathsLayer.addTo(map);
    } else if (type === 'vaccines' && vaccinationsLayer) {
        vaccinationsLayer.addTo(map);
    }

    // Update the current layer
    currentLayer = type;
}

// Function to update the month based on slider input
function updateMonth(monthValue) {
    const [year, month] = monthValue.split("-");
    const monthName = new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'short' });
    selectedMonth = `${monthName}-${year.slice(-2)}`; // Format as "Jan-23"
    loadData(); // Reload data for the selected month
}

// Initial load
loadData();
