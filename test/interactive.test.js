const { assert } = require('unit.js');
const sinon = require('sinon');

describe("Interactive Map Unit Test", () => {
  let mapMock, setViewMock, fitBoundsMock, onMock, loadRegionDataMock;

  before(() => {
    // Mock map object and functions
    setViewMock = sinon.stub();
    fitBoundsMock = sinon.stub();
    onMock = sinon.stub();
    loadRegionDataMock = sinon.stub();

    mapMock = {
      setView: setViewMock,
      fitBounds: fitBoundsMock,
      on: onMock,
    };

    // Simulate global map initialization
    global.initializeMap = function initializeMap() {
      // Example setup for the map
      return mapMock;
    };

    global.loadRegionData = loadRegionDataMock;
  });

  beforeEach(() => {
    // Reset mocks before each test
    setViewMock.reset();
    fitBoundsMock.reset();
    onMock.reset();
    loadRegionDataMock.reset();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should zoom to a specific region when zoomToRegion is called", () => {
    const regionCoordinates = [54.9783, -1.6174]; // Example coordinates (Newcastle)
    const zoomLevel = 12;

    // Function to zoom to a region
    function zoomToRegion(region, zoom) {
      mapMock.setView(region, zoom);
    }

    zoomToRegion(regionCoordinates, zoomLevel);

    sinon.assert.calledOnce(setViewMock);
    sinon.assert.calledWith(setViewMock, regionCoordinates, zoomLevel);
  });

  it("should move to bounds when moveToBounds is called", () => {
    const bounds = [
      [54.9783, -1.6174], // Southwest corner
      [55.0000, -1.6000], // Northeast corner
    ];

    // Function to move to bounds
    function moveToBounds(map, areaBounds) {
      map.fitBounds(areaBounds);
    }

    moveToBounds(mapMock, bounds);

    sinon.assert.calledOnce(fitBoundsMock);
    sinon.assert.calledWith(fitBoundsMock, bounds);
  });

  it("should load data for a region when a region is selected", async () => {
    const regionName = "north east";
    const mockRegionData = {
      region: "north east",
      cases: 100,
      deaths: 10,
      vaccinations: 80,
    };

    loadRegionDataMock.withArgs(regionName).resolves(mockRegionData);

    // Function to handle region selection
    async function selectRegion(region) {
      return await loadRegionDataMock(region);
    }

    const regionData = await selectRegion(regionName);

    assert.strictEqual(regionData.region, "north east");
    assert.strictEqual(regionData.cases, 100);
    sinon.assert.calledOnce(loadRegionDataMock);
    sinon.assert.calledWith(loadRegionDataMock, regionName);
  });

  it("should add event listeners for map interaction", () => {
    const events = ["zoomend", "dragend"];

    // Function to add event listeners
    function addMapEventListeners(map, eventList) {
      eventList.forEach((event) => map.on(event, () => console.log(`${event} event triggered`)));
    }

    addMapEventListeners(mapMock, events);

    sinon.assert.calledTwice(onMock);
    sinon.assert.calledWith(onMock, "zoomend");
    sinon.assert.calledWith(onMock, "dragend");
  });

  it("should handle errors gracefully when data fails to load", async () => {
    const regionName = "unknown region";

    loadRegionDataMock.withArgs(regionName).rejects(new Error("Data not found"));

    // Function to handle region selection with error handling
    async function selectRegion(region) {
      try {
        return await loadRegionDataMock(region);
      } catch (error) {
        return { error: error.message };
      }
    }

    const result = await selectRegion(regionName);

    assert.strictEqual(result.error, "Data not found");
    sinon.assert.calledOnce(loadRegionDataMock);
    sinon.assert.calledWith(loadRegionDataMock, regionName);
  });
});