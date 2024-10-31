// Initialize the map
const map = L.map('map').setView([52.3555, -1.1743], 6); // Center on England


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// JSON data (for simplicity, added here directly)
// Normally, you would fetch this data from an API or file
const covidData = [
  { region: "North East", lat: 54.9784, lon: -1.6174, positiveRate: 1.472171857 },
  { region: "North West", lat: 53.483959, lon: -2.244644, positiveRate: 1.386623676 },
  { region: "Yorkshire and The Humber", lat: 53.8008, lon: -1.5491, positiveRate: 1.905109439 },
  { region: "East Midlands", lat: 52.9399, lon: -1.191, positiveRate: 1.569415041 },
  { region: "West Midlands", lat: 52.4862, lon: -1.8904, positiveRate: 1.454135079 },
  { region: "East of England", lat: 52.2053, lon: 0.1218, positiveRate: 1.621906061 },
  { region: "London", lat: 51.5074, lon: -0.1278, positiveRate: 1.370345915 },
  { region: "South East", lat: 51.317, lon: -0.149, positiveRate: 1.532320184 },
  { region: "South West", lat: 51.4545, lon: -2.5879, positiveRate: 1.730132563 }
];

// Transform data to format suitable for Leaflet heatmap: [latitude, longitude, intensity]
const heatmapData = covidData.map(entry => [entry.lat, entry.lon, entry.positiveRate / 2]);

// Add heat layer to the map
L.heatLayer(heatmapData, {
  radius: 25,     // Radius of each "point" of heat
  blur: 15,       // Blur radius
  maxZoom: 10,    // Max zoom for heatmap layer
  max: 1.0        // Max intensity (can be adjusted based on data)
}).addTo(map);
