"""
CampusNet Monitor - Backend Flask REST Application
Provides documented REST endpoints for network simulation, topology management,
congestion detection, traffic control, QoS scheduling, experiments, and reporting.
"""

import os
import sys
from datetime import datetime
from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS

# Add root folder to sys.path so backend imports work reliably
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import database
from backend.engine.simulator import TrafficSimulator
from backend.engine.experiment_runner import run_comparison_experiment
from backend.engine import export_service

app = Flask(__name__)
CORS(app)

# Initialize SQLite database
database.init_db()

# Global simulator instance
simulator = TrafficSimulator(random_seed=42)
# Start simulator initially in running mode so live dashboard immediately shows metrics
simulator.start()


# =========================================================================
# Error Handlers
# =========================================================================
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Bad request", "details": str(e)}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "details": str(e)}), 500


# =========================================================================
# 1. Dashboard & Status Endpoints
# =========================================================================
@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """Returns top-level dashboard metrics, charts data, and active controls."""
    state = simulator.get_state()
    # Fetch recent active alerts from database
    recent_alerts = database.get_congestion_events(limit=5)
    state["recent_alerts"] = recent_alerts
    return jsonify(state)


# =========================================================================
# 2. Campus Network Topology Endpoints
# =========================================================================
@app.route("/api/topology", methods=["GET"])
def get_topology():
    """Returns current topology nodes, links, and link statuses."""
    return jsonify(simulator.topology.get_topology())


@app.route("/api/topology/link/capacity", methods=["POST"])
def update_link_capacity():
    """Updates bandwidth capacity of a network link."""
    data = request.get_json(silent=True) or {}
    link_id = data.get("link_id")
    capacity_mbps = data.get("capacity_mbps")

    if not link_id or capacity_mbps is None:
        return jsonify({"success": False, "error": "Missing link_id or capacity_mbps"}), 400

    success, msg = simulator.topology.update_link_capacity(link_id, capacity_mbps)
    if success:
        return jsonify({"success": True, "message": msg, "topology": simulator.topology.get_topology()})
    return jsonify({"success": False, "error": msg}), 400


@app.route("/api/topology/host/add", methods=["POST"])
def add_host():
    """Adds a new simulated host to a department switch."""
    data = request.get_json(silent=True) or {}
    label = data.get("label", "New Lab Workstation")
    switch_id = data.get("switch_id")
    ip = data.get("ip")

    if not switch_id:
        return jsonify({"success": False, "error": "switch_id is required"}), 400

    success, res = simulator.topology.add_host(label, switch_id, ip)
    if success:
        return jsonify({"success": True, "node": res, "topology": simulator.topology.get_topology()})
    return jsonify({"success": False, "error": res}), 400


@app.route("/api/topology/host/remove", methods=["POST"])
def remove_host():
    """Removes a simulated host."""
    data = request.get_json(silent=True) or {}
    host_id = data.get("host_id")
    if not host_id:
        return jsonify({"success": False, "error": "host_id is required"}), 400

    success, msg = simulator.topology.remove_host(host_id)
    if success:
        return jsonify({"success": True, "message": msg, "topology": simulator.topology.get_topology()})
    return jsonify({"success": False, "error": msg}), 400


@app.route("/api/topology/reset", methods=["POST"])
def reset_topology():
    """Resets network topology to standard campus layout."""
    simulator.topology.reset_to_defaults()
    return jsonify({"success": True, "message": "Topology reset to default", "topology": simulator.topology.get_topology()})


# =========================================================================
# 3. Simulation Lifecycle Endpoints
# =========================================================================
@app.route("/api/simulation/start", methods=["POST"])
def start_simulation():
    """Starts the continuous simulation."""
    simulator.start()
    return jsonify({"success": True, "status": simulator.status})


@app.route("/api/simulation/pause", methods=["POST"])
def pause_simulation():
    """Pauses the simulation."""
    simulator.pause()
    return jsonify({"success": True, "status": simulator.status})


@app.route("/api/simulation/resume", methods=["POST"])
def resume_simulation():
    """Resumes the simulation."""
    simulator.resume()
    return jsonify({"success": True, "status": simulator.status})


@app.route("/api/simulation/stop", methods=["POST"])
def stop_simulation():
    """Stops the simulation."""
    simulator.stop()
    return jsonify({"success": True, "status": simulator.status})


