// Initialize the Leaflet map
const map = L.map('map').setView([52.3555, -1.1743], 6); // Centered on the UK

var myAPIKey = "6e8dbb26e95e4992baa404893d4d2892"; // geoapify key
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variables to store waypoints
let fromWaypoint = null;
let toWaypoint = null;

// Function to fetch and display route
function fetchAndDisplayRoute() {
    if (fromWaypoint && toWaypoint) {
        const url = `https://api.geoapify.com/v1/routing?waypoints=${fromWaypoint.join(',')}|${toWaypoint.join(',')}&mode=drive&details=instruction_details&apiKey=${myAPIKey}`;
        
        fetch(url)
            .then(res => res.json())
            .then(result => {
                if (result.features && result.features.length > 0) {
                    const routeFeature = result.features[0];
                    
                    L.geoJSON(routeFeature, {
                        style: {
                            color: "rgba(20, 137, 255, 0.7)",
                            weight: 5
                        }
                    })
                    .bindPopup(layer => {
                        const { distance, distance_units, time } = routeFeature.properties;
                        return `${distance} ${distance_units}, ${time}`;
                    })
                    .addTo(map);
                } else {
                    console.log("No route data found.");
                }
            })
            .catch(error => console.log("Error fetching route data:", error));
    }
}

// Event listener to set waypoints on map click
map.on('click', (event) => {
    const { lat, lng } = event.latlng;
    
    if (!fromWaypoint) {
        // Set fromWaypoint on first click
        fromWaypoint = [lat, lng];
        L.marker(fromWaypoint).addTo(map).bindPopup("Start Point").openPopup();
        console.log("Start point set:", fromWaypoint);
    } else if (!toWaypoint) {
        // Set toWaypoint on second click
        toWaypoint = [lat, lng];
        L.marker(toWaypoint).addTo(map).bindPopup("End Point").openPopup();
        console.log("End point set:", toWaypoint);

        // Fetch and display the route once both waypoints are set
        fetchAndDisplayRoute();
    } else {
        // Reset waypoints if user wants to start over
        fromWaypoint = [lat, lng];
        toWaypoint = null;
        map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.GeoJSON) {
                map.removeLayer(layer);
            }
        });
        L.marker(fromWaypoint).addTo(map).bindPopup("Start Point").openPopup();
        console.log("Start point reset:", fromWaypoint);
    }
});
// Heatmap layers
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
        cases: `/api/covid-cases?date=${selectedMonth}`,
        deaths: `/api/covid-deaths?date=${selectedMonth}`,
        vaccines: `/api/covid-vaccines?date=${selectedMonth}`
    };

    try {
        const casesResponse = await fetch(endpoints.cases);
        const casesData = await casesResponse.json();
        const casesPoints = casesData.filter(item => item.coordinates).map(item => [item.coordinates.lat, item.coordinates.lng, 0.5]);
        casesLayer = L.heatLayer(casesPoints, { radius: 20, blur: 15 });

        const deathsResponse = await fetch(endpoints.deaths);
        const deathsData = await deathsResponse.json();
        const deathsPoints = deathsData.filter(item => item.coordinates).map(item => [item.coordinates.lat, item.coordinates.lng, 0.5]);
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