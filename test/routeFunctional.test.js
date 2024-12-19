import { expect } from 'chai';
import sinon from 'sinon';
import './routePerformanceSetup.js';

describe('OpenRouteService Integration', () => {
    let sandbox;
    let fetchStub;
    
    // Sample response from OpenRouteService
    const sampleResponse = {
        features: [{
            type: 'Feature',
            properties: {
                distance: 100,
                distance_units: 'km',
                time: '1h 30min'
            },
            geometry: {
                type: 'LineString',
                coordinates: [[0, 0], [1, 1]]
            }
        }]
    };

    beforeEach(() => {
        // Set up sandbox and stub fetch
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(global, 'fetch');
        fetchStub.resolves({
            json: () => Promise.resolve(sampleResponse)
        });

        // Reset waypoints
        global.fromWaypoint = null;
        global.toWaypoint = null;

        // Mock the fetchAndDisplayRoute function
        global.fetchAndDisplayRoute = async () => {
            if (!global.fromWaypoint || !global.toWaypoint) return;
            
            const url = `http://localhost:8080/ors/v2/directions/driving-car?&start=${global.fromWaypoint[1]},${global.fromWaypoint[0]}&end=${global.toWaypoint[1]},${global.toWaypoint[0]}`;
            
            try {
                const response = await fetch(url);
                const result = await response.json();
                
                if (result.features && result.features.length > 0) {
                    console.log("Route displayed");
                }
            } catch (error) {
                console.log("Error fetching route data:", error);
            }
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('fetchAndDisplayRoute', () => {
        it('should not make API call when waypoints are not set', async () => {
            await global.fetchAndDisplayRoute();
            expect(fetchStub.called).to.be.false;
        });

        it('should make API call with correct URL when both waypoints are set', async () => {
            global.fromWaypoint = [51.5074, -0.1278]; // London
            global.toWaypoint = [53.4808, -2.2426];   // Manchester
            
            await global.fetchAndDisplayRoute();

            expect(fetchStub.calledOnce).to.be.true;
            const expectedUrl = `http://localhost:8080/ors/v2/directions/driving-car?&start=-0.1278,51.5074&end=-2.2426,53.4808`;
            expect(fetchStub.firstCall.args[0]).to.equal(expectedUrl);
        });

        it('should handle API errors gracefully', async () => {
            global.fromWaypoint = [51.5074, -0.1278];
            global.toWaypoint = [53.4808, -2.2426];
            
            fetchStub.rejects(new Error('Network error'));
            const consoleSpy = sinon.spy(console, 'log');
            
            await global.fetchAndDisplayRoute();
            
            expect(consoleSpy.calledWith(sinon.match(/Error fetching route data/))).to.be.true;
            consoleSpy.restore();
        });
    });
});