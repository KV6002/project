import {
  getVaccinationMonthlyInformationColour,
  getCasesMonthlyInformationColour,
  getDeathMonthlyInformationColour,
} from "./ColourCoordination.js";

// Initialize the map
const map = L.map("map").setView([52.3555, -1.1743], 6); // Centered on the UK

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  minZoom: 4,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let casesLayer, deathsLayer, vaccinationsLayer;
let casesMarkersLayer, deathsMarkersLayer, vaccinationsMarkersLayer;
let currentLayer = null;

const now = new Date();
let selectedDate = `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;

const BASE_URL = "https://project-tan-nine-34.vercel.app";

// Map of regions and their coordinates
const geolocationMap = new Map([
  ["north east", { lat: 54.978, lng: -1.617 }],
  ["north west", { lat: 53.767623, lng: -2.703089 }],
  ["london", { lat: 51.5074, lng: -0.1278 }],
  ["south west", { lat: 51.454, lng: -2.589 }],
  ["south east", { lat: 51.235685, lng: -0.906304 }],
  ["east midlands", { lat: 52.971, lng: -1.168 }],
  ["yorkshire and the humber", { lat: 53.799, lng: -1.549 }],
  ["wales", { lat: 52.2928116, lng: -3.73893 }],
  ["east of england", { lat: 52.205, lng: 0.121 }],
  ["west midlands", { lat: 52.476331428, lng: -1.889496442 }],
]);

async function fetchData(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Error fetching data: ${response.status}`);
  return response.json();
}

async function loadCoordinatesForData(dataArray, intensityFunction, riskScoreData) {
  const points = [];
  const details = [];

  dataArray.forEach((item) => {
    const region = item.Region?.trim().toLowerCase();
    if (!region) return;

    const coordinates = geolocationMap.get(region);
    if (!coordinates) return;

    const intensity = intensityFunction(item);
    const riskCategory = riskScoreData.find(
      (risk) => risk.region?.trim().toLowerCase() === region
    )?.riskCategory || "Unknown";

    points.push([coordinates.lat, coordinates.lng, Math.max(intensity, 0.1)]);
    details.push({ region: item.Region, ...coordinates, value: item, riskCategory });
  });

  return { points, details };
}

function createHeatLayer(points, details, layerType) {
  if (!details.length) return { heatLayer: null, markersLayer: null };

  const heatLayer = L.heatLayer(points, {
    radius: 30,
    blur: 20,
    maxZoom: 8,
    gradient: {
      0.0: "blue",
      0.4: "green",
      0.7: "orange",
      1.0: "red",
    },
  });

  const markersLayer = L.layerGroup(
    details.map((detail) => {
      const popupContent = `
        <strong>Region:</strong> ${detail.region}<br>
        <strong>${layerType === "cases" ? "Cases" : layerType === "deaths" ? "Deaths" : "Vaccinations"}:</strong> ${
          detail.value["Number of tests positive for COVID-19"] ||
          detail.value["Number of deaths"] ||
          detail.value["Number_received_three_vaccines"] ||
          "N/A"
        }<br>
        <strong>Risk Level:</strong> ${detail.riskCategory}
      `;
      return L.marker([detail.lat, detail.lng]).bindPopup(popupContent);
    })
  );

  return { heatLayer, markersLayer };
}

async function loadData() {
  const endpoints = {
    cases: `${BASE_URL}/api/covid-cases?date=${encodeURIComponent(selectedDate)}`,
    deaths: `${BASE_URL}/api/covid-deaths?date=${encodeURIComponent(selectedDate)}`,
    vaccines: `${BASE_URL}/api/covid-vaccines?date=${encodeURIComponent(selectedDate)}`,
    riskscore: `${BASE_URL}/api/covid-riskScore?date=${encodeURIComponent(selectedDate)}`,
  };

  try {
    const riskScoreData = await fetchData(endpoints.riskscore);

    const casesData = await fetchData(endpoints.cases);
    if (casesData.length) {
      const { points, details } = await loadCoordinatesForData(
        casesData,
        (item) => getCasesMonthlyInformationColour(item["Number of tests positive for COVID-19"]),
        riskScoreData
      );
      const { heatLayer, markersLayer } = createHeatLayer(points, details, "cases");
      casesLayer = heatLayer;
      casesMarkersLayer = markersLayer;
    }

    const deathsData = await fetchData(endpoints.deaths);
    if (deathsData.length) {
      const { points, details } = await loadCoordinatesForData(
        deathsData,
        (item) => getDeathMonthlyInformationColour(item["Number of deaths"]),
        riskScoreData
      );
      const { heatLayer, markersLayer } = createHeatLayer(points, details, "deaths");
      deathsLayer = heatLayer;
      deathsMarkersLayer = markersLayer;
    }

    const vaccinationsData = await fetchData(endpoints.vaccines);
    if (vaccinationsData.length) {
      const { points, details } = await loadCoordinatesForData(
        vaccinationsData,
        (item) => getVaccinationMonthlyInformationColour(item["Number_received_three_vaccines"]),
        riskScoreData
      );
      const { heatLayer, markersLayer } = createHeatLayer(points, details, "vaccinations");
      vaccinationsLayer = heatLayer;
      vaccinationsMarkersLayer = markersLayer;
    }

    if (currentLayer) showLayer(currentLayer);
    else showLayer("cases");
  } catch (error) {
    console.error("Error loading data:", error.message);
  }
}

function showLayer(type) {
  [casesLayer, deathsLayer, vaccinationsLayer].forEach((layer) => layer && map.removeLayer(layer));
  [casesMarkersLayer, deathsMarkersLayer, vaccinationsMarkersLayer].forEach((layer) => layer && map.removeLayer(layer));

  if (type === "cases" && casesLayer && casesMarkersLayer) {
    casesLayer.addTo(map);
    casesMarkersLayer.addTo(map);
  } else if (type === "deaths" && deathsLayer && deathsMarkersLayer) {
    deathsLayer.addTo(map);
    deathsMarkersLayer.addTo(map);
  } else if (type === "vaccines" && vaccinationsLayer && vaccinationsMarkersLayer) {
    vaccinationsLayer.addTo(map);
    vaccinationsMarkersLayer.addTo(map);
  }

  currentLayer = type;
}

function updateMonth(monthValue) {
  const [year, month] = monthValue.split("-");
  selectedDate = `${new Date(`${year}-${month}-01`).toLocaleString("default", { month: "long" })} ${year}`;
  loadData();
}

window.showLayer = showLayer;
window.updateMonth = updateMonth;

// Load data when the page loads
loadData();