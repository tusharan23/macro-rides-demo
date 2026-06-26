// ==========================================
// 1. MAP INITIALIZATION
// ==========================================
const map = L.map('map').setView([28.6139, 77.2090], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// ==========================================
// 1.5 DRAW MACRO RIDES OPERATIONAL ZONE
// ==========================================
// A 12km radius representing the overall service boundary
L.circle([28.6139, 77.2090], {
    color: '#6f42c1',       // Purple border
    weight: 2,
    dashArray: '5, 5',      // Makes it a dashed line
    fillColor: '#6f42c1',
    fillOpacity: 0.05,      // Very faint so it doesn't hide the map
    radius: 12000           // 12,000 meters (12km)
}).addTo(map);

// ==========================================
// 2. OUR DATA VARIABLES (Passengers & Route)
// ==========================================
const pickupPoints = [
    { id: 1, lat: 28.6139, lng: 77.2090 }, // Central Delhi
    { id: 2, lat: 28.6250, lng: 77.2150 }, // Nearby passenger 1
    { id: 3, lat: 28.6050, lng: 77.2200 }, // Nearby passenger 2
    { id: 4, lat: 28.5355, lng: 77.3910 }, // Far passenger (Noida)
    { id: 5, lat: 28.4595, lng: 77.0266 }  // Far passenger (Gurgaon)
];

const driverRouteCoords = [
    [28.6139, 77.2090], // Start near Central Delhi
    [28.6160, 77.2120],
    [28.6190, 77.2160],
    [28.6220, 77.2190],
    [28.6260, 77.2220]  // End further northeast
];

// ==========================================
// 3. DRAW THE DRIVER'S ROUTE
// ==========================================
const routeLine = L.polyline(driverRouteCoords, {
    color: '#007bff', 
    weight: 5,        
    opacity: 0.8
}).addTo(map);

map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

// ==========================================
// 4. SIMULATION STATE & ELEMENTS
// ==========================================
const RESOLUTION = 9;
let activeIndex = 0; // This acts like our 'i' in a C++ for-loop
let simInterval = null;

// Create a "Car" marker and put it at the starting line
const carMarker = L.circleMarker(driverRouteCoords[0], {
    color: 'black',
    fillColor: '#ffc107', // Yellow taxi color
    fillOpacity: 1,
    radius: 10
}).addTo(map);

// Groups to hold our dynamic shapes so we can wipe them clean every frame
const hexLayerGroup = L.layerGroup().addTo(map);
const passengerLayerGroup = L.layerGroup().addTo(map);

// ==========================================
// 5. THE UPDATE LOOP (The Engine)
// ==========================================
function updateFrame() {
    // Clear the previous frame's drawings
    hexLayerGroup.clearLayers();
    passengerLayerGroup.clearLayers();

    // 1. Move the car to the new activeIndex
    const currentCoord = driverRouteCoords[activeIndex];
    carMarker.setLatLng(currentCoord);

    // 2. Build the Hexagon Shield for the current position
    const corridorHexagons = new Set();
    const centerHex = h3.latLngToCell(currentCoord[0], currentCoord[1], RESOLUTION);
    const bufferHexes = h3.gridDisk(centerHex, 1);
    bufferHexes.forEach(hex => corridorHexagons.add(hex));

    // Draw the new shield
    corridorHexagons.forEach(hexId => {
        const hexBoundary = h3.cellToBoundary(hexId);
        L.polygon(hexBoundary, {
            color: '#00ffff', fillColor: '#00ffff', fillOpacity: 0.3, weight: 1
        }).addTo(hexLayerGroup);
    });

    // 3. Evaluate Passengers against the new shield
    pickupPoints.forEach(passenger => {
        const passengerHex = h3.latLngToCell(passenger.lat, passenger.lng, RESOLUTION);
        let markerColor = corridorHexagons.has(passengerHex) ? '#28a745' : 'red';

        L.circleMarker([passenger.lat, passenger.lng], {
            color: markerColor, fillColor: markerColor, fillOpacity: 1, radius: 8
        }).addTo(passengerLayerGroup);
    });

    // 4. Increment the loop, or stop if we reached the end
    activeIndex++;
    if (activeIndex >= driverRouteCoords.length) {
        clearInterval(simInterval); // Stop the timer
        document.getElementById('status').innerText = "Status: Route Completed";
        document.getElementById('sim-btn').disabled = false;
    }
}

// ==========================================
// 6. CONNECT THE START BUTTON
// ==========================================
const simBtn = document.getElementById('sim-btn');
simBtn.disabled = false; // Enable the button now that code is ready

simBtn.addEventListener('click', () => {
    // Reset state to the beginning
    activeIndex = 0;
    document.getElementById('status').innerText = "Status: Driver in Transit...";
    simBtn.disabled = true; // Prevent clicking while running

    // Run the first frame immediately
    updateFrame(); 
    
    // Start the loop (Run updateFrame every 1000 milliseconds)
    simInterval = setInterval(updateFrame, 1000);
});