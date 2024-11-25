import { getVaccinationMonthlyInformationColour, getCasesMonthlyInformationColour, getDeathMonthlyInformationColour } from './ColourCoordination.js';

const map = L.map('map').setView([52.3555, -1.1743], 6); // Centered on the UK

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    minZoom: 4,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let casesLayer, deathsLayer, vaccinationsLayer;
let markersLayer = L.layerGroup().addTo(map); // Separate layer for markers
let currentLayer = null;
let selectedDate = "October 2024";

const BASE_URL = "http://localhost:3000";

const dataCache = new Map();

// Hardcoded geolocation data
const geolocationData = [
    { region: "north east", coordinates: { lat: 54.978, lng: -1.617 } },
    { region: "north west", coordinates: { lat: 53.767623, lng: -2.703089 } },
    { region: "london", coordinates: { lat: 51.5074, lng: -0.1278 } },
    { region: "south west", coordinates: { lat: 51.454, lng: -2.589 } },
    { region: "south east", coordinates: { lat: 51.235685, lng: -0.906304 } },
    { region: "east midlands", coordinates: { lat: 52.971, lng: -1.168 } },
    { region: "yorkshire and the humber", coordinates: { lat: 53.799, lng: -1.549 } },
    { region: "wales", coordinates: { lat: 52.2928116, lng: -3.73893 } },
    { region: "east of england", coordinates: { lat: 52.205, lng: 0.121 } },
    // Add all other regions here
];

const geolocationMap = new Map(geolocationData.map(item => [item.region.trim().toLowerCase(), item.coordinates]));

// Fetch data from API
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

// Load data and map coordinates
async function loadCoordinatesForData(dataArray, intensityFunction) {
    const points = [];
    const details = [];

    for (const item of dataArray) {
        const region = item.Region.trim().toLowerCase();
        const coordinates = geolocationMap.get(region);

        if (!coordinates) {
            console.warn(`No coordinates for region: ${item.Region}`); // Log unmatched regions
            continue;
        }

        // Apply intensity function
        const intensity = intensityFunction(item);
        points.push([coordinates.lat, coordinates.lng, Math.max(intensity, 0.1)]);

        // Prepare details for popups
        details.push({
            region: item.Region,
            lat: coordinates.lat,
            lng: coordinates.lng,
            value: item
        });

        // Debugging: Log coordinates and details
        console.log(`Marker for ${item.Region}: [${coordinates.lat}, ${coordinates.lng}]`);
    }

    return { points, details };
}

// Load all data
async function loadData() {
    const endpoints = {
        cases: `${BASE_URL}/api/COVID-New-Cases?date=${encodeURIComponent(selectedDate)}`,
        deaths: `${BASE_URL}/api/COVID-NEW-Deaths?date=${encodeURIComponent(selectedDate)}`,
        vaccines: `${BASE_URL}/api/COVID-NEW-Vaccines?date=${encodeURIComponent(selectedDate)}`
    };

    try {
        // Fetch and process data for all layers
        const casesData = await fetchData(endpoints.cases);
        const { points: casesPoints, details: casesDetails } = await loadCoordinatesForData(
            casesData,
            item => getCasesMonthlyInformationColour(item["Number of tests positive for COVID-19"])
        );
        casesLayer = createHeatLayer(casesPoints, casesDetails, "cases");

        const deathsData = await fetchData(endpoints.deaths);
        const { points: deathsPoints, details: deathsDetails } = await loadCoordinatesForData(
            deathsData,
            item => getDeathMonthlyInformationColour(item["Number of deaths"])
        );
        deathsLayer = createHeatLayer(deathsPoints, deathsDetails, "deaths");

        const vaccinationsData = await fetchData(endpoints.vaccines);
        const { points: vaccinationsPoints, details: vaccinationsDetails } = await loadCoordinatesForData(
            vaccinationsData,
            item => getVaccinationMonthlyInformationColour(item["Number_received_three_vaccines"])
        );
        vaccinationsLayer = createHeatLayer(vaccinationsPoints, vaccinationsDetails, "vaccinations");

        if (currentLayer) {
            showLayer(currentLayer); // Show the selected layer (if any)
        } else {
            showLayer('cases'); // Default
        }
    } catch (error) {
        console.error("Error loading data:", error);
    }

    // Add legend to the map
    addLegend();
}

// Create heatmap layer with clickable markers
function createHeatLayer(points, details, layerType) {
    // Create the heatmap layer
    const layer = L.heatLayer(points, {
        radius: 30,
        blur: 20,
        maxZoom: 8,
        gradient: {
            0.0: 'blue',
            0.4: 'green',
            0.7: 'orange',
            1.0: 'red'
        }
    });

    // Clear and re-add markers
    markersLayer.clearLayers();

    // Add markers for details
    details.forEach(detail => {
        let popupContent = `<strong>Region:</strong> ${detail.region}<br>`;
        if (layerType === "cases") {
            popupContent += `<strong>Cases:</strong> ${detail.value["Number of tests positive for COVID-19"]}`;
        } else if (layerType === "deaths") {
            popupContent += `<strong>Deaths:</strong> ${detail.value["Number of deaths"]}`;
        } else if (layerType === "vaccinations") {
            popupContent += `<strong>Vaccinations:</strong> ${detail.value["Number_received_three_vaccines"]}`;
        }

        const marker = L.marker([detail.lat, detail.lng], { zIndexOffset: 1000 }) // Ensure marker is above heatmap
            .bindPopup(popupContent);
        markersLayer.addLayer(marker); // Add marker to markersLayer
    });

    return layer;
}

// Show specific layer
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

// Update the selected month
function updateMonth(monthValue) {
    const [year, month] = monthValue.split("-");
    const formattedDate = `${new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' })} ${year}`;
    selectedDate = formattedDate;

    loadData(); // Reload data for the selected month
}

// Add a legend to explain intensity levels
function addLegend() {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        div.innerHTML = `
            <h4>Intensity Levels</h4>
            <i style="background: blue"></i> Low<br>
            <i style="background: green"></i> Medium<br>
            <i style="background: orange"></i> High<br>
            <i style="background: red"></i> Very High<br>
        `;
        return div;
    };

    legend.addTo(map);
}

window.showLayer = showLayer;
window.updateMonth = updateMonth;

// Initial load
loadData();