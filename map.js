import { getVaccinationMonthlyInformationColour, getCasesMonthlyInformationColour, getDeathMonthlyInformationColour } from './ColourCoordination.js';

const map = L.map('map').setView([52.3555, -1.1743], 6); // Centered on the UK

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let casesLayer, deathsLayer, vaccinationsLayer;
let currentLayer = null;
let selectedDate = "January 2023";

const BASE_URL = "http://localhost:3000"; 

const dataCache = new Map();
let geolocationMap = new Map(); // Map to hold region-based geolocation data

async function fetchGeolocations() {
    try {
        const response = await fetch(`${BASE_URL}/api/COVID-NEW-geolocations`);
        const geolocationsData = await response.json();

        // Create a Map with region as key and coordinates as value
        geolocationsData.forEach(item => {
            geolocationMap.set(item.region, item.coordinates);
        });
        console.log("Geolocation data loaded:", geolocationMap);
    } catch (error) {
        console.error("Error fetching geolocations data:", error);
    }
}

async function fetchData(endpoint) {
    console.log(`Fetching data from endpoint: ${endpoint}`);
    if (dataCache.has(endpoint)) {
        console.log("Data loaded from cache:", dataCache.get(endpoint));
        return dataCache.get(endpoint);
    }
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        console.log("Data fetched:", data);
        dataCache.set(endpoint, data);
        return data;
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        throw error;
    }
}

async function loadCoordinatesForData(dataArray, intensityFunction) {
    const points = [];

    for (const item of dataArray) {
        // Check if the item has coordinates; if not, look them up in the geolocationMap
        if (!item.coordinates) {
            const coordinates = geolocationMap.get(item.Region);
            if (coordinates) {
                item.coordinates = coordinates; // Attach coordinates from geolocation data
            } else {
                console.error(`No coordinates found for region: ${item.Region}`);
                continue; // Skip this item if no coordinates are found
            }
        }

        const intensity = intensityFunction(item);
        points.push([item.coordinates.lat, item.coordinates.lng, intensity]);
    }

    return points;
}

async function loadData() {
    await fetchGeolocations(); // Load geolocations before fetching COVID data

    const endpoints = {
        cases: `${BASE_URL}/api/COVID-New-Cases?date=${encodeURIComponent(selectedDate)}`,
        deaths: `${BASE_URL}/api/COVID-NEW-Deaths?date=${encodeURIComponent(selectedDate)}`,
        vaccines: `${BASE_URL}/api/COVID-NEW-Vaccines?date=${encodeURIComponent(selectedDate)}`
    };

    console.log("Endpoints with date:", endpoints);

    try {
        const casesData = await fetchData(endpoints.cases);
        console.log("Cases data loaded:", casesData);
        const casesPoints = await loadCoordinatesForData(casesData, item => getCasesMonthlyInformationColour(item["Number of tests positive for COVID-19"]));
        casesLayer = L.heatLayer(casesPoints, { radius: 20, blur: 15 });

        const deathsData = await fetchData(endpoints.deaths);
        console.log("Deaths data loaded:", deathsData);
        const deathsPoints = await loadCoordinatesForData(deathsData, item => getDeathMonthlyInformationColour(item["Number of deaths"]));
        deathsLayer = L.heatLayer(deathsPoints, { radius: 20, blur: 15 });

        const vaccinationsData = await fetchData(endpoints.vaccines);
        console.log("Vaccinations data loaded:", vaccinationsData);
        const vaccinationsPoints = await loadCoordinatesForData(vaccinationsData, item => getVaccinationMonthlyInformationColour(item["Number_received_three_vaccines"]));
        vaccinationsLayer = L.heatLayer(vaccinationsPoints, { radius: 20, blur: 15 });

        if (currentLayer) {
            showLayer(currentLayer);
        }
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function showLayer(type) {
    if (casesLayer) map.removeLayer(casesLayer);
    if (deathsLayer) map.removeLayer(deathsLayer);
    if (vaccinationsLayer) map.removeLayer(vaccinationsLayer);

    if (type === 'cases' && casesLayer) {
        casesLayer.addTo(map);
    } else if (type === 'deaths' && deathsLayer) {
        deathsLayer.addTo(map);
    } else if (type === 'vaccines' && vaccinationsLayer) {
        vaccinationsLayer.addTo(map);
    }

    currentLayer = type;
}

function updateMonth(monthValue) {
    const [year, month] = monthValue.split("-");
    const dateObj = new Date(`${year}-${month}-01`);
    const formattedDate = `${dateObj.toLocaleString('default', { month: 'long' })} ${year}`;
    selectedDate = formattedDate;
    console.log(`Selected Date: ${selectedDate}`);
    loadData();
}

window.showLayer = showLayer;
window.updateMonth = updateMonth;

loadData();
