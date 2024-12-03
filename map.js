import {
    getVaccinationMonthlyInformationColour,
    getCasesMonthlyInformationColour,
    getDeathMonthlyInformationColour,
  } from "./ColourCoordination.js";
  
  const map = L.map("map").setView([52.3555, -1.1743], 6); // Centered on the UK
  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    minZoom: 4,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  
  let casesLayer,
    deathsLayer,
    vaccinationsLayer,
    casesMarkersLayer,
    deathsMarkersLayer,
    vaccinationsMarkersLayer;
  let currentLayer = null;
  
  const now = new Date();
  let selectedDate = `${now.toLocaleString("default", {
    month: "long",
  })} ${now.getFullYear()}`;
  
  const BASE_URL = "http://localhost:3000";
  
  const dataCache = new Map();
  
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
  
  async function loadCoordinatesForData(dataArray, intensityFunction) {
    const points = [];
    const details = [];
  
    for (const item of dataArray) {
      const region = item.Region.trim().toLowerCase();
      const coordinates = geolocationMap.get(region);
  
      if (!coordinates) {
        console.warn(`No coordinates for region: ${item.Region}`);
        continue;
      }
  
      const intensity = intensityFunction(item);
      points.push([coordinates.lat, coordinates.lng, Math.max(intensity, 0.1)]);
  
      details.push({
        region: item.Region,
        lat: coordinates.lat,
        lng: coordinates.lng,
        value: item,
      });
    }
  
    return { points, details };
  }
  
  async function loadData() {
    const endpoints = {
      cases: `${BASE_URL}/api/COVID-New-Cases?date=${encodeURIComponent(selectedDate)}`,
      deaths: `${BASE_URL}/api/COVID-NEW-Deaths?date=${encodeURIComponent(selectedDate)}`,
      vaccines: `${BASE_URL}/api/COVID-NEW-Vaccines?date=${encodeURIComponent(selectedDate)}`,
    };
  
    try {
      const casesData = await fetchData(endpoints.cases);
      if (casesData.length === 0) {
        console.warn("No data available for cases.");
        casesLayer = null;
        casesMarkersLayer = null;
      } else {
        const { points: casesPoints, details: casesDetails } = await loadCoordinatesForData(
          casesData,
          (item) => getCasesMonthlyInformationColour(item["Number of tests positive for COVID-19"])
        );
        const { heatLayer, markersLayer } = createHeatLayer(casesPoints, casesDetails, "cases");
        casesLayer = heatLayer;
        casesMarkersLayer = markersLayer;
      }
  
      const deathsData = await fetchData(endpoints.deaths);
      if (deathsData.length === 0) {
        console.warn("No data available for deaths.");
        deathsLayer = null;
        deathsMarkersLayer = null;
      } else {
        const { points: deathsPoints, details: deathsDetails } = await loadCoordinatesForData(
          deathsData,
          (item) => getDeathMonthlyInformationColour(item["Number of deaths"])
        );
        const { heatLayer, markersLayer } = createHeatLayer(deathsPoints, deathsDetails, "deaths");
        deathsLayer = heatLayer;
        deathsMarkersLayer = markersLayer;
      }
  
      const vaccinationsData = await fetchData(endpoints.vaccines);
      if (vaccinationsData.length === 0) {
        console.warn("No data available for vaccinations.");
        vaccinationsLayer = null;
        vaccinationsMarkersLayer = null;
      } else {
        const { points: vaccinationsPoints, details: vaccinationsDetails } = await loadCoordinatesForData(
          vaccinationsData,
          (item) => getVaccinationMonthlyInformationColour(item["Number_received_three_vaccines"])
        );
        const { heatLayer, markersLayer } = createHeatLayer(
          vaccinationsPoints,
          vaccinationsDetails,
          "vaccinations"
        );
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
  
  function createHeatLayer(points, details, layerType) {
    if (details.length === 0) {
      console.warn(`No details available for layer: ${layerType}`);
      return null;
    }
  
    console.log("Details for markers:", details); // Debugging log
  
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
      let hasData = false;
  
      if (layerType === "cases" && detail.value["Number of tests positive for COVID-19"]) {
        popupContent += `<strong>Cases:</strong> ${detail.value["Number of tests positive for COVID-19"]}`;
        hasData = true;
      } else if (layerType === "deaths" && detail.value["Number of deaths"]) {
        popupContent += `<strong>Deaths:</strong> ${detail.value["Number of deaths"]}`;
        hasData = true;
      } else if (layerType === "vaccinations" && detail.value["Number_received_three_vaccines"]) {
        popupContent += `<strong>Vaccinations:</strong> ${detail.value["Number_received_three_vaccines"]}`;
        hasData = true;
      }
  
      if (!hasData) return; // Skip if no relevant data
  
      const marker = L.marker([detail.lat, detail.lng], { zIndexOffset: 1000 }).bindPopup(popupContent);
  
      markersLayer.addLayer(marker);
    });
  
    return { heatLayer, markersLayer };
  }
  
  function showLayer(type) {
    // Remove existing layers
    if (casesLayer) map.removeLayer(casesLayer);
    if (casesMarkersLayer) map.removeLayer(casesMarkersLayer);
    if (deathsLayer) map.removeLayer(deathsLayer);
    if (deathsMarkersLayer) map.removeLayer(deathsMarkersLayer);
    if (vaccinationsLayer) map.removeLayer(vaccinationsLayer);
    if (vaccinationsMarkersLayer) map.removeLayer(vaccinationsMarkersLayer);
  
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
    selectedDate = `${new Date(`${year}-${month}-01`).toLocaleString("default", {
      month: "long",
    })} ${year}`;
    loadData();
  }
  
  window.showLayer = showLayer;
  window.updateMonth = updateMonth;
  
  loadData();