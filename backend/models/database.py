"""
Database model and SQLite management for CampusNet Monitor.
Persists alerts, congestion events, simulation snapshots, and experiment runs.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "campusnet.db")


def get_db_connection():
    """Returns a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes SQLite tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Alerts & Congestion Events table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS congestion_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT UNIQUE NOT NULL,
            timestamp TEXT NOT NULL,
            link_id TEXT NOT NULL,
            link_name TEXT NOT NULL,
            severity TEXT NOT NULL, -- 'normal', 'warning', 'critical'
            utilization REAL NOT NULL,
            queue_occupancy REAL NOT NULL,
            packet_drops INTEGER NOT NULL,
            latency_ms REAL NOT NULL,
            cause TEXT NOT NULL,
            control_action TEXT NOT NULL,
            acknowledged INTEGER DEFAULT 0,
            status TEXT NOT NULL -- 'active', 'mitigated', 'acknowledged'
        )
    """)

    # Experiment runs table (Baseline vs Controlled)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS experiment_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            experiment_id TEXT UNIQUE NOT NULL,
            timestamp TEXT NOT NULL,
            profile_name TEXT NOT NULL,
            duration_steps INTEGER NOT NULL,
            algorithm TEXT NOT NULL, -- 'none', 'leaky_bucket', 'token_bucket', 'qos_priority'
            algorithm_config TEXT NOT NULL, -- JSON string
            baseline_results TEXT NOT NULL, -- JSON string
            controlled_results TEXT NOT NULL, -- JSON string
            comparison_metrics TEXT NOT NULL, -- JSON string
            summary_notes TEXT
        )
    """)

    # Snapshot metrics table for historical graphing / replay
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS traffic_metrics_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            step_number INTEGER NOT NULL,
            total_offered_mbps REAL NOT NULL,
            total_transmitted_mbps REAL NOT NULL,
            total_dropped_mbps REAL NOT NULL,
            overall_utilization REAL NOT NULL,
            avg_latency_ms REAL NOT NULL,
            active_congested_links INTEGER NOT NULL,
            active_algorithm TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def insert_congestion_event(event_dict):
    """Inserts a new congestion event into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR IGNORE INTO congestion_events (
            event_id, timestamp, link_id, link_name, severity,
            utilization, queue_occupancy, packet_drops, latency_ms,
            cause, control_action, acknowledged, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event_dict["event_id"],
        event_dict["timestamp"],
        event_dict["link_id"],
        event_dict["link_name"],
        event_dict["severity"],
        event_dict["utilization"],
        event_dict["queue_occupancy"],
        event_dict["packet_drops"],
        event_dict["latency_ms"],
        event_dict["cause"],
        event_dict.get("control_action", "None"),
        event_dict.get("acknowledged", 0),
        event_dict.get("status", "active")
    ))
    conn.commit()
    conn.close()


def get_congestion_events(limit=100, severity=None, link_id=None, status=None):
    """Retrieves congestion events with optional filters."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM congestion_events WHERE 1=1"
    params = []

    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if link_id:
        query += " AND link_id = ?"
        params.append(link_id)
    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def acknowledge_congestion_event(event_id):
    """Marks an alert event as acknowledged."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE congestion_events
        SET acknowledged = 1, status = 'acknowledged'
        WHERE event_id = ?
    """, (event_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0


def clear_all_events():
    """Clears all congestion events."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM congestion_events")
    conn.commit()
    conn.close()


def save_experiment_run(experiment_data):
    """Saves a completed baseline-vs-controlled experiment run."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO experiment_history (
            experiment_id, timestamp, profile_name, duration_steps,
            algorithm, algorithm_config, baseline_results,
            controlled_results, comparison_metrics, summary_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        experiment_data["experiment_id"],
        experiment_data["timestamp"],
        experiment_data["profile_name"],
        experiment_data["duration_steps"],
        experiment_data["algorithm"],
        json.dumps(experiment_data.get("algorithm_config", {})),
        json.dumps(experiment_data.get("baseline_results", {})),
        json.dumps(experiment_data.get("controlled_results", {})),
        json.dumps(experiment_data.get("comparison_metrics", {})),
        experiment_data.get("summary_notes", "")
    ))
    conn.commit()
    conn.close()


def get_experiment_history(limit=50):
    """Retrieves past experiment runs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM experiment_history ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        item = dict(row)
        try:
            item["algorithm_config"] = json.loads(item["algorithm_config"])
            item["baseline_results"] = json.loads(item["baseline_results"])
            item["controlled_results"] = json.loads(item["controlled_results"])
            item["comparison_metrics"] = json.loads(item["comparison_metrics"])
        except Exception:
            pass
        results.append(item)
    return results


def save_metric_snapshot(snapshot):
    """Saves periodic simulator metrics for export and graphing."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO traffic_metrics_history (
            timestamp, step_number, total_offered_mbps,
            total_transmitted_mbps, total_dropped_mbps,
            overall_utilization, avg_latency_ms,
            active_congested_links, active_algorithm
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        snapshot.get("timestamp", datetime.now().isoformat()),
        snapshot.get("step_number", 0),
        snapshot.get("total_offered_mbps", 0.0),
        snapshot.get("total_transmitted_mbps", 0.0),
        snapshot.get("total_dropped_mbps", 0.0),
        snapshot.get("overall_utilization", 0.0),
        snapshot.get("avg_latency_ms", 0.0),
        snapshot.get("active_congested_links", 0),
        snapshot.get("active_algorithm", "none")
    ))
    conn.commit()
    conn.close()


def get_recent_metric_snapshots(limit=100):
    """Retrieves recent metric snapshots."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM traffic_metrics_history ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]
