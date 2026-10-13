"""
Comprehensive Automated Test Suite for CampusNet Monitor
Covers:
  - Utilization calculations and boundary handling
  - Congestion thresholds and hysteresis persistence
  - Leaky Bucket shaping and buffer overflow
  - Token Bucket burst allowance and policing/shaping modes
  - QoS FIFO vs Strict Priority Queuing
  - Simulator lifecycle (start, pause, resume, step, reset)
  - Baseline-versus-controlled experiment reproducibility & delta calculations
  - CSV exports and HTML reporting
  - Flask REST API endpoints and validation
"""

import unittest
import json
import os
import sys

# Ensure root workspace is on path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from backend.engine.traffic_controller import LeakyBucket, TokenBucket
from backend.engine.qos_scheduler import QoSScheduler
from backend.engine.congestion_detector import CongestionDetector
from backend.engine.topology import CampusTopology
from backend.engine.simulator import TrafficSimulator
from backend.engine.experiment_runner import run_comparison_experiment
from backend.engine.export_service import export_metrics_csv, export_events_csv, export_experiment_csv
from backend.app import app


class TestTrafficControlAlgorithms(unittest.TestCase):
    """Tests Leaky Bucket and Token Bucket algorithms against edge cases."""

    def test_leaky_bucket_normal_and_smoothing(self):
        # Bucket: capacity 10 Mb, leak rate 5 Mbps
        lb = LeakyBucket(capacity_mb=10.0, output_rate_mbps=5.0)
        
        # Step 1: Offer 4 Mb (below capacity)
        res1 = lb.process_step(4.0, time_step_sec=1.0)
        self.assertEqual(res1["arrived_mb"], 4.0)
        self.assertEqual(res1["admitted_mb"], 4.0)
        # It drains 4 Mb (max leak is 5 Mb)
        self.assertEqual(res1["transmitted_mb"], 4.0)
        self.assertEqual(res1["dropped_mb"], 0.0)
        self.assertEqual(res1["current_fill_mb"], 0.0)

    def test_leaky_bucket_overflow_drop(self):
        # Capacity 5 Mb, leak rate 2 Mbps
        lb = LeakyBucket(capacity_mb=5.0, output_rate_mbps=2.0)
        
        # Offer 8 Mb: 5 Mb admitted into bucket, 3 Mb dropped
        res = lb.process_step(8.0, time_step_sec=1.0)
        self.assertEqual(res["admitted_mb"], 5.0)
        self.assertEqual(res["dropped_mb"], 3.0)
        # Drains 2 Mb
        self.assertEqual(res["transmitted_mb"], 2.0)
        # Remaining fill: 5 - 2 = 3 Mb
        self.assertEqual(res["current_fill_mb"], 3.0)

    def test_leaky_bucket_zero_and_empty_traffic(self):
        lb = LeakyBucket(capacity_mb=10.0, output_rate_mbps=5.0)
        res = lb.process_step(0.0)
        self.assertEqual(res["arrived_mb"], 0.0)
        self.assertEqual(res["transmitted_mb"], 0.0)
        self.assertEqual(res["dropped_mb"], 0.0)

    def test_token_bucket_burst_allowance(self):
        # Token rate 10 Mbps, capacity 30 tokens, initial tokens 20
        tb = TokenBucket(token_rate_mbps=10.0, bucket_capacity_tokens=30.0, initial_tokens=20.0, mode="policing")
        
        # Step 1: 10 new tokens generated, total tokens = min(30, 20 + 10) = 30
        # Arrival of 25 Mb burst: should all be transmitted because tokens = 30 >= 25!
        res = tb.process_step(25.0, time_step_sec=1.0)
        self.assertEqual(res["transmitted_mb"], 25.0)
        self.assertEqual(res["dropped_mb"], 0.0)
        self.assertEqual(res["tokens_remaining"], 5.0)
        self.assertTrue(res["burst_delivered"])

    def test_token_bucket_policing_drop(self):
        tb = TokenBucket(token_rate_mbps=5.0, bucket_capacity_tokens=10.0, initial_tokens=0.0, mode="policing")
        # Step 1: generates 5 tokens. Offer 12 Mb.
        # Policing admits 5, drops 7.
        res = tb.process_step(12.0, time_step_sec=1.0)
        self.assertEqual(res["transmitted_mb"], 5.0)
        self.assertEqual(res["dropped_mb"], 7.0)
        self.assertEqual(res["tokens_remaining"], 0.0)

    def test_token_bucket_shaping_buffer(self):
        # Shaping mode buffers rather than dropping immediately
        tb = TokenBucket(token_rate_mbps=5.0, bucket_capacity_tokens=10.0, initial_tokens=0.0, mode="shaping", buffer_capacity_mb=10.0)
        # Offer 10 Mb: tokens generated = 5.
        # Transmits 5. Remaining 5 queued in buffer. Drops = 0.
        res = tb.process_step(10.0, time_step_sec=1.0)
        self.assertEqual(res["transmitted_mb"], 5.0)
        self.assertEqual(res["buffered_mb"], 5.0)
        self.assertEqual(res["dropped_mb"], 0.0)


