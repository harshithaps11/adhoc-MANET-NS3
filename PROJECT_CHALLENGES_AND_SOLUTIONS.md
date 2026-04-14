# Adhoc MANET NS-3 Project: Challenges, Decisions, and Solutions

## 1. Project Goal

Build a useful MANET project that is easy to explain and strong enough for evaluation.

Final approach used:
- NS-3 as the main simulation engine (core technical part)
- React + Node.js as an interactive visualization and API layer (supporting part)

Why this was chosen:
- NS-3 gives authentic networking simulation and measurable performance metrics.
- React view makes the concept easier to demonstrate clearly in viva.

## 2. Architecture Chosen

### A. Frontend (React)
- Purpose: visual node creation, movement, route highlighting, and packet animation.
- Main components:
  - NetworkCanvas
  - ControlPanel
  - InfoPanel
- Features included:
  - Add node by click
  - Drag nodes
  - Transmission range visualization
  - Source and destination selection
  - Route highlighting and packet animation

### B. Backend (Node + Express)
- Purpose: maintain graph state and run routing logic through APIs.
- Core APIs:
  - POST /add-node
  - POST /connect-nodes
  - POST /find-route
  - POST /reset
- Routing method: BFS (shortest path in unweighted graph).

### C. NS-3 (Linux/WSL)
- Purpose: real MANET simulation with AODV.
- Output used for evaluation:
  - Packet Delivery Ratio (PDR)
  - Throughput
  - Delay
- Visual simulation output:
  - NetAnim XML trace files

## 3. Major Challenges Faced and How They Were Solved

### Challenge 1: Frontend routing appeared to do nothing
Problem:
- UI interactions worked (node movement/mobility), but route action looked non-functional.

Root cause:
- Timing and sync issues between frontend graph updates and backend graph registration.

Solution:
- Improved sync flow between node creation, edge generation, and API calls.
- Added backend graph debug endpoint for validation.
- Verified route API directly with known sample graph.

Result:
- Routing and packet animation became reliable.

### Challenge 2: Windows path and shell command issues
Problem:
- PowerShell commands failed due to spaces in path.

Solution:
- Used quoted full paths and safer navigation patterns.
- Added setup helper scripts to reduce manual command errors.

Result:
- Reproducible local setup with fewer command mistakes.

### Challenge 3: NS-3 on Windows confusion
Problem:
- NS-3 does not run as a normal native Windows web app workflow.

Solution:
- Installed and used NS-3 through WSL Ubuntu.
- Automated setup using installer script approach.

Result:
- Stable NS-3 environment on Windows laptop without replacing OS.

### Challenge 4: NS-3 build error in manet source
Problem:
- Compile error related to incomplete flow classifier type.

Solution:
- Added required header include for IPv4 flow classifier.
- Rebuilt and re-ran simulation.

Result:
- Successful build and real metric output.

### Challenge 5: Need for real visual simulation
Problem:
- Requirement to show not only metrics but also simulation visuals.

Solution:
- Added NetAnim trace generation in NS-3 code.
- Built NetAnim tool in WSL environment.

Result:
- Generated XML traces and enabled visual packet/node playback.

### Challenge 6: Render backend showed Cannot GET /
Problem:
- Backend deployed but opening base URL returned Cannot GET /.

Root cause:
- No GET route at root path.

Solution:
- Added GET / health route.
- Pushed latest commit and redeployed.

Result:
- Backend base URL now expected to return service health JSON.

### Challenge 7: Render could not find GitHub repo
Problem:
- Repo not visible in Render repository picker.

Solution:
- Verified remote and push status.
- Corrected account/repo access synchronization.
- Confirmed repo branch and remote reachability.

Result:
- Repository became selectable for deployment.

## 4. Methods and Practices Used

- Kept architecture modular and beginner-friendly.
- Used BFS for clarity and viva explainability.
- Used API-based separation between visualization and logic.
- Added debug endpoint for faster troubleshooting.
- Validated with direct endpoint tests and compile checks.
- Added deployment-safe environment variable support:
  - frontend API base URL from env
  - backend port and CORS origin from env

## 5. Why This Final Method Is Useful

- Academically strong: NS-3 and AODV-based simulation.
- Practically understandable: React view for demonstration.
- Easy to explain: simple data flow and clear modules.
- Easy to extend: can add OLSR/DSDV comparison later.

## 6. Final Outcome

This project is now suitable for:
- viva explanation
- demo presentation
- recruiter portfolio (clear modular engineering + deployment effort)

It demonstrates both:
- simulation correctness (NS-3 metrics)
- user-facing communication quality (interactive visualization)

## 7. Future Improvements (Optional)

- Add protocol comparison mode (AODV vs OLSR vs DSDV).
- Add automatic chart generation from simulation CSV results.
- Add link-quality and energy-aware routing factors.
- Add direct NS-3 trace replay inside web UI.
