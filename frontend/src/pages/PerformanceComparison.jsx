import React, { useState } from 'react';
import {
  GitCompare,
  Play,
  RotateCcw,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

export default function PerformanceComparison({ onRefreshDashboard }) {
  const [profile, setProfile] = useState('burst_traffic');
  const [duration, setDuration] = useState(20);
  const [algorithm, setAlgorithm] = useState('leaky_bucket');
  const [seed, setSeed] = useState(42);
  const [isRunning, setIsRunning] = useState(false);
  const [experimentResult, setExperimentResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunExperiment = async (e) => {
    e.preventDefault();
    setIsRunning(true);
    setError(null);
    try {
      const res = await api.runExperiment(profile, duration, algorithm, {}, null, seed);
      if (res.success && res.experiment) {
        setExperimentResult(res.experiment);
        if (onRefreshDashboard) onRefreshDashboard();
      } else {
        setError('Experiment did not return valid result');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const baseRes = experimentResult?.baseline_results;
  const ctrlRes = experimentResult?.controlled_results;
  const cmpMetrics = experimentResult?.comparison_metrics || {};

  // Chart data comparing metrics side-by-side
  const chartData = [
    {
      metric: 'Throughput (Mbps)',
      baseline: baseRes?.delivered_throughput_mbps || 0,
      controlled: ctrlRes?.delivered_throughput_mbps || 0
    },
    {
      metric: 'Latency (ms)',
      baseline: baseRes?.avg_latency_ms || 0,
      controlled: ctrlRes?.avg_latency_ms || 0
    },
    {
      metric: 'Packet Loss (%)',
      baseline: baseRes?.packet_loss_pct || 0,
      controlled: ctrlRes?.packet_loss_pct || 0
    },
    {
      metric: 'Peak Queue (pkts)',
      baseline: baseRes?.peak_queue_packets || 0,
      controlled: ctrlRes?.peak_queue_packets || 0
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <span>Before-and-After Performance Comparison (1-Click Workflow)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Executes identical workloads under uncontrolled FIFO baseline vs active traffic control algorithm with deterministic seed reproducibility.
          </p>
        </div>

        {experimentResult && (
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <a
              href={api.getExperimentCsvUrl(experimentResult.experiment_id)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <a
              href={api.getExperimentReportUrl(experimentResult.experiment_id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printable Report</span>
            </a>
          </div>
        )}
      </div>

      {/* 1-Click Experiment Setup Form */}
      <form onSubmit={handleRunExperiment} className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Configure Controlled Experiment Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Workload Profile</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              <option value="burst_traffic">Burst Traffic Spike (220 Mbps)</option>
              <option value="large_file_transfers">Heavy ISO File Transfers (160 Mbps)</option>
              <option value="video_conferencing">Video Lectures / UDP (110 Mbps)</option>
              <option value="normal_browsing">Normal Academic Load (45 Mbps)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Intervention Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              <option value="leaky_bucket">Leaky Bucket Traffic Shaping</option>
              <option value="token_bucket">Token Bucket Rate Limiting / Burst Control</option>
              <option value="qos_priority">Strict Priority Queuing (QoS)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Simulation Duration (Ticks)</label>
            <input
              type="number"
              min="5"
              max="60"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Random Seed (Reproducibility)</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isRunning}
          className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition"
        >
          {isRunning ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Running Baseline & Controlled Simulation Phases...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Automated Before-and-After Experiment</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Results View */}
      {experimentResult && (
        <div className="space-y-6">
          
          {/* Side-by-Side Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Baseline Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phase 1: Baseline</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Uncontrolled FIFO</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Delivered Throughput</span>
                  <span className="text-lg font-bold text-white">{baseRes?.delivered_throughput_mbps} Mbps</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Average Latency</span>
                  <span className="text-lg font-bold text-slate-300">{baseRes?.avg_latency_ms} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Packet Loss Rate</span>
                  <span className="text-lg font-bold text-rose-400">{baseRes?.packet_loss_pct}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Peak Queue Occupancy</span>
                  <span className="text-lg font-bold text-slate-300">{baseRes?.peak_queue_packets} pkts</span>
                </div>
              </div>
            </div>

            {/* Controlled Card */}
            <div className="p-5 bg-slate-900 border border-cyan-500/40 rounded-xl space-y-3 shadow-lg shadow-cyan-500/5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Phase 2: Controlled</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase">
                  {algorithm.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Delivered Throughput</span>
                  <span className="text-lg font-bold text-emerald-400">{ctrlRes?.delivered_throughput_mbps} Mbps</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Average Latency</span>
                  <span className="text-lg font-bold text-cyan-300">{ctrlRes?.avg_latency_ms} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Packet Loss Rate</span>
                  <span className={`text-lg font-bold ${ctrlRes?.packet_loss_pct < baseRes?.packet_loss_pct ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ctrlRes?.packet_loss_pct}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Peak Queue Occupancy</span>
                  <span className="text-lg font-bold text-slate-300">{ctrlRes?.peak_queue_packets} pkts</span>
                </div>
              </div>
            </div>

          </div>

          {/* Side-by-Side Chart */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-4">Baseline vs Controlled Metric Comparison</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="metric" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="baseline" fill="#64748b" name="Baseline (Uncontrolled)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="controlled" fill="#38bdf8" name="Controlled (With Algorithm)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Academic Delta Table */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-white">Mathematical Delta Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Metric Name</th>
                    <th className="py-2.5 px-3 text-right">Baseline</th>
                    <th className="py-2.5 px-3 text-right">Controlled</th>
                    <th className="py-2.5 px-3 text-right">Net Delta</th>
                    <th className="py-2.5 px-3 text-right">Change (%)</th>
                    <th className="py-2.5 px-3 text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {Object.entries(cmpMetrics).map(([key, item]) => {
                    const isImproved = item.status === 'improved';
                    const isDegraded = item.status === 'degraded';
                    return (
                      <tr key={key} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-sans font-medium text-white capitalize">
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-right">{item.baseline}</td>
                        <td className="py-2.5 px-3 text-right text-cyan-300 font-semibold">{item.controlled}</td>
                        <td className="py-2.5 px-3 text-right">{item.raw_diff}</td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {item.pct_change > 0 ? `+${item.pct_change}%` : `${item.pct_change}%`}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold inline-flex items-center space-x-1 ${
                            isImproved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isDegraded
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isImproved ? <TrendingUp className="w-3 h-3" /> : (isDegraded ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />)}
                            <span>{item.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discussion Note */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <span className="font-semibold text-cyan-400 flex items-center space-x-1.5">
              <Info className="w-4 h-4" />
              <span>Performance Observations & Analysis:</span>
            </span>
            <p className="text-slate-400 leading-relaxed">
              {experimentResult.summary_notes}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
