import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function ExperimentHistory() {
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getExperimentHistory();
      setHistory(data);
      if (data.length > 0 && !expandedId) {
        setExpandedId(data[0].experiment_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>SQLite Experiment Run History</span>
          </h2>
          <p className="text-xs text-slate-400">
            Persistent archive of completed baseline-vs-controlled academic benchmarks.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition self-start sm:self-auto"
        >
          Refresh History
        </button>
      </div>

      {history.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          No past experiment records found in SQLite database.
          <p className="mt-1">Navigate to 'Performance Comparison' and run an experiment to record data.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((exp) => {
            const isExpanded = expandedId === exp.experiment_id;
            const cmp = exp.comparison_metrics || {};
            const base = exp.baseline_results || {};
            const ctrl = exp.controlled_results || {};

            return (
              <div
                key={exp.experiment_id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(exp.experiment_id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-850"
                >
                  <div className="flex items-center space-x-3">
                    <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{exp.experiment_id}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {exp.algorithm.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Workload: <span className="text-slate-200 capitalize">{exp.profile_name.replace('_', ' ')}</span> • {exp.duration_steps} steps • {new Date(exp.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <a
                      href={api.getExperimentCsvUrl(exp.experiment_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 hover:bg-slate-800 text-slate-300 rounded transition"
                      title="Download CSV"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <a
                      href={api.getExperimentReportUrl(exp.experiment_id)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 hover:bg-slate-800 text-cyan-400 rounded transition"
                      title="Print HTML Report"
                    >
                      <Printer className="w-4 h-4" />
                    </a>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 bg-slate-950/40 text-xs space-y-4">
                    {/* Quick Metric Comparison Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                      <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Delivered Throughput</span>
                        <span className="font-bold text-white font-mono">{base.delivered_throughput_mbps} &rarr; <span className="text-cyan-400">{ctrl.delivered_throughput_mbps} Mbps</span></span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Average Latency</span>
                        <span className="font-bold text-white font-mono">{base.avg_latency_ms} &rarr; <span className="text-sky-400">{ctrl.avg_latency_ms} ms</span></span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Packet Loss</span>
                        <span className="font-bold text-white font-mono">{base.packet_loss_pct}% &rarr; <span className="text-emerald-400">{ctrl.packet_loss_pct}%</span></span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Peak Queue</span>
                        <span className="font-bold text-white font-mono">{base.peak_queue_packets} &rarr; {ctrl.peak_queue_packets} pkts</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded border border-slate-800 text-slate-300">
                      <span className="font-semibold text-slate-400 block mb-1">Academic Notes:</span>
                      {exp.summary_notes}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
