// Color functions for heatmap layers
function getVaccinationMonthlyInformationColour(VaccinationsMonthly) {
    if (VaccinationsMonthly < 50000) return "blue";
    else if (VaccinationsMonthly <= 499999) return "red";
    else if (VaccinationsMonthly <= 1500000) return "DarkerRed";
    else return "lightRed";
}

function getCasesMonthlyInformationColour(Cases) {
    if (Cases < 100) return "lightRed";
    else if (Cases <= 999) return "DarkerRed";
    else if (Cases <= 4999) return "red";
    else return "blue";
}

function getDeathMonthlyInformationColour(DeathsMonthly) {
    if (DeathsMonthly < 100) return "lightRed";
    else if (DeathsMonthly <= 999) return "DarkerRed";
    else if (DeathsMonthly <= 4999) return "red";
    else return "blue";
}

// Initialize the Leaflet map
const map = L.map('map').setView([52.3555, -1.1743], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

let casesLayer, deathsLayer, vaccinationsLayer;
let currentLayer = null;
let selectedMonth = "Jan-23";
let selectedRegion = "England";

const dataCache = new Map();

async function fetchData(endpoint, region = "") {
    console.log(`Fetching data from endpoint: ${endpoint} for region: ${region}`);
    if (dataCache.has(endpoint)) {
        console.log(`Using cached data for ${endpoint}`);
        return dataCache.get(endpoint);
    }
    try {
        const response = await fetch(`${endpoint}&region=${encodeURIComponent(region)}`);
        const data = await response.json();
        console.log(`Data received from ${endpoint}:`, data); // Log fetched data
        dataCache.set(endpoint, data);
        return data;
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        throw error;
    }
}


async function fetchData(endpoint, region = "") {
    console.log(`Fetching data from endpoint: ${endpoint} for region: ${region}`);
    if (dataCache.has(endpoint)) {
        console.log(`Using cached data for ${endpoint}`);
        return dataCache.get(endpoint);
    }
    try {
        const response = await fetch(`${endpoint}&region=${encodeURIComponent(region)}`);
        const data = await response.json();
        console.log(`Data received from ${endpoint}:`, data); // Log fetched data
        dataCache.set(endpoint, data);
        return data;
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        throw error;
    }
}



function showLayer(type) {
    if (casesLayer) map.removeLayer(casesLayer);
    if (deathsLayer) map.removeLayer(deathsLayer);
    if (vaccinationsLayer) map.removeLayer(vaccinationsLayer);

    if (type === 'cases' && casesLayer) casesLayer.addTo(map);
    else if (type === 'deaths' && deathsLayer) deathsLayer.addTo(map);
    else if (type === 'vaccines' && vaccinationsLayer) vaccinationsLayer.addTo(map);

    currentLayer = type;
}

function updateMonth(monthValue) {
    const [year, month] = monthValue.split("-");
    selectedMonth = `${new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'short' })}-${year.slice(-2)}`;
    loadData();
}

function updateRegion(region) {
    selectedRegion = region;
    loadData();
}

// Initial data load
loadData();
