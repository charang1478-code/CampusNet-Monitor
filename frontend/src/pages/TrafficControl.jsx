import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Disc,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function TrafficControl({ dashboardData, onRefresh }) {
  const activeControl = dashboardData?.active_control || 'none';
  const algoStats = dashboardData?.algorithm_stats || {};
  const leakyStats = algoStats.leaky_bucket || {};
  const tokenStats = algoStats.token_bucket || {};
  const qosStats = algoStats.qos_scheduler || {};

  // Form states for algorithm tuning
  const [leakyCapacity, setLeakyCapacity] = useState(leakyStats.capacity_mb || 15);
  const [leakyRate, setLeakyRate] = useState(leakyStats.output_rate_mbps || 35);

  const [tokenRate, setTokenRate] = useState(tokenStats.token_rate_mbps || 40);
  const [tokenCapacity, setTokenCapacity] = useState(tokenStats.bucket_capacity_tokens || 50);
  const [tokenMode, setTokenMode] = useState(tokenStats.mode || 'shaping');

  const [qosMode, setQosMode] = useState(qosStats.mode || 'priority');
  const [qosBuffer, setQosBuffer] = useState(qosStats.total_buffer_mb || 20);
  const [qosLinkCap, setQosLinkCap] = useState(qosStats.link_capacity_mbps || 45);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleActivateAlgorithm = async (algo, config = {}) => {
    setIsSubmitting(true);
    try {
      await api.configureControl(algo, config);
      setFeedback({
        type: 'success',
        text: `Traffic control updated: ${algo === 'none' ? 'Disabled (FIFO drop-tail)' : algo.replace('_', ' ').toUpperCase() + ' activated'}`
      });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLeakyConfig = (e) => {
    e.preventDefault();
    handleActivateAlgorithm('leaky_bucket', {
      capacity_mb: parseFloat(leakyCapacity),
      output_rate_mbps: parseFloat(leakyRate)
    });
  };

  const handleUpdateTokenConfig = (e) => {
    e.preventDefault();
    handleActivateAlgorithm('token_bucket', {
      token_rate_mbps: parseFloat(tokenRate),
      bucket_capacity_tokens: parseFloat(tokenCapacity),
      mode: tokenMode
    });
  };

  const handleUpdateQoSConfig = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.configureQoS(qosMode, parseFloat(qosBuffer), parseFloat(qosLinkCap));
      await api.configureControl('qos_priority', { mode: qosMode });
      setFeedback({ type: 'success', text: `QoS Scheduling updated to '${qosMode.toUpperCase()}' policy` });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Traffic Control & QoS Scheduling Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Executable Python implementation of Leaky Bucket, Token Bucket, and Strict Priority Queuing (Unit IV CN).
          </p>
        </div>

        {/* Global On/Off toggle */}
        <div className="flex items-center space-x-2">
          {activeControl !== 'none' ? (
            <button
              onClick={() => handleActivateAlgorithm('none')}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
            >
              Disable Traffic Control
            </button>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              Control: Drop-Tail FIFO
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-xs ${
          feedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Grid of 3 Traffic Control Approaches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Leaky Bucket Algorithm */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
          activeControl === 'leaky_bucket'
            ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Algorithm 1</span>
              {activeControl === 'leaky_bucket' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Leaky Bucket Traffic Shaping</h3>
            <p className="text-xs text-slate-400 mb-4">
              Buffers bursty incoming traffic into a finite queue and releases it at a constant, uniform output rate.
            </p>

            {/* Visual Bucket Fill Gauge */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 mb-4">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Bucket Buffer Fill:</span>
                <span className="font-mono text-cyan-300 font-semibold">{leakyStats.current_fill_mb || 0} / {leakyCapacity} Mb</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, leakyStats.fill_percentage || 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Constant Leak Rate: {leakyRate} Mbps</span>
                <span>{leakyStats.fill_percentage || 0}% Occupancy</span>
              </div>
            </div>

            {/* Config Form */}
            <form onSubmit={handleUpdateLeakyConfig} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Buffer Capacity (Mb)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={leakyCapacity}
                  onChange={(e) => setLeakyCapacity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Constant Leak Rate (Mbps)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="200"
                  value={leakyRate}
                  onChange={(e) => setLeakyRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold transition"
              >
                {activeControl === 'leaky_bucket' ? 'Update Leaky Bucket' : 'Activate Leaky Bucket'}
              </button>
            </form>
          </div>

          {/* Cumulative Statistics */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Admitted:</span>
              <span className="font-mono text-emerald-400">{leakyStats.total_admitted_mb || 0} Mb</span>
            </div>
            <div className="flex justify-between">
              <span>Transmitted:</span>
              <span className="font-mono text-cyan-300">{leakyStats.total_transmitted_mb || 0} Mb</span>
            </div>
            <div className="flex justify-between">
              <span>Buffer Drops:</span>
              <span className="font-mono text-rose-400">{leakyStats.total_dropped_mb || 0} Mb</span>
            </div>
          </div>
        </div>

        {/* 2. Token Bucket Algorithm */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
          activeControl === 'token_bucket'
            ? 'bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Algorithm 2</span>
              {activeControl === 'token_bucket' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Token Bucket Burst Control</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tokens replenish at rate <em>r</em>. Allows instantaneous bursts up to bucket capacity <em>B</em> while capping sustained throughput.
            </p>

            {/* Visual Token Level Gauge */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 mb-4">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Available Tokens:</span>
                <span className="font-mono text-indigo-300 font-semibold">{tokenStats.current_tokens || 0} / {tokenCapacity}</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((tokenStats.current_tokens || 0) / (tokenCapacity || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Rate: {tokenRate} tokens/sec</span>
                <span>Mode: <strong className="uppercase text-slate-300">{tokenMode}</strong></span>
              </div>
            </div>

            {/* Config Form */}
            <form onSubmit={handleUpdateTokenConfig} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Token Generation Rate (Mbps)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="200"
                  value={tokenRate}
                  onChange={(e) => setTokenRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Token Capacity / Burst Allowance (Tokens)</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="200"
                  value={tokenCapacity}
                  onChange={(e) => setTokenCapacity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Enforcement Mode</label>
                <select
                  value={tokenMode}
                  onChange={(e) => setTokenMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="shaping">Traffic Shaping (Buffer packets while waiting for tokens)</option>
                  <option value="policing">Traffic Policing (Drop non-conforming burst immediately)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition"
              >
                {activeControl === 'token_bucket' ? 'Update Token Bucket' : 'Activate Token Bucket'}
              </button>
            </form>
          </div>

          {/* Cumulative Statistics */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Burst Events Allowed:</span>
              <span className="font-mono text-indigo-300">{tokenStats.burst_events || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Transmitted:</span>
              <span className="font-mono text-emerald-400">{tokenStats.total_transmitted_mb || 0} Mb</span>
            </div>
            <div className="flex justify-between">
              <span>Policed Drops:</span>
              <span className="font-mono text-rose-400">{tokenStats.total_dropped_mb || 0} Mb</span>
            </div>
          </div>
        </div>

        {/* 3. QoS Priority Scheduling */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
          activeControl === 'qos_priority'
            ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Algorithm 3</span>
              {activeControl === 'qos_priority' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Quality of Service (QoS) Scheduling</h3>
            <p className="text-xs text-slate-400 mb-4">
              Compares FIFO Drop-Tail vs Strict Priority Queuing across Voice/Video (High), Web (Medium), and Bulk (Low).
            </p>

            {/* Per-class breakdown stats */}
            <div className="space-y-1.5 mb-4 text-xs">
              {['high', 'medium', 'low'].map((c) => {
                const classData = qosStats.classes?.[c] || {};
                const color = c === 'high' ? 'text-emerald-400' : (c === 'medium' ? 'text-cyan-400' : 'text-slate-400');
                return (
                  <div key={c} className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className={`font-semibold capitalize ${color}`}>{c} Priority</span>
                      <div className="text-[10px] text-slate-500">{c === 'high' ? 'Voice / Video' : (c === 'medium' ? 'Web Browsing' : 'Bulk Downloads')}</div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <div>Loss: <span className={classData.packet_loss_pct > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{classData.packet_loss_pct || 0}%</span></div>
                      <div className="text-slate-500">Delay: {classData.avg_delay_ms || 0} ms</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Config Form */}
            <form onSubmit={handleUpdateQoSConfig} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Scheduling Policy</label>
                <select
                  value={qosMode}
                  onChange={(e) => setQosMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="priority">Strict Priority Queuing (Protects Voice/Video)</option>
                  <option value="fifo">FIFO (Equal tail-drop across all classes)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Buffer Size (Mb)</label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="100"
                    value={qosBuffer}
                    onChange={(e) => setQosBuffer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Link Rate (Mbps)</label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="200"
                    value={qosLinkCap}
                    onChange={(e) => setQosLinkCap(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition"
              >
                {activeControl === 'qos_priority' ? 'Update QoS Scheduler' : 'Activate QoS Scheduler'}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Policy: </span>
            <strong className="text-white uppercase">{qosMode} Queuing</strong>
          </div>
        </div>

      </div>

    </div>
  );
}
