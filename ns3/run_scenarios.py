import argparse
import csv
import re
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List


def parse_metrics(output: str) -> Dict[str, float]:
    patterns = {
        "tx_packets": r"Tx Packets\s*:\s*([0-9]+)",
        "rx_packets": r"Rx Packets\s*:\s*([0-9]+)",
        "pdr_percent": r"PDR \(%\)\s*:\s*([0-9]*\.?[0-9]+)",
        "throughput_kbps": r"Throughput \(Kbps\)\s*:\s*([0-9]*\.?[0-9]+)",
        "avg_delay_ms": r"Avg Delay \(ms\)\s*:\s*([0-9]*\.?[0-9]+)",
    }

    result: Dict[str, float] = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, output)
        result[key] = float(match.group(1)) if match else -1.0
    return result


def run_one(ns3_root: Path, speed: float, n_nodes: int, sim_time: float, tx_range: float, packet_size: int, data_rate: str) -> Dict[str, float]:
    cmd = [
        str(ns3_root / "ns3"),
        "run",
        (
            "scratch/manet-aodv "
            f"--nNodes={n_nodes} "
            f"--simTime={sim_time} "
            f"--txRange={tx_range} "
            f"--nodeSpeed={speed} "
            f"--packetSize={packet_size} "
            f"--dataRate={data_rate}"
        ),
    ]

    process = subprocess.run(
        cmd,
        cwd=ns3_root,
        text=True,
        capture_output=True,
        check=False,
    )

    full_output = process.stdout + "\n" + process.stderr
    metrics = parse_metrics(full_output)
    metrics["node_speed"] = speed
    metrics["exit_code"] = float(process.returncode)
    metrics["raw_output"] = full_output
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Run NS-3 MANET AODV scenarios and export metrics to CSV.")
    parser.add_argument("--ns3-root", required=True, help="Path to NS-3 root (for example: C:/ns-3-dev)")
    parser.add_argument("--speeds", default="2,6,10,14", help="Comma-separated speeds in m/s")
    parser.add_argument("--nNodes", type=int, default=20)
    parser.add_argument("--simTime", type=float, default=60.0)
    parser.add_argument("--txRange", type=float, default=120.0)
    parser.add_argument("--packetSize", type=int, default=512)
    parser.add_argument("--dataRate", default="256kbps")
    args = parser.parse_args()

    ns3_root = Path(args.ns3_root).expanduser().resolve()
    if not ns3_root.exists():
        raise FileNotFoundError(f"NS-3 root not found: {ns3_root}")

    source_cpp = Path(__file__).resolve().parent / "manet-aodv.cc"
    target_cpp = ns3_root / "scratch" / "manet-aodv.cc"
    if not source_cpp.exists():
        raise FileNotFoundError(f"Source file missing: {source_cpp}")

    shutil.copy2(source_cpp, target_cpp)

    speeds: List[float] = [float(item.strip()) for item in args.speeds.split(",") if item.strip()]

    results = []
    logs_dir = Path(__file__).resolve().parent / "logs"
    logs_dir.mkdir(exist_ok=True)

    for speed in speeds:
        print(f"Running scenario with nodeSpeed={speed} m/s")
        metrics = run_one(
            ns3_root=ns3_root,
            speed=speed,
            n_nodes=args.nNodes,
            sim_time=args.simTime,
            tx_range=args.txRange,
            packet_size=args.packetSize,
            data_rate=args.dataRate,
        )

        log_file = logs_dir / f"run_speed_{str(speed).replace('.', '_')}.txt"
        log_file.write_text(str(metrics["raw_output"]), encoding="utf-8")
        results.append(metrics)

    output_csv = Path(__file__).resolve().parent / "results.csv"
    fieldnames = [
        "node_speed",
        "tx_packets",
        "rx_packets",
        "pdr_percent",
        "throughput_kbps",
        "avg_delay_ms",
        "exit_code",
    ]

    with output_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in results:
            writer.writerow({key: row.get(key, "") for key in fieldnames})

    print(f"\nSaved summary CSV: {output_csv}")
    print(f"Saved detailed logs in: {logs_dir}")


if __name__ == "__main__":
    main()
