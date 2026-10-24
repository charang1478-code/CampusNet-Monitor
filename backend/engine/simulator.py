"""
Campus Network Traffic Simulator Engine - VNR VJIET Block-Aware Model
Time-stepped discrete simulation of traffic flows across campus blocks and departments:
- Core Layer (Core Router, 10G Backbone)
- Blocks A, B, C, D, E, PG, and Campus Wi-Fi Mesh
- Bandwidth quota enforcement per block and department
- Integrated Network Access Control (DeviceManager for guest permissions)
- Event scenarios: Tech Fest, Online Exams, Induction Program, Normal Academic
- Connects with Leaky Bucket, Token Bucket, and QoS priority schedulers.
"""

import time
import random
import threading
from datetime import datetime
from backend.engine.topology import CampusTopology
from backend.engine.traffic_controller import LeakyBucket, TokenBucket
from backend.engine.qos_scheduler import QoSScheduler
from backend.engine.congestion_detector import CongestionDetector
from backend.engine.device_manager import DeviceManager
from backend.engine.campus_scenarios import CAMPUS_EVENT_SCENARIOS
from backend.models import database


class TrafficSimulator:
    """
    Core simulator running stepped intervals (e.g. 1-second ticks).
    Manages VNR VJIET block aggregation, guest device NAC, and algorithms.
    """

    PROFILES = {
        "normal_browsing": {
            "name": "Normal Academic Operation",
            "description": "Standard classroom theory, lab sessions, OPAC queries, moderate hostel Wi-Fi.",
            "base_load_mbps": 75.0,
            "variance": 0.12,
            "protocol_dist": {"TCP": 0.65, "UDP": 0.25, "ICMP": 0.05, "OTHER": 0.05},
            "hotspot_link": None
        },
        "video_conferencing": {
            "name": "Live Online Lecture / Webinars",
            "description": "Departmental webinars in CSE/ECE (B & C Blocks) and high-definition auditorium streaming.",
            "base_load_mbps": 130.0,
            "variance": 0.18,
            "protocol_dist": {"TCP": 0.30, "UDP": 0.65, "ICMP": 0.02, "OTHER": 0.03},
            "hotspot_link": "L_CORE_BLKC"
        },
        "large_file_transfers": {
            "name": "Large Datasets & Lab Backups",
            "description": "M.Tech AI datasets in PG Block, CAD/CAM ISOs in D-Block, library digital archives in C-Block.",
            "base_load_mbps": 180.0,
            "variance": 0.10,
            "protocol_dist": {"TCP": 0.88, "UDP": 0.08, "ICMP": 0.01, "OTHER": 0.03},
            "hotspot_link": "L_CORE_BLKC"
        },
        "burst_traffic": {
            "name": "Autonomous Exam & Registration Rush",
            "description": "Sudden traffic surge on A-Block (Exam Branch server) and C-Block exam portal.",
            "base_load_mbps": 240.0,
            "variance": 0.30,
            "protocol_dist": {"TCP": 0.75, "UDP": 0.20, "ICMP": 0.02, "OTHER": 0.03},
            "hotspot_link": "L_CORE_BLKA"
        },
        "custom": {
            "name": "Custom Configured Workload",
            "description": "User-defined offered load across blocks and target departmental links.",
            "base_load_mbps": 100.0,
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
        self.device_manager = DeviceManager()

        # Campus Event Scenario: 'normal_academic', 'tech_fest', 'online_exams', 'induction_program'
        self.active_scenario = "normal_academic"

        # Traffic control setup
        self.active_control = "none"  # 'none', 'leaky_bucket', 'token_bucket', 'qos_priority'
        self.leaky_bucket = LeakyBucket(capacity_mb=20.0, output_rate_mbps=45.0)
        self.token_bucket = TokenBucket(token_rate_mbps=50.0, bucket_capacity_tokens=60.0, mode="shaping")
        self.qos_scheduler = QoSScheduler(mode="priority", total_buffer_mb=25.0, link_capacity_mbps=60.0)

        # Simulation state
        self.status = "stopped"  # 'running', 'paused', 'stopped'
        self.step_number = 0
        self.selected_profile = "normal_browsing"
        self.custom_load_mbps = 100.0
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

    def set_campus_scenario(self, scenario_id):
        """Activates a predefined campus event mode (Tech Fest, Online Exams, Induction)."""
        with self.lock:
            if scenario_id in CAMPUS_EVENT_SCENARIOS:
                self.active_scenario = scenario_id
                meta = CAMPUS_EVENT_SCENARIOS[scenario_id]
                # Adjust simulator offered load based on event
                self.custom_load_mbps = meta["base_offered_mbps"]
                if scenario_id == "tech_fest":
                    self.selected_profile = "burst_traffic"
                    # Spawn pending guest devices seeking connection for Tech Fest
                    self.device_manager.request_access({
                        "device_name": f"Hackathon Team ({self.step_number})",
                        "device_type": "External Laptop",
                        "owner": "Fest Participant",
                        "target_block": "BLOCK_C",
                        "notes": "Tech Fest Convergence hackathon participant"
                    })
                elif scenario_id == "online_exams":
                    self.selected_profile = "burst_traffic"
                    # In online exams, automatically quarantine non-whitelisted wireless endpoints in exam blocks
                    for d in self.device_manager.devices:
                        if not d.get("is_college_asset") and d.get("target_block") in ("BLOCK_A", "BLOCK_C"):
                            d["status"] = "quarantined"
                            d["notes"] = "Exam Lockdown: Wireless isolation active in A and C blocks"
                elif scenario_id == "induction_program":
                    self.selected_profile = "video_conferencing"
                    self.device_manager.request_access({
                        "device_name": f"Parent BYOD Device ({self.step_number})",
                        "device_type": "Guest Smartphone",
                        "owner": "First Year Parent",
                        "target_block": "BLOCK_E",
                        "notes": "Induction Program attendee at K.S. Auditorium"
                    })
                else:
                    self.selected_profile = "normal_browsing"
                return True, f"Activated campus scenario: {meta['name']}"
            return False, f"Unknown scenario: {scenario_id}"

    def set_profile(self, profile_name, custom_load=None, boosted_link=None, boost_mult=1.0):
        """Selects traffic profile and optional link boost."""
        with self.lock:
            if profile_name in self.PROFILES:
                self.selected_profile = profile_name
            if custom_load is not None:
                self.custom_load_mbps = max(5.0, min(800.0, float(custom_load)))
            self.boosted_link_id = boosted_link
            self.boost_multiplier = max(1.0, float(boost_mult))

    def set_traffic_control(self, algorithm, config=None):
        """Enables or updates traffic control algorithm."""
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
            self.active_scenario = "normal_academic"
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
        """Executes a single discrete simulation step across VNR blocks."""
        with self.lock:
            self.step_number += 1
            prof = self.PROFILES.get(self.selected_profile, self.PROFILES["normal_browsing"])
            scenario_meta = CAMPUS_EVENT_SCENARIOS.get(self.active_scenario, CAMPUS_EVENT_SCENARIOS["normal_academic"])

            # Base offered load calculation
            if self.selected_profile == "custom":
                target_load = self.custom_load_mbps
            else:
                target_load = scenario_meta.get("base_offered_mbps", prof["base_load_mbps"])

            var = prof.get("variance", 0.15)
            jitter = (self.rng.random() * 2 - 1) * var
            total_offered = max(5.0, target_load * (1.0 + jitter))

            # Base block weights modified by active scenario multipliers
            multipliers = scenario_meta.get("block_weight_multipliers", {})

            block_base_weights = {
                "BLOCK_A": 0.15 * multipliers.get("BLOCK_A", 1.0),
                "BLOCK_B": 0.16 * multipliers.get("BLOCK_B", 1.0),
                "BLOCK_C": 0.28 * multipliers.get("BLOCK_C", 1.0),
                "BLOCK_D": 0.12 * multipliers.get("BLOCK_D", 1.0),
                "BLOCK_E": 0.14 * multipliers.get("BLOCK_E", 1.0),
                "BLOCK_PG": 0.08 * multipliers.get("BLOCK_PG", 1.0),
                "WIFI_MESH": 0.12 * multipliers.get("WIFI_MESH", 1.0)
            }
            # Normalize block weights
            w_sum = sum(block_base_weights.values())
            norm_block_weights = {k: v / w_sum for k, v in block_base_weights.items()}

            # Link-level distribution mapping
            link_block_map = {
                "L_CORE_BLKA": "BLOCK_A",
                "L_CORE_BLKB": "BLOCK_B",
                "L_CORE_BLKC": "BLOCK_C",
                "L_CORE_BLKD": "BLOCK_D",
                "L_CORE_BLKE": "BLOCK_E",
                "L_CORE_BLKPG": "BLOCK_PG",
                "L_CORE_WIFI": "WIFI_MESH"
            }

            total_cap = sum(link["capacity_mbps"] for link in self.topology.links)
            congested_count = 0
            total_transmitted = 0.0
            total_dropped = 0.0
            total_latency = 0.0

            # Guest device throttling factor: calculate total active guest load
            guest_devices = self.device_manager.list_devices(status="guest_allowed")
            allowed_guest_quota = sum(d.get("bandwidth_cap_mbps", 10.0) for d in guest_devices)

            for link in self.topology.links:
                lid = link["id"]
                cap = link["capacity_mbps"]
                prop_delay = link["propagation_delay_ms"]
                max_queue = link["max_queue_packets"]
                blk_id = link.get("block_id")

                # Offered load allocation
                if lid == "L_CORE_BB":
                    link_offered = total_offered * 0.90
                elif lid in link_block_map:
                    # Trunk distribution link to block
                    target_blk = link_block_map[lid]
                    link_offered = total_offered * norm_block_weights.get(target_blk, 0.1)
                else:
                    # Access link inside block
                    parent_blk = blk_id or "BLOCK_C"
                    link_offered = (total_offered * norm_block_weights.get(parent_blk, 0.1)) * 0.45

                # Hotspot adjustments
                if prof.get("hotspot_link") == lid:
                    link_offered *= 1.7

                # User boosted link
                if self.boosted_link_id == lid:
                    link_offered *= self.boost_multiplier

                # Apply traffic control algorithms if active on major trunk links
                control_applied = False
                if self.active_control != "none" and (lid.startswith("L_CORE_BLK") or lid in ("L_CORE_BB", "L_CORE_WIFI")):
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
                        qos_input = {
                            "high": link_offered * 0.30,
                            "medium": link_offered * 0.45,
                            "low": link_offered * 0.25
                        }
                        qos_res = self.qos_scheduler.process_step(qos_input, time_step_sec=1.0)
                        link_admitted = sum(qos_res[c]["offered_mb"] - qos_res[c]["dropped_mb"] for c in qos_res)
                        link_transmitted = sum(qos_res[c]["transmitted_mb"] for c in qos_res)
                        link_dropped = sum(qos_res[c]["dropped_mb"] for c in qos_res)
                        tot_q = sum(self.qos_scheduler.queues.values())
                        queue_packets = int((tot_q / self.qos_scheduler.total_buffer_mb) * max_queue)
                        queue_delay = max(qos_res[c]["queue_delay_ms"] for c in qos_res)
                else:
                    # Uncontrolled FIFO drop-tail
                    if link_offered <= cap:
                        link_admitted = link_offered
                        link_transmitted = link_offered
                        link_dropped = 0.0
                        queue_packets = max(0, int(link.get("current_queue_packets", 0) * 0.3))
                        queue_delay = (queue_packets / (cap / 8.0)) * 10.0 if cap > 0 else 0.0
                    else:
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
                            overflow = potential_q - max_queue
                            link_dropped = (overflow / 5.0)
                            link_admitted = max(0.0, link_offered - link_dropped)
                            link_transmitted = cap
                        queue_delay = (queue_packets / max_queue) * 70.0

                util_pct = min(100.0, (link_transmitted / cap) * 100.0) if cap > 0 else 0.0
                q_occupancy = min(100.0, (queue_packets / max_queue) * 100.0) if max_queue > 0 else 0.0
                latency_ms = prop_delay + queue_delay

                link["offered_mbps"] = round(link_offered, 2)
                link["admitted_mbps"] = round(link_admitted, 2)
                link["transmitted_mbps"] = round(link_transmitted, 2)
                link["dropped_mbps"] = round(link_dropped, 2)
                link["utilization_pct"] = round(util_pct, 1)
                link["current_queue_packets"] = queue_packets
                link["queue_occupancy_pct"] = round(q_occupancy, 1)
                link["packet_drops"] = int(link_dropped * 15)
                link["latency_ms"] = round(latency_ms, 2)
                link["traffic_control_active"] = control_applied

                # Congestion Detection evaluation
                status, cause, changed, event = self.detector.evaluate_link(link)
                link["status"] = status

                # Check for Block Quota Breach
                if lid in link_block_map:
                    target_b = link_block_map[lid]
                    b_conf = self.topology.block_configs.get(target_b, {})
                    b_limit = b_conf.get("default_limit_mbps", 100.0)
                    if link_transmitted >= b_limit:
                        link["status"] = "critical"
                        status = "critical"
                        if not event:
                            event = {
                                "event_id": f"QUOTA_{target_b}_{int(time.time()*1000)}",
                                "timestamp": datetime.now().isoformat(),
                                "link_id": lid,
                                "link_name": f"{b_conf.get('name', target_b)} Trunk Link",
                                "severity": "critical",
                                "utilization": round(util_pct, 1),
                                "queue_occupancy": round(q_occupancy, 1),
                                "packet_drops": int(link["packet_drops"]),
                                "latency_ms": round(latency_ms, 1),
                                "cause": f"Block Quota Limit Breached: {link_transmitted:.1f} Mbps >= Configured Allocation {b_limit:.1f} Mbps",
                                "control_action": "Enforce Block Rate Limiting or Authorize Bandwidth Burst",
                                "acknowledged": 0,
                                "status": "active"
                            }

                if status == "critical":
                    congested_count += 1

                if event:
                    database.insert_congestion_event(event)

                total_transmitted += link_transmitted
                total_dropped += link_dropped
                total_latency += latency_ms

            # Aggregates
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
                "profile": self.selected_profile,
                "scenario": self.active_scenario
            }

            self.history_snapshots.append(snapshot)
            if len(self.history_snapshots) > self.max_snapshots:
                self.history_snapshots.pop(0)

            if self.step_number % 2 == 0:
                database.save_metric_snapshot(snapshot)

            return snapshot

    def get_state(self):
        """Returns comprehensive state for VNR VJIET dashboard."""
        with self.lock:
            prof = self.PROFILES.get(self.selected_profile, self.PROFILES["normal_browsing"])
            scenario_meta = CAMPUS_EVENT_SCENARIOS.get(self.active_scenario, CAMPUS_EVENT_SCENARIOS["normal_academic"])
            
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

            active_hosts_count = len([n for n in self.topology.nodes if n["type"] in ("host", "server")])
            total_cap = sum(link["capacity_mbps"] for link in self.topology.links)
            blocks_summary = self.topology.get_blocks_summary()
            device_counts = self.device_manager.get_counts()

            # Count blocks in breach
            breached_blocks_count = len([b for b in blocks_summary.values() if b["quota_status"] == "breached"])

            return {
                "status": self.status,
                "step_number": self.step_number,
                "selected_profile": self.selected_profile,
                "profile_details": prof,
                "active_scenario": self.active_scenario,
                "scenario_details": scenario_meta,
                "custom_load_mbps": self.custom_load_mbps,
                "boosted_link_id": self.boosted_link_id,
                "boost_multiplier": self.boost_multiplier,
                "active_control": self.active_control,
                "network_capacity_mbps": round(total_cap, 1),
                "active_hosts_count": active_hosts_count,
                "latest_metrics": latest_snap,
                "protocol_distribution": proto_data,
                "blocks_summary": blocks_summary,
                "breached_blocks_count": breached_blocks_count,
                "device_counts": device_counts,
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
                "environment_mode": "VNR VJIET Campus Network Model (Blocks A, B, C, D, E, PG, Wi-Fi)"
            }