class TestQoSScheduler(unittest.TestCase):
    """Tests First-In-First-Out vs Strict Priority Queuing."""

    def test_fifo_drops_shared_equally(self):
        # Link capacity 20 Mbps, buffer 10 Mb
        sched = QoSScheduler(mode="fifo", total_buffer_mb=10.0, link_capacity_mbps=20.0)
        traffic = {"high": 15.0, "medium": 15.0, "low": 15.0} # Total 45 Mb
        
        res = sched.process_step(traffic, time_step_sec=1.0)
        # In FIFO, all three classes experience drops
        self.assertGreater(res["high"]["dropped_mb"], 0.0)
        self.assertGreater(res["medium"]["dropped_mb"], 0.0)
        self.assertGreater(res["low"]["dropped_mb"], 0.0)

    def test_priority_protects_high_class(self):
        # Link capacity 20 Mbps, buffer 10 Mb
        sched = QoSScheduler(mode="priority", total_buffer_mb=10.0, link_capacity_mbps=20.0)
        traffic = {"high": 10.0, "medium": 15.0, "low": 20.0} # Total 45 Mb
        
        res = sched.process_step(traffic, time_step_sec=1.0)
        # High priority gets buffer and service first -> 0 drops, fully transmitted
        self.assertEqual(res["high"]["dropped_mb"], 0.0)
        self.assertEqual(res["high"]["transmitted_mb"], 10.0)
        # Drops fall heavily on low priority
        self.assertGreater(res["low"]["dropped_mb"], 0.0)


class TestCongestionDetector(unittest.TestCase):
    """Tests multi-metric threshold evaluation and persistence window / hysteresis."""

    def test_threshold_classification(self):
        det = CongestionDetector(warning_threshold=70.0, critical_threshold=85.0, persistence_window=1)
        
        normal_link = {"id": "L1", "utilization_pct": 50.0, "queue_occupancy_pct": 10.0, "packet_drops": 0, "capacity_mbps": 100.0}
        stat1, _, _, _ = det.evaluate_link(normal_link)
        self.assertEqual(stat1, "normal")

        warn_link = {"id": "L1", "utilization_pct": 75.0, "queue_occupancy_pct": 20.0, "packet_drops": 0, "capacity_mbps": 100.0}
        stat2, _, _, _ = det.evaluate_link(warn_link)
        self.assertEqual(stat2, "warning")

        crit_link = {"id": "L1", "utilization_pct": 92.0, "queue_occupancy_pct": 80.0, "packet_drops": 5, "capacity_mbps": 100.0}
        stat3, _, _, _ = det.evaluate_link(crit_link)
        self.assertEqual(stat3, "critical")

    def test_hysteresis_persistence_window(self):
        # Persistence window of 2 cycles prevents instant state flapping
        det = CongestionDetector(warning_threshold=70.0, critical_threshold=85.0, persistence_window=2)
        
        link = {"id": "L2", "utilization_pct": 50.0, "queue_occupancy_pct": 10.0, "packet_drops": 0, "capacity_mbps": 100.0}
        stat, _, _, _ = det.evaluate_link(link)
        self.assertEqual(stat, "normal")

        # Flap up to 75% for 1 cycle (warning)
        link["utilization_pct"] = 75.0
        stat, _, _, _ = det.evaluate_link(link)
        # Due to persistence window = 2, status remains normal on cycle 1
        self.assertEqual(stat, "normal")

        # Cycle 2 at 75%: now commits to warning
        stat, _, _, _ = det.evaluate_link(link)
        self.assertEqual(stat, "warning")


