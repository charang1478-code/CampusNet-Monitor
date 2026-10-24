import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Trash2,
  Filter,
  Info,
  Clock,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

export default function CongestionAlerts({ onRefreshDashboard }) {
  const [alerts, setAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLink, setFilterLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      if (filterLink) params.link_id = filterLink;
      const data = await api.getAlerts(params);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, [filterSeverity, filterStatus, filterLink]);

  const handleAcknowledge = async (eventId) => {
    try {
      await api.acknowledgeAlert(eventId);
      fetchAlerts();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all congestion events from SQLite database?')) return;
    try {
      await api.clearAlerts();
      fetchAlerts();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Campus Congestion Alert Centre</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated threshold detection, buffer overload identification, and hysteresis event tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <a
            href={api.getEventsCsvUrl()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Events</span>
          </button>
        </div>
      </div>

      {/* Hysteresis & Congestion Theory Box */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-300">
        <div className="flex items-center space-x-2 font-semibold text-cyan-400">
          <Info className="w-4 h-4" />
          <span>Hysteresis Persistence Window & Multi-Metric Detection</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          In real campus routers, momentary packet bursts causes utilization to briefly touch 75% or 85% without representing true congestion collapse. To avoid alert-state flapping and notification storms, this system enforces a configurable <strong>persistence window</strong> (default 2 consecutive intervals) before elevating or clearing alert levels. Furthermore, the engine distinguishes high utilization with clear buffers from confirmed buffer overflow (queue backlog + packet drops).
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Filters:</span>
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Severities</option>
          <option value="warning">Warning Only</option>
          <option value="critical">Critical Only</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
        </select>

        <select
          value={filterLink}
          onChange={(e) => setFilterLink(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Links</option>
          <option value="L_CORE_BB">Core Backbone</option>
          <option value="L_CORE_CSE">CSE Dept Link</option>
          <option value="L_CORE_ECE">ECE Dept Link</option>
          <option value="L_CORE_ADM">Admin Dept Link</option>
          <option value="L_CORE_LIB">Library Link</option>
          <option value="L_CORE_WIFI">Student Wi-Fi Link</option>
        </select>

        <span className="ml-auto text-slate-500">
          Showing {alerts.length} recorded events
        </span>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {alerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500/30 mx-auto mb-2" />
            No congestion events matching current filters. All campus links healthy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Affected Link</th>
                  <th className="py-2.5 px-3">Detected Cause</th>
                  <th className="py-2.5 px-3">Indicators</th>
                  <th className="py-2.5 px-3">Control Action</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {alerts.map((evt) => (
                  <tr key={evt.id || evt.event_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        evt.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{evt.link_name}</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs">{evt.cause}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      <div>Util: <span className="text-white font-semibold">{evt.utilization}%</span></div>
                      <div>Queue: {evt.queue_occupancy}% | Drops: {evt.packet_drops}</div>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">{evt.control_action}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {evt.acknowledged ? (
                        <span className="text-emerald-400 text-[11px] font-medium flex items-center justify-end space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Acked</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(evt.event_id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition"
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
