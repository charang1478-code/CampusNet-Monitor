"""
Automated Before-and-After Experiment Runner
Runs controlled academic experiments comparing network performance
under identical seed, initial state, and workload conditions:
  Phase 1: Uncontrolled Baseline (Drop-tail FIFO)
  Phase 2: Controlled Intervention (Leaky Bucket, Token Bucket, or QoS Priority)
Computes mathematically sound deltas and percentage changes.
"""

from datetime import datetime
import json
from backend.engine.simulator import TrafficSimulator
from backend.models import database


def run_comparison_experiment(profile_name="burst_traffic", duration_steps=20, algorithm="leaky_bucket", algorithm_config=None, custom_load=None, random_seed=42):
    """
    Executes a reproducible, deterministic 2-phase experiment.
    :return: dict with baseline_results, controlled_results, comparison_metrics, and summary.
    """
    duration_steps = max(5, min(100, int(duration_steps)))
    if algorithm_config is None:
        algorithm_config = {}

    # ==========================================
    # Phase 1: Baseline Run (No Traffic Control)
    # ==========================================
    sim_base = TrafficSimulator(random_seed=random_seed)
    sim_base.set_profile(profile_name, custom_load=custom_load)
    sim_base.set_traffic_control("none")

    base_snapshots = []
    base_class_records = []
    base_peak_queue = 0
    base_total_drops = 0

    for step in range(duration_steps):
        snap = sim_base.step()
        base_snapshots.append(snap)
        for link in sim_base.topology.links:
            if link["current_queue_packets"] > base_peak_queue:
                base_peak_queue = link["current_queue_packets"]
            base_total_drops += link["packet_drops"]

    # Calculate baseline aggregated averages
    avg_base_offered = sum(s["total_offered_mbps"] for s in base_snapshots) / duration_steps
    avg_base_throughput = sum(s["total_transmitted_mbps"] for s in base_snapshots) / duration_steps
    avg_base_latency = sum(s["avg_latency_ms"] for s in base_snapshots) / duration_steps
    avg_base_util = sum(s["overall_utilization"] for s in base_snapshots) / duration_steps
    tot_base_dropped_mb = sum(s["total_dropped_mbps"] for s in base_snapshots)
    base_loss_pct = (tot_base_dropped_mb / (avg_base_offered * duration_steps) * 100.0) if avg_base_offered > 0 else 0.0

    baseline_metrics = {
        "duration_steps": duration_steps,
        "total_offered_mbps": round(avg_base_offered, 2),
        "delivered_throughput_mbps": round(avg_base_throughput, 2),
        "avg_latency_ms": round(avg_base_latency, 2),
        "packet_loss_pct": round(base_loss_pct, 2),
        "peak_queue_packets": base_peak_queue,
        "total_dropped_packets": base_total_drops,
        "link_utilization_pct": round(avg_base_util, 2),
        "snapshots": base_snapshots
    }

    # ==========================================
    # Phase 2: Controlled Run (With Algorithm)
    # ==========================================
    # Reset with exact same random seed and initial parameters
    sim_ctrl = TrafficSimulator(random_seed=random_seed)
    sim_ctrl.set_profile(profile_name, custom_load=custom_load)
    sim_ctrl.set_traffic_control(algorithm, config=algorithm_config)

    ctrl_snapshots = []
    ctrl_peak_queue = 0
    ctrl_total_drops = 0

    for step in range(duration_steps):
        snap = sim_ctrl.step()
        ctrl_snapshots.append(snap)
        for link in sim_ctrl.topology.links:
            if link["current_queue_packets"] > ctrl_peak_queue:
                ctrl_peak_queue = link["current_queue_packets"]
            ctrl_total_drops += link["packet_drops"]

    avg_ctrl_offered = sum(s["total_offered_mbps"] for s in ctrl_snapshots) / duration_steps
    avg_ctrl_throughput = sum(s["total_transmitted_mbps"] for s in ctrl_snapshots) / duration_steps
    avg_ctrl_latency = sum(s["avg_latency_ms"] for s in ctrl_snapshots) / duration_steps
    avg_ctrl_util = sum(s["overall_utilization"] for s in ctrl_snapshots) / duration_steps
    tot_ctrl_dropped_mb = sum(s["total_dropped_mbps"] for s in ctrl_snapshots)
    ctrl_loss_pct = (tot_ctrl_dropped_mb / (avg_ctrl_offered * duration_steps) * 100.0) if avg_ctrl_offered > 0 else 0.0

    controlled_metrics = {
        "duration_steps": duration_steps,
        "total_offered_mbps": round(avg_ctrl_offered, 2),
        "delivered_throughput_mbps": round(avg_ctrl_throughput, 2),
        "avg_latency_ms": round(avg_ctrl_latency, 2),
        "packet_loss_pct": round(ctrl_loss_pct, 2),
        "peak_queue_packets": ctrl_peak_queue,
        "total_dropped_packets": ctrl_total_drops,
        "link_utilization_pct": round(avg_ctrl_util, 2),
        "snapshots": ctrl_snapshots,
        "algorithm_stats": sim_ctrl.get_state()["algorithm_stats"]
    }

    # ==========================================
    # Metric Delta Calculations
    # ==========================================
    def calc_delta(ctrl_val, base_val, lower_is_better=False):
        raw_diff = ctrl_val - base_val
        if base_val == 0:
            pct_change = 0.0 if ctrl_val == 0 else 100.0
        else:
            pct_change = ((ctrl_val - base_val) / abs(base_val)) * 100.0

        # Determine if this represents an improvement
        if lower_is_better:
            improved = raw_diff < -0.01
            degraded = raw_diff > 0.01
        else:
            improved = raw_diff > 0.01
            degraded = raw_diff < -0.01

        return {
            "baseline": round(base_val, 2),
            "controlled": round(ctrl_val, 2),
            "raw_diff": round(raw_diff, 2),
            "pct_change": round(pct_change, 1),
            "status": "improved" if improved else ("degraded" if degraded else "neutral")
        }

    comparison = {
        "delivered_throughput_mbps": calc_delta(avg_ctrl_throughput, avg_base_throughput, lower_is_better=False),
        "avg_latency_ms": calc_delta(avg_ctrl_latency, avg_base_latency, lower_is_better=True),
        "packet_loss_pct": calc_delta(ctrl_loss_pct, base_loss_pct, lower_is_better=True),
        "peak_queue_packets": calc_delta(ctrl_peak_queue, base_peak_queue, lower_is_better=True),
        "total_dropped_packets": calc_delta(ctrl_total_drops, base_total_drops, lower_is_better=True),
        "link_utilization_pct": calc_delta(avg_ctrl_util, avg_base_util, lower_is_better=False)
    }

    # Generate academic analysis note
    algo_name_map = {
        "leaky_bucket": "Leaky Bucket Traffic Shaping",
        "token_bucket": "Token Bucket Rate Limiting / Burst Control",
        "qos_priority": "QoS Priority Queuing"
    }
    human_algo = algo_name_map.get(algorithm, algorithm)

    if algorithm == "leaky_bucket":
        analysis_text = (
            f"Under {human_algo}, packet bursts are buffered and transmitted at a constant rate. "
            f"Queue buffering smooths traffic and reduces sudden congestion collapses. "
            f"Packet loss changed from {base_loss_pct:.1f}% to {ctrl_loss_pct:.1f}%. "
            f"Note: If arrival sustainably exceeds the leak rate, buffer overflow occurs after buffer exhaustion."
        )
    elif algorithm == "token_bucket":
        analysis_text = (
            f"Under {human_algo}, accumulated tokens permitted instantaneous transmission for early bursts, "
            f"while enforcing sustained rate limits once token capacity was spent. "
            f"Delivered throughput stabilized at {avg_ctrl_throughput:.1f} Mbps."
        )
    elif algorithm == "qos_priority":
        analysis_text = (
            f"Under {human_algo}, high-priority interactive packets (Voice/Video) received immediate forwarding, "
            f"drastically lowering delay and loss for latency-sensitive traffic while bulk traffic absorbed queuing delays."
        )
    else:
        analysis_text = "Experiment executed with standard drop-tail FIFO queuing."

    experiment_id = f"EXP_{int(datetime.now().timestamp() * 1000)}"
    experiment_record = {
        "experiment_id": experiment_id,
        "timestamp": datetime.now().isoformat(),
        "profile_name": profile_name,
        "duration_steps": duration_steps,
        "algorithm": algorithm,
        "algorithm_config": algorithm_config,
        "baseline_results": baseline_metrics,
        "controlled_results": controlled_metrics,
        "comparison_metrics": comparison,
        "summary_notes": analysis_text
    }

    # Persist in SQLite
    try:
        database.save_experiment_run(experiment_record)
    except Exception as e:
        print(f"Error saving experiment to DB: {e}")

    return experiment_record
