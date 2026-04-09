# NS-3 MANET (AODV) Quick Setup

This folder contains a ready NS-3 simulation for MANET using built-in AODV routing.

## Files

- manet-aodv.cc: Main NS-3 simulation program
- run-scenarios.ps1: Runs multiple mobility-speed scenarios quickly
- run_scenarios.py: Python runner to execute scenarios and export CSV

## What this simulation does

- Creates N wireless adhoc nodes
- Uses RandomWaypoint mobility
- Uses AODV routing
- Sends UDP traffic from source node to destination node
- Prints metrics:
  - Tx packets
  - Rx packets
  - PDR (Packet Delivery Ratio)
  - Throughput (Kbps)
  - Average Delay (ms)

## 1) Install NS-3

Use any NS-3 version that supports the modules used in this file (recent versions work well).

## 2) Copy into NS-3 scratch

From this project:

- Copy manet-aodv.cc
- Paste into your NS-3 folder under scratch/

Example destination:

- C:/ns-3-dev/scratch/manet-aodv.cc

## 3) Run one simulation

From NS-3 root folder:

```bash
./ns3 run "scratch/manet-aodv --nNodes=20 --simTime=60 --txRange=120 --nodeSpeed=8 --packetSize=512 --dataRate=256kbps"
```

On Windows PowerShell:

```powershell
.\ns3 run "scratch/manet-aodv --nNodes=20 --simTime=60 --txRange=120 --nodeSpeed=8 --packetSize=512 --dataRate=256kbps"
```

## 4) Run multiple scenarios quickly

Edit Ns3Root in run-scenarios.ps1 if needed, then:

```powershell
cd <this-project>/ns3
./run-scenarios.ps1 -Ns3Root "C:\ns-3-dev"
```

## 5) Run with Python automation (recommended for reports)

From this `ns3` folder:

```powershell
python run_scenarios.py --ns3-root "C:\ns-3-dev" --speeds "2,6,10,14"
```

What this does:

- Copies `manet-aodv.cc` into `NS3_ROOT/scratch/`
- Runs each scenario speed one by one
- Parses printed metrics from NS-3 output
- Saves summary CSV to `ns3/results.csv`
- Saves raw logs to `ns3/logs/`

CSV columns:

- node_speed
- tx_packets
- rx_packets
- pdr_percent
- throughput_kbps
- avg_delay_ms
- exit_code

## Suggested viva experiment

Run with different node speeds and compare PDR/Delay.

- nodeSpeed=2
- nodeSpeed=6
- nodeSpeed=10
- nodeSpeed=14

Expected trend:

- Higher mobility often reduces route stability
- PDR may drop and delay may increase

## Useful parameter variations

- Increase nNodes to test density
- Reduce txRange to create frequent link breaks
- Increase dataRate to test congestion effect

## Notes

- This is a simulation-first implementation (instructor-aligned for networking projects).
- You can keep your React app as a separate visualization demo, but present NS-3 results as the core technical part.
