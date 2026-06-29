# Macro Rides - Zone Boundary & Dynamic Route Corridor Visualizer

A professional hyperlocal visualization tool tracking simulated vehicle movement, mapping dynamic route corridors using Uber's H3 spatial index, and assessing passenger collection eligibility.

## Architecture & Technical Approach

### 1. Spatial Indexing via Uber H3
* **Resolution Selection:** Chosen at **Resolution 9**. An H3 hexagon at Resolution 9 features an average edge length of `174.3 meters`. 
* **Corridor Calculation:** Using `h3.gridDisk(centerHex, 1)` yields the origin hex and its direct neighbors (a 1-ring expansion). This constructs a continuous geospatial corridor roughly **348 meters** wide, successfully mimicking the required **350-meter buffer**.

### 2. Rendering Pipeline
* **Leaflet.js:** Chosen for lightweight, high-performance canvas layer handling.
* **Architecture:** Structured as an object-oriented JavaScript class (`SimulationController`) to protect application states, ensuring code scalability and distinct separation of concerns