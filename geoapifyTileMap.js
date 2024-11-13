const map = L.map('my-map').setView([48.1500327, 11.5753989], 10);
const isRetina = L.Browser.retina;
const baseUrl = "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=6e8dbb26e95e4992baa404893d4d2892";
const retinaUrl = "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=6e8dbb26e95e4992baa404893d4d2892";
L.tileLayer(isRetina ? retinaUrl : baseUrl, {
    attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors',
    apiKey: myAPIKey, 
    maxZoom: 20, 
    id: 'osm-bright'
}).addTo(map);
