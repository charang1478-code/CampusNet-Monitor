"""
Campus Network Traffic Simulator Engine
Time-stepped discrete simulation of traffic flows across campus topology.
Models queues, link capacities, propagation delays, packet drops, protocol distributions,
and connects with Leaky Bucket, Token Bucket, and QoS priority schedulers.
"""

import time
import random
import threading
from datetime import datetime
from backend.engine.topology import CampusTopology
from backend.engine.traffic_controller import LeakyBucket, TokenBucket
from backend.engine.qos_scheduler import QoSScheduler
from backend.engine.congestion_detector import CongestionDetector
from backend.models import database


class TrafficSimulator:
    """
    Core simulator running stepped intervals (e.g. 1-second ticks).
    Thread-safe start, pause, resume, stop, and step controls.
    """

    PROFILES = {
        "normal_browsing": {
            "name": "Normal Campus Browsing",
            "description": "Standard academic hours: light web browsing, email, OPAC lookups, moderate WiFi.",
            "base_load_mbps": 45.0,
            "variance": 0.15,
            "protocol_dist": {"TCP": 0.65, "UDP": 0.25, "ICMP": 0.05, "OTHER": 0.05},
            "hotspot_link": None
        },
        "video_conferencing": {
            "name": "Live Online Lecture / Video-Conferencing",
            "description": "Virtual classrooms and conference calls across CSE and ECE departments.",
            "base_load_mbps": 110.0,
            "variance": 0.20,
            "protocol_dist": {"TCP": 0.30, "UDP": 0.65, "ICMP": 0.02, "OTHER": 0.03},
            "hotspot_link": "L_CORE_CSE"
        },
        "large_file_transfers": {
            "name": "Large Dataset & ISO Transfers",
            "description": "AI model downloads, lab OS image backups, heavy library digital repository sync.",
            "base_load_mbps": 160.0,
            "variance": 0.10,
            "protocol_dist": {"TCP": 0.88, "UDP": 0.08, "ICMP": 0.01, "OTHER": 0.03},
            "hotspot_link": "L_CORE_CSE"
        },
        "burst_traffic": {
            "name": "Sudden Registration Flash Crowd (Burst)",
            "description": "Sudden surge during semester course registration causing buffer overflow and high latency.",
            "base_load_mbps": 220.0,
            "variance": 0.35,
            "protocol_dist": {"TCP": 0.75, "UDP": 0.20, "ICMP": 0.02, "OTHER": 0.03},
            "hotspot_link": "L_CORE_ADM"
        },
        "custom": {
            "name": "Custom Configured Scenario",
            "description": "User-defined offered load, target links, and protocol distribution.",
            "base_load_mbps": 80.0,
            "variance": 0.10,
            "protocol_dist": {"TCP": 0.70, "UDP": 0.20, "ICMP": 0.05, "OTHER": 0.05},
            "hotspot_link": None
        }
    }

    def __init__(self, random_seed=42):
        self.random_seed = random_seed
        self.rng = random.Random(random_seed)

        self.topology = CampusTopology()
        self.detector = CongestionDetector()

        # Traffic control setup
        self.active_control = "none"  # 'none', 'leaky_bucket', 'token_bucket', 'qos_priority'
        self.leaky_bucket = LeakyBucket(capacity_mb=15.0, output_rate_mbps=35.0)
        self.token_bucket = TokenBucket(token_rate_mbps=40.0, bucket_capacity_tokens=50.0, mode="shaping")
        self.qos_scheduler = QoSScheduler(mode="priority", total_buffer_mb=20.0, link_capacity_mbps=45.0)

        # Simulation state
        self.status = "stopped"  # 'running', 'paused', 'stopped'
        self.step_number = 0
        self.selected_profile = "normal_browsing"
        self.custom_load_mbps = 80.0
        self.boosted_link_id = None
        self.boost_multiplier = 1.0

        # Background thread management
        self.worker_thread = None
        self.stop_event = threading.Event()
        self.pause_event = threading.Event()
        self.lock = threading.Lock()

        # Real-time metrics buffer
        self.history_snapshots = []
        self.max_snapshots = 120

    def set_seed(self, seed):
        """Sets random seed for reproducible experiments."""
        self.random_seed = seed
        self.rng = random.Random(seed)

    def set_profile(self, profile_name, custom_load=None, boosted_link=None, boost_mult=1.0):
        """Selects traffic profile and optional link boost."""
        with self.lock:
            if profile_name in self.PROFILES:
                self.selected_profile = profile_name
            if custom_load is not None:
                self.custom_load_mbps = max(5.0, min(500.0, float(custom_load)))
            self.boosted_link_id = boosted_link
            self.boost_multiplier = max(1.0, float(boost_mult))

    def set_traffic_control(self, algorithm, config=None):
        """
        Enables or updates traffic control algorithm:
        'none', 'leaky_bucket', 'token_bucket', 'qos_priority'
        """
        with self.lock:
            self.active_control = algorithm
            if config:
                if algorithm == "leaky_bucket":
                    cap = config.get("capacity_mb", self.leaky_bucket.capacity_mb)
                    out = config.get("output_rate_mbps", self.leaky_bucket.output_rate_mbps)
                    self.leaky_bucket = LeakyBucket(capacity_mb=cap, output_rate_mbps=out)
                elif algorithm == "token_bucket":
                    rate = config.get("token_rate_mbps", self.token_bucket.token_rate_mbps)
                    cap = config.get("bucket_capacity_tokens", self.token_bucket.bucket_capacity_tokens)
                    mode = config.get("mode", self.token_bucket.mode)
                    self.token_bucket = TokenBucket(token_rate_mbps=rate, bucket_capacity_tokens=cap, mode=mode)
                elif algorithm == "qos_priority":
                    mode = config.get("mode", "priority")
                    buf = config.get("total_buffer_mb", self.qos_scheduler.total_buffer_mb)
                    cap = config.get("link_capacity_mbps", self.qos_scheduler.link_capacity_mbps)
                    self.qos_scheduler = QoSScheduler(mode=mode, total_buffer_mb=buf, link_capacity_mbps=cap)

    def start(self):
        """Starts continuous simulation worker."""
        with self.lock:
            if self.status == "running":
                return True
            if self.status == "paused":
                self.pause_event.clear()
                self.status = "running"
                return True

            self.status = "running"
            self.stop_event.clear()
            self.pause_event.clear()
            self.worker_thread = threading.Thread(target=self._run_loop, daemon=True)
            self.worker_thread.start()
            return True

    def pause(self):
        """Pauses simulation."""
        with self.lock:
            if self.status == "running":
                self.status = "paused"
                self.pause_event.set()
                return True
            return False

    def resume(self):
        """Resumes paused simulation."""
        with self.lock:
            if self.status == "paused":
                self.status = "running"
                self.pause_event.clear()
                return True
            return False

    def stop(self):
        """Stops background simulation."""
        with self.lock:
            self.status = "stopped"
            self.stop_event.set()
            self.pause_event.clear()
            return True

    def reset(self):
        """Stops and resets simulation to default state."""
        self.stop()
        with self.lock:
            self.step_number = 0
            self.topology.reset_to_defaults()
            self.detector.reset()
            self.leaky_bucket.reset()
            self.token_bucket.reset()
            self.qos_scheduler.reset()
            self.history_snapshots.clear()
            self.rng = random.Random(self.random_seed)

    def _run_loop(self):
        """Background worker thread stepping the simulator each second."""
        while not self.stop_event.is_set():
            if self.pause_event.is_set():
                time.sleep(0.2)
                continue

            self.step()
            time.sleep(1.0)

    def step(self):
        """Executes a single discrete simulation step."""
        with self.lock:
            self.step_number += 1
            prof = self.PROFILES.get(self.selected_profile, self.PROFILES["normal_browsing"])

            # Base offered load calculation
            if self.selected_profile == "custom":
                target_load = self.custom_load_mbps
            else:
                target_load = prof["base_load_mbps"]

            # Variance perturbation
            var = prof.get("variance", 0.15)
            jitter = (self.rng.random() * 2 - 1) * var
            total_offered = max(2.0, target_load * (1.0 + jitter))

            # Distribute load across links in the topology
            # Key bottlenecks to watch: Core-CSE, Core-ECE, Core-Admin, Core-WiFi
            total_cap = sum(link["capacity_mbps"] for link in self.topology.links)
            congested_count = 0
            total_transmitted = 0.0
            total_dropped = 0.0
            total_latency = 0.0

            # Weight distribution per department link
            link_weights = {
                "L_CORE_BB": 0.40,
                "L_CORE_CSE": 0.22,
                "L_CORE_ECE": 0.14,
                "L_CORE_ADM": 0.10,
                "L_CORE_LIB": 0.06,
                "L_CORE_WIFI": 0.08
            }

            for link in self.topology.links:
                lid = link["id"]
                cap = link["capacity_mbps"]
                prop_delay = link["propagation_delay_ms"]
                max_queue = link["max_queue_packets"]

                # Base link offered traffic
                weight = link_weights.get(lid, 0.02)
                link_offered = total_offered * weight

                # Profile specific hotspot adjustments
                if prof.get("hotspot_link") == lid:
                    link_offered *= 1.8

                # User boosted link
                if self.boosted_link_id == lid:
                    link_offered *= self.boost_multiplier

                # Apply traffic control if this link is a distribution bottleneck (or core link)
                control_applied = False
                if self.active_control != "none" and lid in ("L_CORE_CSE", "L_CORE_ADM", "L_CORE_WIFI", "L_CORE_BB"):
                    control_applied = True
                    if self.active_control == "leaky_bucket":
                        res = self.leaky_bucket.process_step(link_offered, time_step_sec=1.0)
                        link_admitted = res["admitted_mb"]
                        link_transmitted = res["transmitted_mb"]
                        link_dropped = res["dropped_mb"]
                        queue_packets = int((res["current_fill_mb"] / self.leaky_bucket.capacity_mb) * max_queue)
                        queue_delay = res["queue_delay_ms"]

                    elif self.active_control == "token_bucket":
                        res = self.token_bucket.process_step(link_offered, time_step_sec=1.0)
                        link_admitted = res["admitted_mb"]
                        link_transmitted = res["transmitted_mb"]
                        link_dropped = res["dropped_mb"]
                        queue_packets = int((res["buffered_mb"] / (self.token_bucket.buffer_capacity_mb or 1.0)) * max_queue)
                        queue_delay = res["queue_delay_ms"]

                    elif self.active_control == "qos_priority":
                        # Split offered traffic into high (25%), med (45%), low (30%)
                        qos_input = {
                            "high": link_offered * 0.25,
                            "medium": link_offered * 0.45,
                            "low": link_offered * 0.30
                        }
                        qos_res = self.qos_scheduler.process_step(qos_input, time_step_sec=1.0)
                        link_admitted = sum(qos_res[c]["offered_mb"] - qos_res[c]["dropped_mb"] for c in qos_res)
                        link_transmitted = sum(qos_res[c]["transmitted_mb"] for c in qos_res)
                        link_dropped = sum(qos_res[c]["dropped_mb"] for c in qos_res)
                        tot_q = sum(self.qos_scheduler.queues.values())
                        queue_packets = int((tot_q / self.qos_scheduler.total_buffer_mb) * max_queue)
                        queue_delay = max(qos_res[c]["queue_delay_ms"] for c in qos_res)
                else:
                    # Uncontrolled standard FIFO Drop-Tail link behavior
                    if link_offered <= cap:
                        link_admitted = link_offered
                        link_transmitted = link_offered
                        link_dropped = 0.0
                        queue_packets = max(0, int(link.get("current_queue_packets", 0) * 0.4))
                        queue_delay = (queue_packets / (cap / 8.0)) * 10.0 if cap > 0 else 0.0
                    else:
                        # Excess arrivals queue up
                        excess = link_offered - cap
                        current_q = link.get("current_queue_packets", 0)
                        potential_q = current_q + int(excess * 5)
                        if potential_q <= max_queue:
                            link_admitted = link_offered
                            link_transmitted = cap
                            link_dropped = 0.0
                            queue_packets = potential_q
                        else:
                            queue_packets = max_queue
                            overflow_packets = potential_q - max_queue
                            link_dropped = (overflow_packets / 5.0)
                            link_admitted = max(0.0, link_offered - link_dropped)
                            link_transmitted = cap
                        queue_delay = (queue_packets / max_queue) * 65.0  # up to 65ms queuing delay

                # Utilization = transmitted throughput / link capacity
                util_pct = min(100.0, (link_transmitted / cap) * 100.0) if cap > 0 else 0.0
                q_occupancy = min(100.0, (queue_packets / max_queue) * 100.0) if max_queue > 0 else 0.0
                latency_ms = prop_delay + queue_delay

                # Update link object state
                link["offered_mbps"] = round(link_offered, 2)
                link["admitted_mbps"] = round(link_admitted, 2)
                link["transmitted_mbps"] = round(link_transmitted, 2)
                link["dropped_mbps"] = round(link_dropped, 2)
                link["utilization_pct"] = round(util_pct, 1)
                link["current_queue_packets"] = queue_packets
                link["queue_occupancy_pct"] = round(q_occupancy, 1)
                link["packet_drops"] = int(link_dropped * 15)  # packet count representation
                link["latency_ms"] = round(latency_ms, 2)
                link["traffic_control_active"] = control_applied

                # Evaluate congestion detector
                status, cause, changed, event = self.detector.evaluate_link(link)
                link["status"] = status

                if status == "critical":
                    congested_count += 1

                if event:
                    database.insert_congestion_event(event)

                total_transmitted += link_transmitted
                total_dropped += link_dropped
                total_latency += latency_ms

            # Aggregate network metrics
            active_links_count = len(self.topology.links)
            overall_util = (total_transmitted / total_cap * 100.0) if total_cap > 0 else 0.0
            avg_lat = (total_latency / active_links_count) if active_links_count > 0 else 1.0
            loss_pct = (total_dropped / total_offered * 100.0) if total_offered > 0 else 0.0

            snapshot = {
                "timestamp": datetime.now().isoformat(),
                "step_number": self.step_number,
                "total_offered_mbps": round(total_offered, 2),
                "total_transmitted_mbps": round(total_transmitted, 2),
                "total_dropped_mbps": round(total_dropped, 2),
                "overall_utilization": round(overall_util, 2),
                "avg_latency_ms": round(avg_lat, 2),
                "packet_loss_pct": round(loss_pct, 2),
                "active_congested_links": congested_count,
                "active_algorithm": self.active_control,
                "profile": self.selected_profile
            }

            self.history_snapshots.append(snapshot)
            if len(self.history_snapshots) > self.max_snapshots:
                self.history_snapshots.pop(0)

            # Persist to SQLite periodically
            if self.step_number % 2 == 0:
                database.save_metric_snapshot(snapshot)

            return snapshot

    def get_state(self):
        """Returns comprehensive state for frontend dashboard."""
        with self.lock:
            prof = self.PROFILES.get(self.selected_profile, self.PROFILES["normal_browsing"])
            
            # Protocol distribution data
            proto_dist = prof.get("protocol_dist", {"TCP": 0.7, "UDP": 0.2, "ICMP": 0.05, "OTHER": 0.05})
            latest_snap = self.history_snapshots[-1] if self.history_snapshots else {
                "total_offered_mbps": 0.0,
                "total_transmitted_mbps": 0.0,
                "total_dropped_mbps": 0.0,
                "overall_utilization": 0.0,
                "avg_latency_ms": 1.0,
                "packet_loss_pct": 0.0,
                "active_congested_links": 0,
                "active_algorithm": self.active_control
            }

            proto_data = []
            for p, share in proto_dist.items():
                proto_data.append({
                    "protocol": p,
                    "share_pct": round(share * 100, 1),
                    "mbps": round(latest_snap["total_transmitted_mbps"] * share, 2)
                })

            active_hosts_count = len([n for n in self.topology.nodes if n["type"] == "host"])
            total_cap = sum(link["capacity_mbps"] for link in self.topology.links)

            return {
                "status": self.status,
                "step_number": self.step_number,
                "selected_profile": self.selected_profile,
                "profile_details": prof,
                "custom_load_mbps": self.custom_load_mbps,
                "boosted_link_id": self.boosted_link_id,
                "boost_multiplier": self.boost_multiplier,
                "active_control": self.active_control,
                "network_capacity_mbps": round(total_cap, 1),
                "active_hosts_count": active_hosts_count,
                "latest_metrics": latest_snap,
                "protocol_distribution": proto_data,
                "algorithm_stats": {
                    "leaky_bucket": self.leaky_bucket.get_stats(),
                    "token_bucket": self.token_bucket.get_stats(),
                    "qos_scheduler": self.qos_scheduler.get_summary()
                },
                "recent_history": self.history_snapshots[-30:],
                "thresholds": {
                    "warning": self.detector.warning_threshold,
                    "critical": self.detector.critical_threshold,
                    "persistence_window": self.detector.persistence_window
                },
                "environment_mode": "Simulated Academic Campus Environment (Deterministic Discrete Time Model)"
            }
