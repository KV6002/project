const map = L.map('map').setView([52.3555, -1.1743], 6); // Centre on UK

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let casesLayer, deathsLayer, vaccinationsLayer;
let currentMonth = "Jan-23";

// Flag to track control addition
let filterControlAdded = false;

// Load and set up layers
async function loadData() {
    try {
        const casesResponse = await fetch(`http://localhost:3000/api/covid-cases?month=${currentMonth}`);
        const casesData = await casesResponse.json();
        const casesPoints = casesData.map(entry => [entry.latitude, entry.longitude, entry.intensity]);
        casesLayer = L.heatLayer(casesPoints, {
            radius: 20,
            blur: 15,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        });

        const deathsResponse = await fetch(`http://localhost:3000/api/covid-deaths?month=${currentMonth}`);
        const deathsData = await deathsResponse.json();
        const deathsPoints = deathsData.map(entry => [entry.latitude, entry.longitude, entry.intensity]);
        deathsLayer = L.heatLayer(deathsPoints, {
            radius: 20,
            blur: 15,
            gradient: { 0.4: 'purple', 0.65: 'orange', 1: 'black' }
        });

        const vaccinationsResponse = await fetch(`http://localhost:3000/api/covid-vaccines?month=${currentMonth}`);
        const vaccinationsData = await vaccinationsResponse.json();
        const vaccinationsPoints = vaccinationsData.map(entry => [entry.latitude, entry.longitude, entry.intensity]);
        vaccinationsLayer = L.heatLayer(vaccinationsPoints, {
            radius: 20,
            blur: 15,
            gradient: { 0.4: 'yellow', 0.65: 'green', 1: 'darkgreen' }
        });

        // Avoid duplicate controls
        if (!filterControlAdded) {
            addFilterControl();
            filterControlAdded = true;
        }

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function updateMonth(selectedMonth) {
    currentMonth = new Date(selectedMonth).toLocaleString('default', { month: 'short' }) + "-" + selectedMonth.slice(2, 4);
    loadData();
}

function addFilterControl() {
    const filterControl = L.control({ position: 'topright' });
    filterControl.onAdd = function () {
        const div = L.DomUtil.create('div', 'filter-control');
        div.innerHTML = `
            <button onclick="showLayer('cases')">Cases</button>
            <button onclick="showLayer('deaths')">Deaths</button>
            <button onclick="showLayer('vaccines')">Vaccinations</button>
            <input type="month" onchange="updateMonth(this.value)" />
        `;
        return div;
    };
    filterControl.addTo(map);
}

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

// Initial data load
loadData();
