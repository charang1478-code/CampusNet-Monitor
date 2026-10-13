"""
Report Generation and CSV Export Service
Exports simulated traffic metrics, congestion alert history,
and before-and-after experiment comparisons into CSV and printable HTML reports.
"""

import csv
import io
import json
from datetime import datetime
from backend.models import database


def export_metrics_csv(limit=500):
    """Generates CSV string of traffic metrics history."""
    snapshots = database.get_recent_metric_snapshots(limit=limit)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "# CampusNet Monitor - Simulated Traffic Telemetry Export",
        f"Export Date: {datetime.now().isoformat()}",
        "Environment: Simulated Academic Campus Network"
    ])
    writer.writerow([
        "ID", "Timestamp", "Step_Number", "Offered_Traffic_Mbps",
        "Transmitted_Throughput_Mbps", "Dropped_Traffic_Mbps",
        "Overall_Utilization_Pct", "Avg_Latency_ms",
        "Congested_Links_Count", "Active_Control_Algorithm"
    ])

    for row in snapshots:
        writer.writerow([
            row.get("id"),
            row.get("timestamp"),
            row.get("step_number"),
            row.get("total_offered_mbps"),
            row.get("total_transmitted_mbps"),
            row.get("total_dropped_mbps"),
            row.get("overall_utilization"),
            row.get("avg_latency_ms"),
            row.get("active_congested_links"),
            row.get("active_algorithm")
        ])

    return output.getvalue()


def export_events_csv(limit=500):
    """Generates CSV string of congestion events and alerts."""
    events = database.get_congestion_events(limit=limit)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "# CampusNet Monitor - Congestion Alerts & Event Log Export",
        f"Export Date: {datetime.now().isoformat()}",
        "Environment: Simulated Academic Campus Network"
    ])
    writer.writerow([
        "Event_ID", "Timestamp", "Link_ID", "Link_Name", "Severity",
        "Utilization_Pct", "Queue_Occupancy_Pct", "Packet_Drops",
        "Latency_ms", "Cause", "Control_Action", "Acknowledged", "Status"
    ])

    for e in events:
        writer.writerow([
            e.get("event_id"),
            e.get("timestamp"),
            e.get("link_id"),
            e.get("link_name"),
            e.get("severity"),
            e.get("utilization"),
            e.get("queue_occupancy"),
            e.get("packet_drops"),
            e.get("latency_ms"),
            e.get("cause"),
            e.get("control_action"),
            e.get("acknowledged"),
            e.get("status")
        ])

    return output.getvalue()


def export_experiment_csv(experiment_id=None):
    """Generates CSV for the latest or specified experiment comparison."""
    history = database.get_experiment_history(limit=10)
    if not history:
        return "No experiment records found."

    exp = None
    if experiment_id:
        for item in history:
            if item.get("experiment_id") == experiment_id:
                exp = item
                break
    if not exp:
        exp = history[0]

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["# CampusNet Monitor - Before-and-After Experiment Comparison"])
    writer.writerow(["Experiment_ID", exp.get("experiment_id")])
    writer.writerow(["Timestamp", exp.get("timestamp")])
    writer.writerow(["Traffic_Profile", exp.get("profile_name")])
    writer.writerow(["Duration_Steps", exp.get("duration_steps")])
    writer.writerow(["Algorithm", exp.get("algorithm")])
    writer.writerow(["Algorithm_Config", json.dumps(exp.get("algorithm_config"))])
    writer.writerow([])

    writer.writerow(["Metric_Name", "Baseline_Value", "Controlled_Value", "Raw_Difference", "Percentage_Change", "Outcome"])

    cmp_data = exp.get("comparison_metrics", {})
    for metric, vals in cmp_data.items():
        writer.writerow([
            metric,
            vals.get("baseline"),
            vals.get("controlled"),
            vals.get("raw_diff"),
            f"{vals.get('pct_change')}%",
            vals.get("status")
        ])

    writer.writerow([])
    writer.writerow(["Summary_Analysis", exp.get("summary_notes")])

    return output.getvalue()