@app.route("/api/simulation/step", methods=["POST"])
def step_simulation():
    """Performs a single simulation step manually."""
    snap = simulator.step()
    return jsonify({"success": True, "snapshot": snap, "state": simulator.get_state()})


@app.route("/api/simulation/reset", methods=["POST"])
def reset_simulation():
    """Resets simulation counters, queues, and topology."""
    simulator.reset()
    simulator.start()
    return jsonify({"success": True, "status": simulator.status, "state": simulator.get_state()})


@app.route("/api/simulation/profile", methods=["POST"])
def set_simulation_profile():
    """Sets active traffic profile and offered load."""
    data = request.get_json(silent=True) or {}
    profile = data.get("profile", "normal_browsing")
    custom_load = data.get("custom_load_mbps")

    if profile not in simulator.PROFILES:
        return jsonify({"success": False, "error": f"Invalid profile: {profile}"}), 400

    simulator.set_profile(profile, custom_load=custom_load)
    return jsonify({"success": True, "profile": profile, "state": simulator.get_state()})


@app.route("/api/simulation/boost", methods=["POST"])
def boost_link_demand():
    """Surges traffic on a selected network link."""
    data = request.get_json(silent=True) or {}
    link_id = data.get("link_id")
    multiplier = data.get("multiplier", 2.0)

    try:
        mult = float(multiplier)
        if mult < 1.0 or mult > 10.0:
            return jsonify({"success": False, "error": "Multiplier must be between 1.0 and 10.0"}), 400
        simulator.boosted_link_id = link_id
        simulator.boost_multiplier = mult
        return jsonify({"success": True, "boosted_link": link_id, "multiplier": mult})
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid multiplier"}), 400


# =========================================================================
# 4. Link Telemetry Endpoints
# =========================================================================
@app.route("/api/links", methods=["GET"])
def get_links():
    """Returns all link metrics."""
    return jsonify(simulator.topology.links)


@app.route("/api/links/<link_id>", methods=["GET"])
def get_link_detail(link_id):
    """Returns details for a specific link."""
    link = simulator.topology.get_link(link_id)
    if not link:
        return jsonify({"error": "Link not found"}), 404
    return jsonify(link)


