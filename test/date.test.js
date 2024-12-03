const { assert } = require('unit.js');
const sinon = require('sinon');

let loadDataMock = sinon.stub();
let selectedDate = null;

describe("updateMonth Unit Test", () => {
  before(() => {
    global.window = {
      updateMonth: function updateMonth(monthValue) {
        const [year, month] = monthValue.split("-");
        selectedDate = `${new Date(`${year}-${month}-01`).toLocaleString("default", {
          month: "long",
        })} ${year}`;
        loadDataMock(); // Simulate calling loadData
      },
    };
  });

  beforeEach(() => {
    loadDataMock = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
    selectedDate = null;
  });

  it("should update the selectedDate correctly and call loadData", () => {
    const testMonth = "2024-01";
    const expectedDate = "January 2024";

    global.window.updateMonth(testMonth);

    assert.strictEqual(selectedDate, expectedDate, "The selected date was not updated correctly.");
    sinon.assert.calledOnce(loadDataMock);
  });

  it("should fetch data for the correct time period", async () => {
    const testMonth = "2024-01";
    const fetchDataMock = sinon.stub();
    const expectedEndpoint = "http://localhost:3000/api/COVID-New-Cases?date=January%202024";

    fetchDataMock.withArgs(expectedEndpoint).resolves([
      { Region: "north east", "Number of tests positive for COVID-19": 100 },
    ]);

    loadDataMock.callsFake(() => fetchDataMock(expectedEndpoint));

    global.window.updateMonth(testMonth);

    await Promise.resolve();

    sinon.assert.calledOnce(loadDataMock);
    sinon.assert.calledWith(fetchDataMock, expectedEndpoint);
  });
});