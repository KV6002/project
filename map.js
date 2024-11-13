// Initialize the Leaflet map
const map = L.map('map').setView([52.3555, -1.1743], 6); // Centre on UK

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