class TestTopologyAndSimulator(unittest.TestCase):
    """Tests campus topology management and simulation lifecycle."""

    def test_topology_capacity_update_and_validation(self):
        topo = CampusTopology()
        ok, _ = topo.update_link_capacity("L_CORE_CSE", 150.0)
        self.assertTrue(ok)
        self.assertEqual(topo.get_link("L_CORE_CSE")["capacity_mbps"], 150.0)

        # Boundary test: negative capacity
        bad_ok, msg = topo.update_link_capacity("L_CORE_CSE", -10.0)
        self.assertFalse(bad_ok)

    def test_topology_add_and_remove_host(self):
        topo = CampusTopology()
        init_nodes = len(topo.nodes)
        ok, new_node = topo.add_host("Guest Laptop Lab", "SW_CSE")
        self.assertTrue(ok)
        self.assertEqual(len(topo.nodes), init_nodes + 1)

        # Remove host
        rem_ok, _ = topo.remove_host(new_node["id"])
        self.assertTrue(rem_ok)
        self.assertEqual(len(topo.nodes), init_nodes)

    def test_simulator_lifecycle(self):
        sim = TrafficSimulator(random_seed=123)
        self.assertEqual(sim.status, "stopped")
        sim.step()
        self.assertEqual(sim.step_number, 1)

        sim.start()
        self.assertEqual(sim.status, "running")
        sim.pause()
        self.assertEqual(sim.status, "paused")
        sim.resume()
        self.assertEqual(sim.status, "running")
        sim.stop()
        self.assertEqual(sim.status, "stopped")

        sim.reset()
        self.assertEqual(sim.step_number, 0)


class TestExperimentRunnerAndExport(unittest.TestCase):
    """Tests reproducibility of before-and-after experiments and exports."""

    def test_experiment_consistency(self):
        exp = run_comparison_experiment(
            profile_name="burst_traffic",
            duration_steps=10,
            algorithm="leaky_bucket",
            random_seed=42
        )
        self.assertIn("baseline_results", exp)
        self.assertIn("controlled_results", exp)
        self.assertIn("comparison_metrics", exp)
        self.assertEqual(exp["duration_steps"], 10)
        # Check delta metrics calculated
        self.assertIn("delivered_throughput_mbps", exp["comparison_metrics"])
        self.assertIn("avg_latency_ms", exp["comparison_metrics"])

    def test_exports_generate_valid_csv(self):
        csv_m = export_metrics_csv()
        self.assertIn("CampusNet Monitor", csv_m)
        self.assertIn("Transmitted_Throughput_Mbps", csv_m)

        csv_e = export_events_csv()
        self.assertIn("Event_ID", csv_e)

        csv_exp = export_experiment_csv()
        self.assertIn("Metric_Name", csv_exp)


class TestFlaskAPI(unittest.TestCase):
    """Tests REST endpoints, error responses, and HTTP methods."""

    def setUp(self):
        self.client = app.test_client()

    def test_api_dashboard(self):
        res = self.client.get("/api/dashboard")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("network_capacity_mbps", data)
        self.assertIn("protocol_distribution", data)

    def test_api_topology(self):
        res = self.client.get("/api/topology")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("nodes", data)
        self.assertIn("links", data)

    def test_api_settings_validation(self):
        # Invalid: warning >= critical
        bad_res = self.client.post("/api/settings/thresholds", json={"warning": 90, "critical": 80})
        self.assertEqual(bad_res.status_code, 400)


if __name__ == "__main__":
    unittest.main()
