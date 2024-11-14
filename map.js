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

// Cache to store fetched data
const dataCache = new Map();

async function fetchData(endpoint) {
    if (dataCache.has(endpoint)) {
        return dataCache.get(endpoint);
    }
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        dataCache.set(endpoint, data);
        return data;
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        throw error;
    }
}

// Fetch data and load into heatmap layers
async function loadData() {
    const endpoints = {
        cases: `/api/COVID-NEW-Cases?Non-overlapping 14-day period${selectedMonth}`,
        deaths: `/api/COVID-NEW-Deaths?Non-overlapping 14-day period${selectedMonth}`,
        vaccines: `/api/COVID-NEW-Vaccines?Non-overlapping 14-day period${selectedMonth}`
    };

    try {
        const casesResponse = await fetch(endpoints.cases);
        const casesData = await casesResponse.json();
        const casesPoints = casesData.filter(item => item.coordinates).map(item => [item.coordinates.lat, item.coordinates.lng, 1]);
        casesLayer = L.heatLayer(casesPoints, { radius: 20, blur: 15 });

        const deathsResponse = await fetch(endpoints.deaths);
        const deathsData = await deathsResponse.json();
        const deathsPoints = deathsData.filter(item => item.coordinates).map(item => [item.coordinates.lat, item.coordinates.lng, 1]);
        deathsLayer = L.heatLayer(deathsPoints, { radius: 20, blur: 15 });

        const vaccinationsResponse = await fetch(endpoints.vaccines);
        const vaccinationsData = await vaccinationsResponse.json();
        const vaccinationsPoints = vaccinationsData.filter(item => item.coordinates).map(item => [item.coordinates.lat, item.coordinates.lng, 0.5]);
        vaccinationsLayer = L.heatLayer(vaccinationsPoints, { radius: 20, blur: 15 });

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
    if (type === 'Cases' && casesLayer) {
        casesLayer.addTo(map);
    } else if (type === 'Deaths' && deathsLayer) {
        deathsLayer.addTo(map);
    } else if (type === 'Vaccines' && vaccinationsLayer) {
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