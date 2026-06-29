// =========================================================================
// SIMULATION CONTROLLER CLASS (Encapsulated & Scalable Architecture)
// =========================================================================
class SimulationController {
    constructor() {
        // Configuration Parameters
        this.RESOLUTION = 9;
        this.UPDATE_INTERVAL_MS = 1000;
        
        // State Management
        this.activeIndex = 0;
        this.simInterval = null;
        
        // Mock Data: Coordinates representing a route through Delhi
        this.driverRouteCoords = [
            [28.6139, 77.2090], // Central Delhi (Connaught Place)
            [28.6200, 77.2110],
            [28.6260, 77.2140],
            [28.6320, 77.2180],
            [28.6380, 77.2220],
            [28.6440, 77.2250]  // Ending point
        ];

        this.pickupPoints = [
            { id: 1, lat: 28.6139, lng: 77.2090, name: "Passenger A" }, 
            { id: 2, lat: 28.6250, lng: 77.2150, name: "Passenger B" }, 
            { id: 3, lat: 28.6350, lng: 77.2300, name: "Passenger C" }, 
            { id: 4, lat: 28.6420, lng: 77.2240, name: "Passenger D" }
        ];

        // Initialize components
        this.initMap();
        this.initLayers();
        this.drawOperationalZone();
        this.setupEventListeners();
    }

    // 1. Initialize Leaflet Map
    initMap() {
        this.map = L.map('map').setView([28.6139, 77.2090], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    // 2. Initialize Visual Layer Groups
    initLayers() {
        this.routeLayerGroup = L.layerGroup().addTo(this.map);
        this.hexLayerGroup = L.layerGroup().addTo(this.map);
        this.passengerLayerGroup = L.layerGroup().addTo(this.map);
    }

    // 3. Draw a realistic Operational Service Boundary Polygon
    drawOperationalZone() {
        const operationalZoneCoords = [
            [28.6600, 77.1800],
            [28.6600, 77.2500],
            [28.5800, 77.2500],
            [28.5800, 77.1800]
        ];

        L.polygon(operationalZoneCoords, {
            color: '#6f42c1',
            weight: 2,
            dashArray: '5, 5',
            fillColor: '#6f42c1',
            fillOpacity: 0.03
        }).addTo(this.map);
    }

    // 4. Generate Spatial Buffer & Update UI per frame
    updateFrame() {
        this.hexLayerGroup.clearLayers();
        this.passengerLayerGroup.clearLayers();

        const currentCoord = this.driverRouteCoords[this.activeIndex];
        L.marker(currentCoord).addTo(this.hexLayerGroup);

        // Calculate active H3 corridor (k-ring = 1 around active hex provides ~350m buffer)
        const centerHex = h3.latLngToCell(currentCoord[0], currentCoord[1], this.RESOLUTION);
        const kRingHexagons = h3.gridDisk(centerHex, 1);
        const corridorHexagons = new Set(kRingHexagons);

        // Render H3 Hexagons on map
        corridorHexagons.forEach(hex => {
            const boundaries = h3.cellToBoundary(hex);
            L.polygon(boundaries, {
                color: '#28a745',
                weight: 1,
                fillColor: '#28a745',
                fillOpacity: 0.15
            }).addTo(this.hexLayerGroup);
        });

        // Evaluate passenger eligibility dynamically
        this.pickupPoints.forEach(passenger => {
            const passengerHex = h3.latLngToCell(passenger.lat, passenger.lng, this.RESOLUTION);
            const isEligible = corridorHexagons.has(passengerHex);
            const markerColor = isEligible ? '#28a745' : '#dc3545';

            L.circleMarker([passenger.lat, passenger.lng], {
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.8,
                radius: 8
            })
            .bindPopup(`<b>${passenger.name}</b><br>Status: ${isEligible ? 'Eligible' : 'Out of Range'}`)
            .addTo(this.passengerLayerGroup);
        });

        this.activeIndex++;
        if (this.activeIndex >= this.driverRouteCoords.length) {
            this.stopSimulation();
        }
    }

    // 5. Execution Controls
    startSimulation() {
        this.activeIndex = 0;
        this.simBtn.disabled = true;
        document.getElementById('status').innerText = "Status: Driver in Transit...";
        
        this.updateFrame(); 
        this.simInterval = setInterval(() => this.updateFrame(), this.UPDATE_INTERVAL_MS);
    }

    stopSimulation() {
        clearInterval(this.simInterval);
        document.getElementById('status').innerText = "Status: Route Completed";
        this.simBtn.disabled = false;
    }

    setupEventListeners() {
        this.simBtn = document.getElementById('sim-btn');
        this.simBtn.addEventListener('click', () => this.startSimulation());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SimulationController();
});