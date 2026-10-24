import React, { useState } from 'react';
import {
  Activity,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  TrendingUp,
  Download,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

export default function LiveMonitoring({ dashboardData, topologyData, onRefresh }) {
  const [selectedProfile, setSelectedProfile] = useState(dashboardData?.selected_profile || 'normal_browsing');
  const [customLoad, setCustomLoad] = useState(80);
  const [boostLink, setBoostLink] = useState('L_CORE_BLKC');
  const [boostMultiplier, setBoostMultiplier] = useState(2.5);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const links = topologyData?.links || [];
  const history = dashboardData?.recent_history || [];

  const handleProfileChange = async (profileKey) => {
    setSelectedProfile(profileKey);
    setIsUpdating(true);
    try {
      await api.setProfile(profileKey, profileKey === 'custom' ? customLoad : null);
      setFeedback({ type: 'success', text: `Switched workload profile to '${profileKey.replace('_', ' ')}'` });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApplyCustomLoad = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.setProfile('custom', parseFloat(customLoad));
      setSelectedProfile('custom');
      setFeedback({ type: 'success', text: `Custom offered load set to ${customLoad} Mbps` });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSurgeDemand = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.boostLink(boostLink, parseFloat(boostMultiplier));
      setFeedback({ type: 'success', text: `Injected ${boostMultiplier}x traffic surge on link ${boostLink}` });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  // Profiles list
  const profiles = [
    { id: 'normal_browsing', label: 'Normal Campus Browsing', desc: 'Standard 45 Mbps light academic web & email' },
    { id: 'video_conferencing', label: 'Video-Conferencing / Lectures', desc: 'Sustained 110 Mbps UDP/RTP streaming to CSE & ECE' },
    { id: 'large_file_transfers', label: 'Large File / ISO Transfers', desc: 'Heavy 160 Mbps bulk TCP transfers filling queues' },
    { id: 'burst_traffic', label: 'Registration Burst Crowd', desc: 'Sudden 220 Mbps spike causing acute bottleneck buffer drop' },
    { id: 'custom', label: 'Custom Configured Workload', desc: 'User-specified arbitrary offered bandwidth load' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Live Campus Traffic Monitoring & Generation</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time link-by-link telemetry, traffic generator profiles, and interactive demand surging.
          </p>
        </div>

        <a
          href={api.getMetricsCsvUrl()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Metrics CSV</span>
        </a>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-xs ${
          feedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Traffic Generation Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workload Profile Selector (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Active Traffic Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {profiles.map((p) => {
              const isSelected = selectedProfile === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProfileChange(p.id)}
                  disabled={isUpdating}
                  className={`p-3 rounded-lg text-left border transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{p.label}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                  </div>
                  <p className="text-[11px] text-slate-400">{p.desc}</p>
                </button>
              );
            })}
          </div>

          {selectedProfile === 'custom' && (
            <form onSubmit={handleApplyCustomLoad} className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center space-x-3 text-xs">
              <span className="text-slate-400">Offered Load (Mbps):</span>
              <input
                type="number"
                min="5"
                max="500"
                value={customLoad}
                onChange={(e) => setCustomLoad(e.target.value)}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
              />
              <button
                type="submit"
                disabled={isUpdating}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition"
              >
                Apply Load
              </button>
            </form>
          )}
        </div>

        {/* Link Demand Surge / Bottleneck Stressor (1 col) */}
        <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Stress Test Link (Surge)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Induce an immediate traffic spike on a chosen campus segment to test detection and queues.
            </p>

            <form onSubmit={handleSurgeDemand} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Network Link</label>
                <select
                  value={boostLink}
                  onChange={(e) => setBoostLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                >
                  {links
                    .filter((l) => l.id.startsWith('L_CORE_') || l.layer === 'distribution')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.id})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Surge Multiplier</label>
                <select
                  value={boostMultiplier}
                  onChange={(e) => setBoostMultiplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="1.5">1.5x Multiplier (Moderate)</option>
                  <option value="2.5">2.5x Multiplier (Heavy Saturation)</option>
                  <option value="4.0">4.0x Multiplier (Severe Congestion Collapse)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold transition"
              >
                Inject Surge Load
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Real-time Link Telemetry Table */}
      <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-white">Live Link Telemetry Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Link Name</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3">Offered</th>
                <th className="py-2.5 px-3">Transmitted</th>
                <th className="py-2.5 px-3">Dropped</th>
                <th className="py-2.5 px-3">Utilization</th>
                <th className="py-2.5 px-3">Queue Buffer</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {links.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 font-mono">
                  <td className="py-2.5 px-3 font-sans font-medium text-white">{l.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{l.capacity_mbps}M</td>
                  <td className="py-2.5 px-3">{l.offered_mbps}M</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">{l.transmitted_mbps}M</td>
                  <td className="py-2.5 px-3">
                    <span className={l.dropped_mbps > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                      {l.dropped_mbps}M
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            l.utilization_pct >= 85 ? 'bg-rose-500' : (l.utilization_pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')
                          }`}
                          style={{ width: `${Math.min(100, l.utilization_pct)}%` }}
                        />
                      </div>
                      <span className="font-sans text-[11px]">{l.utilization_pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">{l.current_queue_packets} / {l.max_queue_packets} pkts</td>
                  <td className="py-2.5 px-3">{l.latency_ms} ms</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      l.status === 'critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : l.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
