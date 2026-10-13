"""
Congestion Detection Engine
Monitors campus network links, calculates multi-metric health indicators,
applies configurable thresholds with hysteresis/persistence window,
distinguishes utilization warnings from queue overload buffer drops,
and emits structured congestion alerts.
"""

from datetime import datetime


class CongestionDetector:
    """
    Threshold and queue-growth-based congestion detector with hysteresis.
    """

    def __init__(self, warning_threshold=70.0, critical_threshold=85.0, persistence_window=2):
        """
        :param warning_threshold: Link utilization % triggering warning.
        :param critical_threshold: Link utilization % triggering critical alarm.
        :param persistence_window: Number of consecutive samples required before state change.
        """
        self.warning_threshold = float(warning_threshold)
        self.critical_threshold = float(critical_threshold)
        self.persistence_window = max(1, int(persistence_window))

        # Link state tracking for hysteresis: link_id -> {"current_status", "pending_status", "counter"}
        self.link_hysteresis = {}

    def configure_thresholds(self, warning_threshold, critical_threshold, persistence_window=None):
        """Updates detector thresholds."""
        w = float(warning_threshold)
        c = float(critical_threshold)
        if w >= c:
            raise ValueError("Warning threshold must be strictly lower than critical threshold")
        self.warning_threshold = w
        self.critical_threshold = c
        if persistence_window is not None:
            self.persistence_window = max(1, int(persistence_window))

    def evaluate_link(self, link):
        """
        Evaluates a single link's current metrics.
        Returns (severity, cause_description, status_changed, event_dict_or_none)
        """
        link_id = link["id"]
        util = link.get("utilization_pct", 0.0)
        q_pct = link.get("queue_occupancy_pct", 0.0)
        drops = link.get("packet_drops", 0)
        latency = link.get("latency_ms", 1.0)
        capacity = link.get("capacity_mbps", 100.0)
        offered = link.get("offered_mbps", 0.0)

        # 1. Determine instantaneous raw severity and precise cause diagnosis
        # Critical if utilization >= critical threshold OR severe queue overflow (>75%) OR active packet drops
        if util >= self.critical_threshold or q_pct >= 75.0 or drops > 0:
            raw_severity = "critical"
            if drops > 0 and q_pct >= 80.0:
                cause = f"Queue buffer overflow: {drops} dropped packets, buffer {q_pct:.1f}% full under {offered:.1f} Mbps demand"
            elif util >= self.critical_threshold and q_pct >= 60.0:
                cause = f"Severe link saturation ({util:.1f}%) with growing queue buffer delay ({latency:.1f} ms)"
            elif drops > 0:
                cause = f"Traffic drops detected ({drops} drops) exceeding link capacity {capacity} Mbps"
            else:
                cause = f"High link saturation ({util:.1f}% >= {self.critical_threshold}%) approaching queue drop limit"

        elif util >= self.warning_threshold or q_pct >= 40.0:
            raw_severity = "warning"
            if q_pct >= 40.0 and util < self.warning_threshold:
                cause = f"Moderate queue accumulation ({q_pct:.1f}%), potential downstream bottleneck"
            else:
                cause = f"High link utilization warning ({util:.1f}% in [{self.warning_threshold}%-{self.critical_threshold}%]), no active drops yet"

        else:
            raw_severity = "normal"
            cause = "Link operating within normal operating bounds"

        # 2. Apply Hysteresis / Persistence Window
        if link_id not in self.link_hysteresis:
            self.link_hysteresis[link_id] = {
                "current_status": raw_severity,
                "pending_status": raw_severity,
                "counter": 0
            }
            stable_status = raw_severity
            status_changed = False
        else:
            state = self.link_hysteresis[link_id]
            if raw_severity == state["current_status"]:
                # Metrics match stable status; reset pending transition
                state["pending_status"] = raw_severity
                state["counter"] = 0
                stable_status = raw_severity
                status_changed = False
            else:
                # State wants to change; check persistence window
                if raw_severity == state["pending_status"]:
                    state["counter"] += 1
                else:
                    state["pending_status"] = raw_severity
                    state["counter"] = 1

                # If counter satisfies persistence window, commit status change
                # Note: escalation to 'critical' can be fast (1 tick if drops > 0) to protect traffic
                threshold_needed = 1 if (raw_severity == "critical" and drops > 0) else self.persistence_window

                if state["counter"] >= threshold_needed:
                    status_changed = (state["current_status"] != raw_severity)
                    state["current_status"] = raw_severity
                    state["counter"] = 0
                    stable_status = raw_severity
                else:
                    stable_status = state["current_status"]
                    status_changed = False

        # Build event dictionary if an alert condition is active
        event = None
        if stable_status in ("warning", "critical"):
            timestamp = datetime.now().isoformat()
            event_id = f"EVT_{link_id}_{int(datetime.now().timestamp() * 1000)}"
            control_action = "Traffic shaping recommended" if stable_status == "critical" else "Monitor queue dynamics"
            
            event = {
                "event_id": event_id,
                "timestamp": timestamp,
                "link_id": link_id,
                "link_name": link.get("name", link_id),
                "severity": stable_status,
                "utilization": round(util, 1),
                "queue_occupancy": round(q_pct, 1),
                "packet_drops": int(drops),
                "latency_ms": round(latency, 1),
                "cause": cause,
                "control_action": control_action,
                "acknowledged": 0,
                "status": "active"
            }

        return stable_status, cause, status_changed, event

    def reset(self):
        """Resets hysteresis states."""
        self.link_hysteresis.clear()
