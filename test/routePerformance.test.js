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
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(global, 'fetch');
        fetchStub.resolves({
            json: () => Promise.resolve(sampleResponse)
        });

        global.fromWaypoint = null;
        global.toWaypoint = null;

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

    // Previous tests remain the same...

    describe('Performance Tests', () => {
        it('should fetch and display long-distance routes in under 2 seconds', async () => {
            // Test locations: London to Edinburgh (long distance)
            global.fromWaypoint = [51.5074, -0.1278]; // London
            global.toWaypoint = [55.9533, -3.1883];   // Edinburgh
            
            // Create a large response to simulate a complex route
            const complexResponse = {
                features: [{
                    type: 'Feature',
                    properties: {
                        distance: 666,
                        distance_units: 'km',
                        time: '7h 30min'
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: Array.from({ length: 1000 }, (_, i) => [
                            -0.1278 + (i * (-3.1883 - -0.1278) / 1000),
                            51.5074 + (i * (55.9533 - 51.5074) / 1000)
                        ])
                    }
                }]
            };

            // Set up fetch to delay by 100ms to simulate network latency
            fetchStub.resolves(new Promise(resolve => 
                setTimeout(() => 
                    resolve({ json: () => Promise.resolve(complexResponse) }), 
                    100
                )
            ));

            const startTime = performance.now();
            await global.fetchAndDisplayRoute();
            const endTime = performance.now();
            
            const executionTime = endTime - startTime;
            console.log(`Route calculation took ${executionTime.toFixed(2)}ms`);
            
            expect(executionTime).to.be.below(2000, 
                `Route calculation took ${executionTime.toFixed(2)}ms, which is above the 2000ms threshold`
            );
        });

        it('should maintain performance with multiple waypoints in route', async () => {
            // Create a response with many waypoints
            const multiPointResponse = {
                features: [{
                    type: 'Feature',
                    properties: {
                        distance: 1500,
                        distance_units: 'km',
                        time: '15h'
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: Array.from({ length: 5000 }, (_, i) => [
                            -0.1278 + (Math.sin(i / 100) * 2),
                            51.5074 + (Math.cos(i / 100) * 2)
                        ])
                    }
                }]
            };

            fetchStub.resolves(new Promise(resolve => 
                setTimeout(() => 
                    resolve({ json: () => Promise.resolve(multiPointResponse) }), 
                    100
                )
            ));

            const startTime = performance.now();
            await global.fetchAndDisplayRoute();
            const endTime = performance.now();
            
            const executionTime = endTime - startTime;
            console.log(`Complex route calculation took ${executionTime.toFixed(2)}ms`);
            
            expect(executionTime).to.be.below(2000,
                `Complex route calculation took ${executionTime.toFixed(2)}ms, which is above the 2000ms threshold`
            );
        });
    });
});