def generate_html_report(experiment_data):
    """Generates printable, elegant HTML report for the experiment."""
    exp = experiment_data
    cmp_m = exp.get("comparison_metrics", {})
    base = exp.get("baseline_results", {})
    ctrl = exp.get("controlled_results", {})

    table_rows = ""
    for metric, vals in cmp_m.items():
        status_color = "#10b981" if vals.get("status") == "improved" else ("#ef4444" if vals.get("status") == "degraded" else "#94a3b8")
        status_badge = f"<span style='color:{status_color};font-weight:600;'>{vals.get('status').upper()} ({vals.get('pct_change')}%)</span>"
        human_name = metric.replace("_", " ").title()
        table_rows += f"""
        <tr>
            <td style="padding:10px; border-bottom:1px solid #334155;">{human_name}</td>
            <td style="padding:10px; border-bottom:1px solid #334155; text-align:right;">{vals.get('baseline')}</td>
            <td style="padding:10px; border-bottom:1px solid #334155; text-align:right;">{vals.get('controlled')}</td>
            <td style="padding:10px; border-bottom:1px solid #334155; text-align:right;">{vals.get('raw_diff')}</td>
            <td style="padding:10px; border-bottom:1px solid #334155; text-align:center;">{status_badge}</td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CampusNet Monitor - Course Based Project Experiment Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            margin: 0;
            padding: 40px;
        }}
        .report-box {{
            max-width: 900px;
            margin: 0 auto;
            background: #1e293b;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            border: 1px solid #334155;
        }}
        .header {{
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }}
        .badge {{
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
        }}
        h1 {{ margin: 6px 0; color: #f8fafc; font-size: 24px; }}
        h2 {{ color: #38bdf8; font-size: 18px; margin-top: 24px; }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            font-size: 14px;
        }}
        th {{
            background: #0f172a;
            color: #94a3b8;
            padding: 12px 10px;
            text-align: left;
            font-size: 13px;
        }}
        .meta-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
            background: #0f172a;
            padding: 16px;
            border-radius: 8px;
        }}
        .meta-item {{ font-size: 14px; color: #cbd5e1; }}
        .meta-label {{ color: #64748b; font-weight: 600; margin-right: 6px; }}
        .notice {{
            background: rgba(56, 189, 248, 0.1);
            border-left: 4px solid #38bdf8;
            padding: 14px;
            border-radius: 4px;
            margin-top: 24px;
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.5;
        }}
        @media print {{
            body {{ background: #fff; color: #000; padding: 0; }}
            .report-box {{ background: #fff; border: none; box-shadow: none; color: #000; }}
            th {{ background: #f1f5f9; color: #000; }}
            .meta-grid {{ background: #f8fafc; color: #000; }}
            .notice {{ background: #f1f5f9; color: #333; }}
        }}
    </style>
</head>
<body>
    <div class="report-box">
        <div class="header">
            <span class="badge">B.Tech III Sem Computer Networks - Course Based Project (CBP)</span>
            <h1>Campus Network Congestion Detection and Traffic Control System</h1>
            <p style="margin:4px 0 0; color:#94a3b8; font-size:14px;">Academic Evaluation & Performance Verification Report</p>
        </div>

        <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Experiment ID:</span> {exp.get('experiment_id')}</div>
            <div class="meta-item"><span class="meta-label">Execution Time:</span> {exp.get('timestamp')}</div>
            <div class="meta-item"><span class="meta-label">Workload Profile:</span> {exp.get('profile_name').replace('_', ' ').title()}</div>
            <div class="meta-item"><span class="meta-label">Algorithm:</span> {exp.get('algorithm').replace('_', ' ').title()}</div>
            <div class="meta-item"><span class="meta-label">Duration:</span> {exp.get('duration_steps')} Simulation Steps</div>
            <div class="meta-item"><span class="meta-label">Environment:</span> Simulated Campus Topology (Deterministic Model)</div>
        </div>

        <h2>Before-and-After Performance Comparison</h2>
        <table>
            <thead>
                <tr>
                    <th>Performance Metric</th>
                    <th style="text-align:right;">Baseline (FIFO)</th>
                    <th style="text-align:right;">Controlled</th>
                    <th style="text-align:right;">Net Delta</th>
                    <th style="text-align:center;">Academic Outcome</th>
                </tr>
            </thead>
            <tbody>
                {table_rows}
            </tbody>
        </table>

        <h2>Analysis & Syllabus Mapping</h2>
        <div style="background:#0f172a; padding:16px; border-radius:8px; line-height:1.6; font-size:14px; color:#cbd5e1;">
            {exp.get('summary_notes')}
        </div>

        <div class="notice">
            <strong>Academic Disclaimer & Limitations:</strong><br>
            This experiment was executed within a simulated collegiate network model implementing queue-buffering,
            Leaky Bucket traffic shaping, Token Bucket burst regulation, and QoS priority scheduling as per the B.Tech Computer Networks syllabus.
            Values reflect discrete simulation counters and demonstrate network congestion dynamics without accessing real campus physical hardware.
        </div>
    </div>
</body>
</html>"""
    return html
