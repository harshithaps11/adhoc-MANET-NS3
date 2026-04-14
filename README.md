# Adhoc Wireless Network Simulator (MANET)

A beginner-friendly mini-project that simulates communication in a Mobile Adhoc Network (MANET), where nodes communicate without fixed infrastructure.

## What is MANET?

MANET (Mobile Adhoc Network) is a decentralized wireless network:
- No central router or base station
- Each node can move and act as both sender and forwarder
- Network topology changes dynamically as nodes move

This simulator demonstrates how routes are discovered and how packets travel hop-by-hop.

## Tech Stack

- Frontend: React + Vite + CSS
- Backend: Node.js + Express
- Communication: REST API
- NS-3: AODV MANET simulation (in `ns3/` folder)

## Project Structure

- frontend: React app for visualization and interaction
- backend: Express server for graph and route logic
- ns3: NS-3 MANET simulation with built-in AODV protocol

## NS-3 Instructor-Aligned Implementation

If your faculty requires NS-3, use the implementation in `ns3/`:

- Simulation file: `ns3/manet-aodv.cc`
- Scenario runner: `ns3/run-scenarios.ps1`
- Setup and run guide: `ns3/README.md`

This NS-3 flow should be presented as the core networking simulation for evaluation.

## Features Implemented

- Add nodes dynamically by clicking on canvas
- Drag nodes to simulate movement
- Transmission range shown as circle around each node
- Automatic link generation for nodes inside range
- Source/Destination selection
- BFS-based route discovery (simplified AODV behavior)
- Route highlighting on canvas
- Packet animation step-by-step along discovered route
- Mobility simulation toggle (random movement)
- Link failure toggle (random link drops)
- Adjustable transmission range slider
- Routing logs (RREQ and RREP style messages)
- Hop count and latency display
- Legend for node and packet states
- Reset button to restart full simulation

## Routing Logic (Simplified AODV Style)

1. Source sends route request (RREQ)
2. BFS explores neighbors level-by-level
3. When destination is found, shortest path is reconstructed
4. Route reply (RREP) is logged and returned
5. Frontend animates packet transmission hop-by-hop

Why BFS?
- BFS naturally finds the shortest path in an unweighted graph
- Easy to understand and explain in viva

## API Endpoints

### POST /add-node
Registers a node in backend graph.

Request body:
```json
{ "id": 1 }
```

### POST /connect-nodes
Connects nodes in graph.

Single edge:
```json
{ "from": 1, "to": 2 }
```

Batch replace mode (used by frontend):
```json
{
  "replace": true,
  "edges": [
    { "from": 1, "to": 2 },
    { "from": 2, "to": 3 }
  ]
}
```

### POST /find-route
Returns shortest route from source to destination.

Request body:
```json
{ "sourceId": 1, "destinationId": 4 }
```

Sample response:
```json
{
  "path": [1, 2, 4],
  "hopCount": 2,
  "latencyMs": 50,
  "logs": [
    "RREQ initiated from Node 1",
    "Exploring neighbors of Node 1",
    "RREQ forwarded: Node 1 -> Node 2",
    "Destination Node 4 discovered.",
    "RREP sent back through route: 1 -> 2 -> 4"
  ]
}
```

## How to Run

Open two terminals from project root.

### Quick safe setup (recommended)

From project root:

```powershell
./scripts/check-prereqs.ps1
./scripts/setup-safe.ps1
./scripts/start-web.ps1
```

What these scripts do safely:

- Install only project-local npm packages in `frontend/` and `backend/`
- Start backend and frontend in separate terminals
- Do not run destructive system commands

### 1) Run backend
```bash
cd backend
npm install
npm run start
```
Backend runs on: http://localhost:5000

### 2) Run frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on Vite default: http://localhost:5173

## NS-3 Installation (safe option)

For NS-3, run a dry run first:

```powershell
./scripts/install-ns3-ubuntu.ps1
```

To proceed with Ubuntu WSL + NS-3 installation:

```powershell
./scripts/install-ns3-ubuntu.ps1 -Proceed
```

Note: this may require admin approval and reboot because WSL distro installation is a system-level action.

## Deployment

This project has two deployment parts:

1. Web app deployment (React + Node API)
2. NS-3 simulation execution (Linux environment)

### Deploy React + Node (recommended stack: Render)

Backend service:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm run start`
- Environment variables:
  - `PORT` is provided by platform automatically
  - `CORS_ORIGIN` set to your deployed frontend URL

Frontend static site:

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL` set to your backend service URL

Tip: Copy `frontend/.env.example` to `.env` for local development and set `VITE_API_BASE_URL`.

### About NS-3 deployment

NS-3 is not a browser app deployment target. Run it on Linux/WSL (or a Linux VM/server) and present results using:

- terminal metrics output
- NetAnim XML playback (`manet-aodv.xml`)
- CSV logs from `ns3/run_scenarios.py`

## Demo Scenario (Quick Viva Flow)

1. Click 5 to 7 points on canvas to add nodes.
2. Set source and destination from dropdowns.
3. Keep range around 130 to 160 and click "Find Route & Send Packet".
4. Show highlighted route and moving packet.
5. Enable mobility and observe changing links.
6. Enable link failure and test route rediscovery.
7. Use reset to restart and repeat with a new topology.

## Notes for Explanation

- Frontend handles visualization and user interaction.
- Backend maintains graph + BFS logic.
- Link creation is based on Euclidean distance and transmission range.
- Latency is a simple educational estimate: `hopCount * 25 ms`.

## Scripts

### Frontend
- npm run dev
- npm run build

### Backend
- npm run start
- npm run dev
