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
  { region: "west midlands", coordinates: { lat: 52.476331428, lng: -1.889496442 } },
];

const geolocationMap = new Map(
  geolocationData.map((item) => [item.region.trim().toLowerCase(), item.coordinates])
);

async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
}

async function loadCoordinatesForData(dataArray, intensityFunction, riskScoreData) {
  const points = [];
  const details = [];

  for (const item of dataArray) {
    if (!item.Region) {
      console.warn("Missing Region property in item:", item);
      continue;
    }

    const region = item.Region.trim().toLowerCase();
    const coordinates = geolocationMap.get(region);

    if (!coordinates) {
      console.warn(`No coordinates for region: ${item.Region}`);
      continue;
    }

    const intensity = intensityFunction(item);

    // Find corresponding risk category from riskScoreData
    const riskCategory = riskScoreData.find(
      (risk) =>
        risk.region && risk.region.trim().toLowerCase() === region
    )?.["riskCategory"] || "Unknown"; // Default to "Unknown" if missing

    points.push([coordinates.lat, coordinates.lng, Math.max(intensity, 0.1)]);

    details.push({
      region: item.Region,
      lat: coordinates.lat,
      lng: coordinates.lng,
      value: item,
      riskCategory, // Add risk category
    });
  }

  return { points, details };
}

function createHeatLayer(points, details, layerType) {
  if (details.length === 0) {
    console.warn(`No details available for layer: ${layerType}`);
    return { heatLayer: null, markersLayer: null };
  }

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

  const markersLayer = L.layerGroup();

  details.forEach((detail) => {
    let popupContent = `<strong>Region:</strong> ${detail.region}<br>`;

    // Add specific data based on layer type
    if (layerType === "cases") {
      popupContent += `<strong>Cases:</strong> ${detail.value["Number of tests positive for COVID-19"] || "N/A"}<br>`;
    } else if (layerType === "deaths") {
      popupContent += `<strong>Deaths:</strong> ${detail.value["Number of deaths"] || "N/A"}<br>`;
    } else if (layerType === "vaccinations") {
      popupContent += `<strong>Vaccinations:</strong> ${detail.value["Number_received_three_vaccines"] || "N/A"}<br>`;
    }

    // Add risk category
    popupContent += `<strong>Risk Level:</strong> ${detail.riskCategory}`;

    const marker = L.marker([detail.lat, detail.lng]).bindPopup(popupContent);
    markersLayer.addLayer(marker);
  });

  return { heatLayer, markersLayer };
}

async function loadData() {
  const endpoints = {
    cases: `${BASE_URL}/api/covid-cases?date=${encodeURIComponent(selectedDate)}`,
    deaths: `${BASE_URL}/api/covid-deaths?date=${encodeURIComponent(selectedDate)}`,
    vaccines: `${BASE_URL}/api/covid-vaccines?date=${encodeURIComponent(selectedDate)}`,
    riskscore: `${BASE_URL}/api/covid-riskScores?date=${encodeURIComponent(selectedDate)}`,
  };

  try {
    const riskScoreData = await fetchData(endpoints.riskscore);

    const casesData = await fetchData(endpoints.cases);
    if (casesData.length > 0) {
      const { points: casesPoints, details: casesDetails } = await loadCoordinatesForData(
        casesData,
        (item) => getCasesMonthlyInformationColour(item["Number of tests positive for COVID-19"]),
        riskScoreData
      );
      const { heatLayer, markersLayer } = createHeatLayer(casesPoints, casesDetails, "cases");
      casesLayer = heatLayer;
      casesMarkersLayer = markersLayer;
    }

    const deathsData = await fetchData(endpoints.deaths);
    if (deathsData.length > 0) {
      const { points: deathsPoints, details: deathsDetails } = await loadCoordinatesForData(
        deathsData,
        (item) => getDeathMonthlyInformationColour(item["Number of deaths"]),
        riskScoreData
      );
      const { heatLayer, markersLayer } = createHeatLayer(deathsPoints, deathsDetails, "deaths");
      deathsLayer = heatLayer;
      deathsMarkersLayer = markersLayer;
    }

    const vaccinationsData = await fetchData(endpoints.vaccines);
    if (vaccinationsData.length > 0) {
      const { points: vaccinationsPoints, details: vaccinationsDetails } = await loadCoordinatesForData(
        vaccinationsData,
        (item) => getVaccinationMonthlyInformationColour(item["Number_received_three_vaccines"]),
        riskScoreData
      );
      const { heatLayer, markersLayer } = createHeatLayer(vaccinationsPoints, vaccinationsDetails, "vaccinations");
      vaccinationsLayer = heatLayer;
      vaccinationsMarkersLayer = markersLayer;
    }

    if (currentLayer) {
      showLayer(currentLayer);
    } else {
      showLayer("cases");
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function showLayer(type) {
  // Remove existing layers
  if (casesLayer) map.removeLayer(casesLayer);
  if (casesMarkersLayer) map.removeLayer(casesMarkersLayer);
  if (deathsLayer) map.removeLayer(deathsLayer);
  if (deathsMarkersLayer) map.removeLayer(deathsMarkersLayer);
  if (vaccinationsLayer) map.removeLayer(vaccinationsLayer);
  if (vaccinationsMarkersLayer) map.removeLayer(vaccinationsMarkersLayer);

  // Add selected layer
  if (type === "cases" && casesLayer && casesMarkersLayer) {
    casesLayer.addTo(map);
    casesMarkersLayer.addTo(map);
  } else if (type === "deaths" && deathsLayer && deathsMarkersLayer) {
    deathsLayer.addTo(map);
    deathsMarkersLayer.addTo(map);
  } else if (type === "vaccines" && vaccinationsLayer && vaccinationsMarkersLayer) {
    vaccinationsLayer.addTo(map);
    vaccinationsMarkersLayer.addTo(map);
  } else {
    console.warn(`Layer for type "${type}" is not available.`);
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