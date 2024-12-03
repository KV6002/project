const { assert } = require('unit.js');
const sinon = require('sinon');

const addHeatmapLayerMock = sinon.stub();
const fetchDataMock = sinon.stub();
let selectedDate = null;

describe("Viewing Cases in Heatmap Unit Test", () => {
  before(() => {
    global.window = {
      updateCasesHeatmap: function updateCasesHeatmap(date) {
        selectedDate = date;
        const endpoint = `http://localhost:3000/api/COVID-New-Cases?date=${date}`;
        return fetchDataMock(endpoint).then((data) => {
          if (data.length > 0) {
            const heatmapData = data.map((entry) => ({
              location: entry.Region,
              density: entry["Number of tests positive for COVID-19"],
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

  it("should update the heatmap correctly with cases data for a given date", async () => {
    const testDate = "2024-01";
    const mockData = [
      { Region: "north east", "Number of tests positive for COVID-19": 500 },
      { Region: "north west", "Number of tests positive for COVID-19": 300 },
    ];
    fetchDataMock.withArgs(`http://localhost:3000/api/COVID-New-Cases?date=${testDate}`).resolves(mockData);

    await global.window.updateCasesHeatmap(testDate);

    assert.strictEqual(selectedDate, testDate);
    sinon.assert.calledOnce(fetchDataMock);
    sinon.assert.calledOnce(addHeatmapLayerMock);
  });

  it("should handle no data gracefully and not call addHeatmapLayerMock", async () => {
    const testDate = "2024-02";
    fetchDataMock.withArgs(`http://localhost:3000/api/COVID-New-Cases?date=${testDate}`).resolves([]);

    await global.window.updateCasesHeatmap(testDate);

    sinon.assert.calledOnce(fetchDataMock);
    sinon.assert.notCalled(addHeatmapLayerMock);
  });
});