# =========================================================================
# 5. Congestion Detection & Alert Endpoints
# =========================================================================
@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Retrieves recorded congestion alerts with filtering."""
    severity = request.args.get("severity")
    link_id = request.args.get("link_id")
    status = request.args.get("status")
    limit = int(request.args.get("limit", 100))

    events = database.get_congestion_events(limit=limit, severity=severity, link_id=link_id, status=status)
    return jsonify(events)


@app.route("/api/alerts/acknowledge", methods=["POST"])
def acknowledge_alert():
    """Acknowledges an alert by ID."""
    data = request.get_json(silent=True) or {}
    event_id = data.get("event_id")
    if not event_id:
        return jsonify({"success": False, "error": "event_id is required"}), 400

    ok = database.acknowledge_congestion_event(event_id)
    return jsonify({"success": ok})


@app.route("/api/alerts/clear", methods=["POST"])
def clear_alerts():
    """Clears all historical alerts."""
    database.clear_all_events()
    return jsonify({"success": True})


@app.route("/api/settings/thresholds", methods=["GET", "POST"])
def manage_thresholds():
    """Gets or sets congestion detector thresholds and hysteresis window."""
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        warning = data.get("warning", simulator.detector.warning_threshold)
        critical = data.get("critical", simulator.detector.critical_threshold)
        persistence = data.get("persistence_window", simulator.detector.persistence_window)

        try:
            simulator.detector.configure_thresholds(warning, critical, persistence)
            return jsonify({
                "success": True,
                "thresholds": {
                    "warning": simulator.detector.warning_threshold,
                    "critical": simulator.detector.critical_threshold,
                    "persistence_window": simulator.detector.persistence_window
                }
            })
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400

    return jsonify({
        "warning": simulator.detector.warning_threshold,
        "critical": simulator.detector.critical_threshold,
        "persistence_window": simulator.detector.persistence_window
    })


# =========================================================================
# 6. Traffic Control & QoS Endpoints
# =========================================================================
@app.route("/api/control/configure", methods=["POST"])
def configure_control():
    """Enables or configures Leaky Bucket or Token Bucket algorithms."""
    data = request.get_json(silent=True) or {}
    algorithm = data.get("algorithm", "none")
    config = data.get("config", {})

    valid_algos = ("none", "leaky_bucket", "token_bucket", "qos_priority")
    if algorithm not in valid_algos:
        return jsonify({"success": False, "error": f"Invalid algorithm: {algorithm}"}), 400

    simulator.set_traffic_control(algorithm, config)
    return jsonify({
        "success": True,
        "active_control": simulator.active_control,
        "algorithm_stats": simulator.get_state()["algorithm_stats"]
    })


@app.route("/api/control/qos", methods=["POST"])
def configure_qos():
    """Configures QoS scheduling mode (fifo vs priority)."""
    data = request.get_json(silent=True) or {}
    mode = data.get("mode", "priority")
    total_buffer = data.get("total_buffer_mb", 20.0)
    capacity = data.get("link_capacity_mbps", 45.0)

    if mode not in ("fifo", "priority"):
        return jsonify({"success": False, "error": "Mode must be 'fifo' or 'priority'"}), 400

    simulator.qos_scheduler.mode = mode
    simulator.qos_scheduler.total_buffer_mb = float(total_buffer)
    simulator.qos_scheduler.link_capacity_mbps = float(capacity)

    return jsonify({
        "success": True,
        "qos_summary": simulator.qos_scheduler.get_summary()
    })


# =========================================================================
# 7. Experiment Runner & Comparison Endpoints
# =========================================================================
@app.route("/api/experiments/run", methods=["POST"])
def run_experiment():
    """Runs automated before-and-after baseline vs controlled experiment."""
    data = request.get_json(silent=True) or {}
    profile = data.get("profile", "burst_traffic")
    duration = int(data.get("duration", 20))
    algorithm = data.get("algorithm", "leaky_bucket")
    config = data.get("config", {})
    custom_load = data.get("custom_load_mbps")
    seed = int(data.get("random_seed", 42))

    res = run_comparison_experiment(
        profile_name=profile,
        duration_steps=duration,
        algorithm=algorithm,
        algorithm_config=config,
        custom_load=custom_load,
        random_seed=seed
    )
    return jsonify({"success": True, "experiment": res})


@app.route("/api/experiments/history", methods=["GET"])
def get_experiment_history():
    """Returns past experiment comparisons from SQLite."""
    history = database.get_experiment_history(limit=20)
    return jsonify(history)


# =========================================================================
# 8. Export Endpoints (CSV & Printable HTML)
# =========================================================================
@app.route("/api/export/metrics/csv", methods=["GET"])
def export_metrics():
    """Exports time-series traffic metrics as CSV."""
    csv_data = export_service.export_metrics_csv()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=campusnet_metrics_export.csv"}
    )


@app.route("/api/export/events/csv", methods=["GET"])
def export_events():
    """Exports congestion alert events as CSV."""
    csv_data = export_service.export_events_csv()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=campusnet_congestion_alerts.csv"}
    )


@app.route("/api/export/experiment/csv", methods=["GET"])
def export_experiment():
    """Exports latest experiment comparison as CSV."""
    exp_id = request.args.get("experiment_id")
    csv_data = export_service.export_experiment_csv(experiment_id=exp_id)
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=campusnet_experiment_comparison.csv"}
    )


@app.route("/api/export/experiment/report", methods=["GET"])
def export_report():
    """Exports printable HTML experiment report."""
    exp_id = request.args.get("experiment_id")
    history = database.get_experiment_history(limit=5)
    if not history:
        # Run a quick default experiment if none exist yet
        exp = run_comparison_experiment()
    else:
        exp = history[0]
        if exp_id:
            for item in history:
                if item.get("experiment_id") == exp_id:
                    exp = item
                    break

    html = export_service.generate_html_report(exp)
    return Response(html, mimetype="text/html")


DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serves compiled frontend SPA when available."""
    if os.path.exists(DIST_DIR):
        file_path = os.path.join(DIST_DIR, path)
        if path and os.path.exists(file_path) and not os.path.isdir(file_path):
            return send_from_directory(DIST_DIR, path)
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({
        "message": "CampusNet Monitor Backend running. Run 'npm run dev' in frontend directory for React UI, or run 'npm run build' to bundle."
    })


# =========================================================================
# Main Entry Point
# =========================================================================
if __name__ == "__main__":
    print("CampusNet Monitor Backend listening on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)

