import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Shield,
  Activity,
  Layers,
  Server
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsAbout({ onRefreshDashboard }) {
  const [warningThreshold, setWarningThreshold] = useState(70);
  const [criticalThreshold, setCriticalThreshold] = useState(85);
  const [persistenceWindow, setPersistenceWindow] = useState(2);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    api.getThresholds()
      .then((data) => {
        if (data) {
          setWarningThreshold(data.warning);
          setCriticalThreshold(data.critical);
          setPersistenceWindow(data.persistence_window);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await api.updateThresholds(warningThreshold, criticalThreshold, persistenceWindow);
      setStatusMessage({ type: 'success', text: 'Congestion thresholds and persistence window updated successfully.' });
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>Congestion Detection & System Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Fine-tune multi-metric thresholds, hysteresis persistence windows, and campus telemetry engine parameters.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-lg text-xs ${
          statusMessage.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Threshold Configuration Form */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Detection Engine Configuration</h3>
        </div>

        <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">
                Warning Threshold (Utilization %)
              </label>
              <input
                type="number"
                min="10"
                max="90"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard: 70%. Marks link in Amber warning state.
              </span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">
                Critical Threshold (Utilization %)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard: 85%. Triggers immediate Red critical alarm.
              </span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">
                Persistence Window (Cycles / Ticks)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={persistenceWindow}
                onChange={(e) => setPersistenceWindow(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Hysteresis filter: requires N consecutive cycles to commit.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold transition"
          >
            {isSaving ? 'Updating Engine...' : 'Save Detection Thresholds'}
          </button>
        </form>
      </div>

      {/* Network Engine & System Architecture Specifications */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Campus Network Engine Architecture
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 block">Hierarchical Infrastructure</span>
            <p className="text-slate-300">
              Campus 3-tier topology with central core routing, 10G optical backbone distribution, and isolated departmental access switches across Blocks A through PG and Wi-Fi Mesh.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 block">Queue & Buffer Telemetry</span>
            <p className="text-slate-300">
              Monitors switch packet queues in real time, calculating dynamic queuing delay and tail-drop packet drops when offered traffic exceeds link capacities.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-400 block">VLAN Segmentation & Quotas</span>
            <p className="text-slate-300">
              Departmental subnets isolated via 802.1Q trunks with configurable per-block bandwidth quota limits and instant breach alarm notifications.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-400 block">Active Traffic Shaping & QoS</span>
            <p className="text-slate-300">
              Executable algorithms including Leaky Bucket traffic smoothing, Token Bucket burst regulation with shaping/policing, and DiffServ Strict Priority Queuing.
            </p>
          </div>

        </div>
      </div>

      {/* System Specifications */}
      <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-400">
        <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">System Specifications</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div>System Name: <span className="text-white">CampusNet Monitor</span></div>
          <div>Target Campus: <span className="text-white">VNR VJIET (Blocks A, B, C, D, E, PG, Wi-Fi)</span></div>
          <div>Stack: <span className="text-white">React 19 + Tailwind CSS + Flask + SQLite3</span></div>
          <div>Simulation Interval: <span className="text-white">1000 ms Discrete Ticks</span></div>
        </div>
      </div>

    </div>
  );
}
