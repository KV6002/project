// Initialize the Leaflet map
const map = L.map('map').setView([52.3555, -1.1743], 6); // Centre on UK

// Base tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Heatmap layers
let casesLayer, deathsLayer, vaccinationsLayer;

// Function to load and set up layers
async function loadData() {
    // Load cases data
    const casesResponse = await fetch('/api/covid-cases');
    const casesData = await casesResponse.json();
    const casesPoints = casesData.map(entry => [entry.latitude, entry.longitude, entry.intensity]);
    casesLayer = L.heatLayer(casesPoints, {
        radius: 20,
        blur: 15,
        gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
    });

    // Load deaths data
    const deathsResponse = await fetch('/api/covid-deaths');
    const deathsData = await deathsResponse.json();
    const deathsPoints = deathsData.map(entry => [entry.latitude, entry.longitude, entry.intensity]);
    deathsLayer = L.heatLayer(deathsPoints, {
        radius: 20,
        blur: 15,
        gradient: { 0.4: 'purple', 0.65: 'orange', 1: 'black' }
    });

    // Load vaccinations data
    const vaccinationsResponse = await fetch('/api/covid-vaccines');
    const vaccinationsData = await vaccinationsResponse.json();
    const vaccinationsPoints = vaccinationsData.map(entry => [entry.latitude, entry.longitude, entry.intensity]);
    vaccinationsLayer = L.heatLayer(vaccinationsPoints, {
        radius: 20,
        blur: 15,
        gradient: { 0.4: 'yellow', 0.65: 'green', 1: 'darkgreen' }
    });
}

// Call loadData function to fetch and set up the layers
loadData();

// Filter Control: Custom control switch between layers. 
const filterControl = L.control({position: 'topright'});
filterControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'filter-control');
    div.innerHTML = `
        <button onclick="showLayer('cases')">Cases</button>
        <button onclick="showLayer('deaths')">Deaths</button>
        <button onclick="showLayer('vaccines')">Vaccinations</button>
    `;
    return div;
};
filterControl.addTo(map);

// Function to show selected layer and hide others
function showLayer(type) {
    map.eachLayer(layer => {
        if (layer === casesLayer || layer === deathsLayer || layer === vaccinationsLayer) {
            map.removeLayer(layer);
        }
    });

    if (type === 'cases' && casesLayer) {
        casesLayer.addTo(map);
    } else if (type === 'deaths' && deathsLayer) {
        deathsLayer.addTo(map);
    } else if (type === 'vaccines' && vaccinationsLayer) {
        vaccinationsLayer.addTo(map);
    }
}
