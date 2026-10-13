"""
Quality of Service (QoS) Traffic Scheduling Engine
Supports First-In-First-Out (FIFO) vs Strict Priority-Based Scheduling (PQ)
across three standard traffic classes:
  1. High Priority: Voice / Video-Conferencing (low latency, sensitive to jitter/drops)
  2. Medium Priority: Web browsing / Interactive HTTP
  3. Low Priority: Bulk file transfers / Background backups
"""

import copy


class QoSScheduler:
    """
    Simulates packet scheduling across a bottleneck link with finite buffer capacity.
    Compares FIFO (Drop-Tail) vs Strict Priority Queuing (PQ).
    """

    TRAFFIC_CLASSES = {
        "high": {"name": "High Priority (Voice/Video)", "dscp": "EF (46)", "weight": 3},
        "medium": {"name": "Medium Priority (Web Browsing)", "dscp": "AF21 (18)", "weight": 2},
        "low": {"name": "Low Priority (Bulk Transfers)", "dscp": "Best Effort (0)", "weight": 1}
    }

    def __init__(self, mode="fifo", total_buffer_mb=15.0, link_capacity_mbps=30.0):
        """
        :param mode: 'fifo' or 'priority'
        :param total_buffer_mb: Buffer size at the bottleneck interface in Mb.
        :param link_capacity_mbps: Service rate of the link in Mbps.
        """
        self.mode = mode if mode in ("fifo", "priority") else "fifo"
        self.total_buffer_mb = max(1.0, float(total_buffer_mb))
        self.link_capacity_mbps = max(1.0, float(link_capacity_mbps))

        # Class queues
        self.queues = {
            "high": 0.0,
            "medium": 0.0,
            "low": 0.0
        }

        # Per-class cumulative counters
        self.stats = {
            "high": {"offered_mb": 0.0, "transmitted_mb": 0.0, "dropped_mb": 0.0, "total_delay_ms": 0.0, "ticks": 0},
            "medium": {"offered_mb": 0.0, "transmitted_mb": 0.0, "dropped_mb": 0.0, "total_delay_ms": 0.0, "ticks": 0},
            "low": {"offered_mb": 0.0, "transmitted_mb": 0.0, "dropped_mb": 0.0, "total_delay_ms": 0.0, "ticks": 0}
        }

    def process_step(self, traffic_in, time_step_sec=1.0):
        """
        Processes one simulation step with arrivals across the three traffic classes.
        :param traffic_in: dict e.g. {"high": 10.0, "medium": 15.0, "low": 20.0} (Mb)
        :param time_step_sec: Step duration.
        """
        avail_capacity = self.link_capacity_mbps * time_step_sec

        # Record offered traffic
        for c in ["high", "medium", "low"]:
            offered = max(0.0, float(traffic_in.get(c, 0.0)))
            self.stats[c]["offered_mb"] += offered
            self.stats[c]["ticks"] += 1

        step_results = {
            "high": {"offered_mb": traffic_in.get("high", 0.0), "transmitted_mb": 0.0, "dropped_mb": 0.0, "queue_delay_ms": 0.0},
            "medium": {"offered_mb": traffic_in.get("medium", 0.0), "transmitted_mb": 0.0, "dropped_mb": 0.0, "queue_delay_ms": 0.0},
            "low": {"offered_mb": traffic_in.get("low", 0.0), "transmitted_mb": 0.0, "dropped_mb": 0.0, "queue_delay_ms": 0.0}
        }

        if self.mode == "fifo":
            # In FIFO, all classes share a single buffer and compete equally.
            # Total arrival:
            tot_arrival = sum(max(0.0, float(traffic_in.get(c, 0.0))) for c in ["high", "medium", "low"])
            current_buffer = sum(self.queues.values())
            free_buffer = max(0.0, self.total_buffer_mb - current_buffer)

            # If arrival exceeds free buffer, drops occur proportionally (or tail-drop)
            if tot_arrival <= free_buffer:
                admitted_ratio = 1.0
            else:
                admitted_ratio = free_buffer / tot_arrival if tot_arrival > 0 else 0.0

            for c in ["high", "medium", "low"]:
                arr = max(0.0, float(traffic_in.get(c, 0.0)))
                admitted = arr * admitted_ratio
                dropped = arr - admitted
                self.queues[c] += admitted
                self.stats[c]["dropped_mb"] += dropped
                step_results[c]["dropped_mb"] = round(dropped, 3)

            # Transmit proportionally from shared queue up to link capacity
            total_queued = sum(self.queues.values())
            if total_queued > 0:
                service_ratio = min(1.0, avail_capacity / total_queued)
                for c in ["high", "medium", "low"]:
                    trans = self.queues[c] * service_ratio
                    self.queues[c] -= trans
                    self.stats[c]["transmitted_mb"] += trans
                    step_results[c]["transmitted_mb"] = round(trans, 3)
                    
                    # FIFO delay: all packets experience the same queuing delay based on total buffer
                    delay = (total_queued / self.link_capacity_mbps) * 1000.0
                    self.stats[c]["total_delay_ms"] += delay
                    step_results[c]["queue_delay_ms"] = round(delay, 1)

        else:
            # Strict Priority Queuing (PQ):
            # High priority is admitted first and served first.
            # Medium is served if High queue is cleared.
            # Low is served only if High and Medium queues are cleared.
            current_total_buf = sum(self.queues.values())
            remaining_buf = max(0.0, self.total_buffer_mb - current_total_buf)

            # Buffer admission: High gets priority buffer space
            for c in ["high", "medium", "low"]:
                arr = max(0.0, float(traffic_in.get(c, 0.0)))
                if arr <= remaining_buf:
                    admitted = arr
                    dropped = 0.0
                    remaining_buf -= admitted
                else:
                    admitted = remaining_buf
                    dropped = arr - remaining_buf
                    remaining_buf = 0.0

                self.queues[c] += admitted
                self.stats[c]["dropped_mb"] += dropped
                step_results[c]["dropped_mb"] = round(dropped, 3)

            # Strict Priority Transmission
            rem_capacity = avail_capacity
            for c in ["high", "medium", "low"]:
                q_len = self.queues[c]
                served = min(q_len, rem_capacity)
                self.queues[c] -= served
                rem_capacity -= served
                self.stats[c]["transmitted_mb"] += served
                step_results[c]["transmitted_mb"] = round(served, 3)

                # Queue delay for class c is proportional to queues ahead of it + its own queue
                delay = (self.queues[c] / self.link_capacity_mbps) * 1000.0
                self.stats[c]["total_delay_ms"] += delay
                step_results[c]["queue_delay_ms"] = round(delay, 1)

        return step_results

    def reset(self):
        """Resets queue states and counters."""
        self.queues = {"high": 0.0, "medium": 0.0, "low": 0.0}
        self.stats = {
            "high": {"offered_mb": 0.0, "transmitted_mb": 0.0, "dropped_mb": 0.0, "total_delay_ms": 0.0, "ticks": 0},
            "medium": {"offered_mb": 0.0, "transmitted_mb": 0.0, "dropped_mb": 0.0, "total_delay_ms": 0.0, "ticks": 0},
            "low": {"offered_mb": 0.0, "transmitted_mb": 0.0, "dropped_mb": 0.0, "total_delay_ms": 0.0, "ticks": 0}
        }

    def get_summary(self):
        """Returns per-class metrics summary."""
        res = {}
        for c in ["high", "medium", "low"]:
            data = self.stats[c]
            offered = data["offered_mb"]
            dropped = data["dropped_mb"]
            trans = data["transmitted_mb"]
            loss_pct = (dropped / offered * 100.0) if offered > 0 else 0.0
            avg_delay = (data["total_delay_ms"] / data["ticks"]) if data["ticks"] > 0 else 0.0
            
            res[c] = {
                "name": self.TRAFFIC_CLASSES[c]["name"],
                "dscp": self.TRAFFIC_CLASSES[c]["dscp"],
                "offered_mb": round(offered, 2),
                "transmitted_mb": round(trans, 2),
                "dropped_mb": round(dropped, 2),
                "packet_loss_pct": round(loss_pct, 2),
                "avg_delay_ms": round(avg_delay, 2),
                "current_queue_mb": round(self.queues[c], 2)
            }
        return {
            "mode": self.mode,
            "total_buffer_mb": self.total_buffer_mb,
            "link_capacity_mbps": self.link_capacity_mbps,
            "classes": res
        }
