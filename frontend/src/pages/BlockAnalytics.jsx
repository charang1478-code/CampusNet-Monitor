import React, { useState } from 'react';
import {
  Building2,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  ShieldAlert,
  ArrowRight,
  Wifi,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function BlockAnalytics({ dashboardData, onRefresh }) {
  const blocks = dashboardData?.blocks_summary || {};
  const [editingBlock, setEditingBlock] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const breachedBlocks = Object.values(blocks).filter(b => b.quota_status === 'breached');
  const warningBlocks = Object.values(blocks).filter(b => b.quota_status === 'warning');

  const handleOpenEdit = (block) => {
    setEditingBlock(block);
    setNewLimit(block.bandwidth_limit_mbps.toString());
    setFeedback(null);
  };

  const handleSaveLimit = async (e) => {
    e.preventDefault();
    if (!editingBlock || !newLimit) return;
    setIsUpdating(true);
    try {
      await api.updateBlockLimit(editingBlock.block_id, parseFloat(newLimit));
      setFeedback({ type: 'success', text: `Bandwidth quota for ${editingBlock.name} updated to ${newLimit} Mbps` });
      setEditingBlock(null);
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'breached':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Limit Breached</span>
          </span>
        );
      case 'warning':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Quota Warning (&ge;80%)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Within Limit</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">VNR VJIET Block & Department Network Analytics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time traffic segregation, departmental VLAN subnets, and bandwidth limit breach alerting across Blocks A, B, C, D, E, PG, and Campus Wi-Fi.
          </p>
        </div>

        <a
          href="https://www.vnrvjiet.ac.in/departments"
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition self-start md:self-auto"
        >
          <span>VNRVJIET Portal</span>
          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
        </a>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-xs ${
          feedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Quota Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Campus Blocks Monitored</span>
            <span className="text-2xl font-bold text-white mt-1 block">7 Zones</span>
            <span className="text-[11px] text-slate-500">Blocks A, B, C, D, E, PG + Wi-Fi</span>
          </div>
          <Layers className="w-8 h-8 text-cyan-400/40" />
        </div>

        <div className={`p-4 bg-slate-900/90 rounded-xl border flex items-center justify-between ${
          breachedBlocks.length > 0 ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-800'
        }`}>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Quota Limit Breaches</span>
            <span className={`text-2xl font-bold mt-1 block ${breachedBlocks.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {breachedBlocks.length} Blocks
            </span>
            <span className="text-[11px] text-slate-500">
              {breachedBlocks.length > 0 ? 'Requires shaping or limit raise' : 'All blocks within allocated bandwidth'}
            </span>
          </div>
          <ShieldAlert className={`w-8 h-8 ${breachedBlocks.length > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
        </div>

        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Quota Warning State</span>
            <span className={`text-2xl font-bold mt-1 block ${warningBlocks.length > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {warningBlocks.length} Blocks
            </span>
            <span className="text-[11px] text-slate-500">Utilizing &gt;80% of block limit</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-400/40" />
        </div>
      </div>

      {/* Grid of Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.values(blocks).map((b) => {
          const isBreached = b.quota_status === 'breached';
          const isWarning = b.quota_status === 'warning';
          const utilPct = b.quota_utilization_pct || 0;

          return (
            <div
              key={b.block_id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isBreached
                  ? 'bg-slate-900/95 border-rose-500/50 shadow-lg shadow-rose-500/5'
                  : isWarning
                  ? 'bg-slate-900/95 border-amber-500/40'
                  : 'bg-slate-900/85 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{b.name}</h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{b.vlan}</span>
                      <span>•</span>
                      <span>{b.subnet}</span>
                    </div>
                  </div>
                  {getStatusBadge(b.quota_status)}
                </div>

                {/* Departments in this block */}
                <div className="my-3 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Housed Departments & Labs:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {b.departments.map((dept, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bandwidth Quota Progress Bar */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Allocated Quota Limit:</span>
                    <span className="font-mono text-white font-bold">{b.bandwidth_limit_mbps} Mbps</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Current Trunk Load:</span>
                    <span className={`font-mono font-bold ${
                      isBreached ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {b.current_load_mbps} Mbps ({utilPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isBreached ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry Numbers */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  <div>Offered: <span className="text-slate-200">{b.total_offered_mbps}M</span></div>
                  <div>Transmitted: <span className="text-emerald-400">{b.total_transmitted_mbps}M</span></div>
                  <div>Dropped: <span className={b.total_dropped_mbps > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>{b.total_dropped_mbps}M</span></div>
                  <div>Trunk: <span className="uppercase text-slate-300">{b.trunk_status}</span></div>
                </div>
              </div>

              {/* Configure Limit Button */}
              <button
                onClick={() => handleOpenEdit(b)}
                className="w-full mt-4 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Configure Bandwidth Limit</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit Limit Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Configure Block Quota Limit</span>
              </h3>
              <button onClick={() => setEditingBlock(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-cyan-300">{editingBlock.name}</h4>
              <p className="text-xs text-slate-400 mt-1">
                If aggregate departmental traffic on this trunk exceeds the configured threshold, real-time quota breach alerts will be broadcast to the NOC console.
              </p>
            </div>

            <form onSubmit={handleSaveLimit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Configured Bandwidth Limit (Mbps)
                </label>
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="1000"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Current Limit: {editingBlock.bandwidth_limit_mbps} Mbps
                </span>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBlock(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold transition"
                >
                  {isUpdating ? 'Saving...' : 'Apply Block Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
