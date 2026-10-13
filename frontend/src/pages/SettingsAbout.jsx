import React, { useState, useEffect } from 'react';
import {
  Settings,
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Shield,
  GraduationCap
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
          <span>Congestion Detection Settings & Syllabus Mapping</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Fine-tune multi-metric thresholds, review theoretical syllabus mapping, and check lab alignment.
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

      {/* Complete Syllabus Mapping (Academic Documentation) */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">
            B.Tech Computer Networks Syllabus Alignment
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 block">Unit I: Network Architecture & Physical/Data Link Layers</span>
            <p className="text-slate-300">
              Demonstrates hierarchical tree/star campus topologies, transmission bandwidth capacities (Mbps), propagation delays, and network boundary aggregation.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 block">Unit II: Queues, Buffer Management & Flow Control</span>
            <p className="text-slate-300">
              Models packet buffers at intermediate switches, finite queue lengths, tail-drop overflow mechanisms, and queue occupancy calculations.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-400 block">Unit III: Logical Topologies, VLANs & Forwarding</span>
            <p className="text-slate-300">
              Models department VLAN segmentation (VLAN 10 CSE, 20 ECE, 30 Admin, 40 Library, 50 Wi-Fi) interconnected via trunk switch interfaces and core gateway routing.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-400 block">Unit IV: Congestion Control, Leaky/Token Bucket & QoS</span>
            <p className="text-slate-300">
              Direct implementation of Leaky Bucket traffic smoothing, Token Bucket burst regulation with shaping/policing, and DiffServ Quality of Service (FIFO vs Strict Priority Queuing).
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1 md:col-span-2">
            <span className="font-bold text-emerald-400 block">Computer Networks Lab Integration (Week 10 & Weeks 12-13)</span>
            <p className="text-slate-300 leading-relaxed">
              <strong>Week 10 (Wireshark Packet Analysis):</strong> Mirrors Wireshark protocol distribution counters (TCP, UDP, ICMP packet breakdown) and throughput time-series graphs.<br />
              <strong>Weeks 12-13 (Cisco Packet Tracer Simulation):</strong> Serves as an interactive, programmatically verifiable software equivalent of router/switch campus topology models.
            </p>
          </div>

        </div>
      </div>

      {/* Project Metadata & Academic Disclaimer */}
      <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-400">
        <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Academic Project Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div>Project Title: <span className="text-white">Campus Network Congestion Detection and Traffic Control System</span></div>
          <div>Course: <span className="text-white">B.Tech III Semester Computer Networks Course Based Project (CBP)</span></div>
          <div>Architecture: <span className="text-white">React 19 + Vite + Tailwind CSS + Flask + SQLite3</span></div>
          <div>Execution Mode: <span className="text-white">Local Standalone Prototype (No physical campus hardware altered)</span></div>
        </div>
      </div>

    </div>
  );
}
