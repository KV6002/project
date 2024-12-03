const { assert } = require('unit.js');
const sinon = require('sinon');

const addHeatmapLayerMock = sinon.stub();
const fetchDataMock = sinon.stub();
let selectedDate = null;

describe("Viewing Deaths in Heatmap Unit Test", () => {
  before(() => {
    global.window = {
      updateDeathsHeatmap: function updateDeathsHeatmap(date) {
        selectedDate = date;
        const endpoint = `http://localhost:3000/api/COVID-NEW-Deaths?date=${date}`;
        return fetchDataMock(endpoint).then((data) => {
          if (data.length > 0) {
            const heatmapData = data.map((entry) => ({
              location: entry.Region,
              density: entry.DeathRate,
            }));
            addHeatmapLayerMock(heatmapData);
          }
        });
      },
    };
  });

  beforeEach(() => {
    addHeatmapLayerMock.reset();
    fetchDataMock.reset();
  });

  it("should update the heatmap correctly with deaths data for a given date", async () => {
    const testDate = "2024-01";
    const mockData = [
      { Region: "north east", DeathRate: 50 },
      { Region: "north west", DeathRate: 30 },
    ];
    fetchDataMock.withArgs(`http://localhost:3000/api/COVID-NEW-Deaths?date=${testDate}`).resolves(mockData);

    await global.window.updateDeathsHeatmap(testDate);

    assert.strictEqual(selectedDate, testDate);
    sinon.assert.calledOnce(fetchDataMock);
    sinon.assert.calledOnce(addHeatmapLayerMock);
  });

  it("should handle no data gracefully and not call addHeatmapLayerMock", async () => {
    const testDate = "2024-02";
    fetchDataMock.withArgs(`http://localhost:3000/api/COVID-NEW-Deaths?date=${testDate}`).resolves([]);

    await global.window.updateDeathsHeatmap(testDate);

    sinon.assert.calledOnce(fetchDataMock);
    sinon.assert.notCalled(addHeatmapLayerMock);
  });
});