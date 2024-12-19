import { JSDOM } from 'jsdom';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: `file://${__dirname}/index.html`,
    pretendToBeVisual: true,
    resources: 'usable'
});

// Properly set up the window and its properties
const { window } = dom;
const { document } = window;

// Define properties on global object
Object.defineProperties(global, {
    window: {
        value: window,
        writable: true
    },
    document: {
        value: document,
        writable: true
    },
    HTMLElement: {
        value: window.HTMLElement,
        writable: true
    },
    Element: {
        value: window.Element,
        writable: true
    }
});

// Set up navigator using window's navigator
Object.defineProperty(global, 'navigator', {
    value: window.navigator,
    writable: true
});

// Mock Leaflet functionality
global.L = {
    map: () => ({
        setView: () => ({
            on: () => {},
            fire: () => {},
            remove: () => {},
            addLayer: () => {}
        }),
        addLayer: () => {},
        removeLayer: () => {},
        eachLayer: () => {}
    }),
    tileLayer: () => ({
        addTo: () => {}
    }),
    marker: () => ({
        addTo: () => ({
            bindPopup: () => ({
                openPopup: () => {}
            })
        })
    }),
    geoJSON: () => ({
        bindPopup: () => ({
            addTo: () => {}
        })
    })
};

// Add any missing properties that might be needed by the tests
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);