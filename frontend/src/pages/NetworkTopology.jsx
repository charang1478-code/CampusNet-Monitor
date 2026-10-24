import React, { useState, useEffect } from 'react';
import {
  Network,
  Server,
  Router,
  Wifi,
  Laptop,
  Database,
  Plus,
  Trash2,
  RotateCcw,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function NetworkTopology({ topologyData, onRefreshTopology }) {
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editCapacity, setEditCapacity] = useState('');
  const [newHostLabel, setNewHostLabel] = useState('');
  const [newHostSwitch, setNewHostSwitch] = useState('SW_BLOCK_C');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const nodes = topologyData?.nodes || [];
  const links = topologyData?.links || [];

  // Keep selected link updated with latest metrics from parent
  useEffect(() => {
    if (selectedLink) {
      const updated = links.find((l) => l.id === selectedLink.id);
      if (updated) setSelectedLink(updated);
    }
  }, [links]);

  const handleSelectLink = (link) => {
    setSelectedLink(link);
    setEditCapacity(link.capacity_mbps.toString());
    setSelectedNode(null);
    setActionMessage(null);
  };

  const handleUpdateCapacity = async (e) => {
    e.preventDefault();
    if (!selectedLink || !editCapacity) return;
    setIsSubmitting(true);
    try {
      await api.updateLinkCapacity(selectedLink.id, parseFloat(editCapacity));
      setActionMessage({ type: 'success', text: `Capacity of ${selectedLink.name} updated to ${editCapacity} Mbps` });
      onRefreshTopology();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHost = async (e) => {
    e.preventDefault();
    if (!newHostLabel.trim()) return;
    setIsSubmitting(true);
    try {
      await api.addHost(newHostLabel, newHostSwitch);
      setNewHostLabel('');
      setActionMessage({ type: 'success', text: `Simulated host '${newHostLabel}' attached to ${newHostSwitch}` });
      onRefreshTopology();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveHost = async (hostId) => {
    setIsSubmitting(true);
    try {
      await api.removeHost(hostId);
      setActionMessage({ type: 'success', text: `Host removed successfully` });
      setSelectedNode(null);
      onRefreshTopology();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetTopology = async () => {
    if (!window.confirm('Reset network topology to default campus configuration?')) return;
    setIsSubmitting(true);
    try {
      await api.resetTopology();
      setSelectedLink(null);
      setSelectedNode(null);
      setActionMessage({ type: 'success', text: 'Topology reset to default campus layout' });
      onRefreshTopology();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for link color based on congestion severity
  const getLinkColor = (link) => {
    if (link.status === 'critical' || link.utilization_pct >= 85) return '#f43f5e'; // red
    if (link.status === 'warning' || link.utilization_pct >= 70) return '#f59e0b'; // amber
    return '#10b981'; // emerald green
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'router': return Router;
      case 'switch': return Server;
      case 'access_point': return Wifi;
      case 'server': return Database;
      default: return Laptop;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header with Topology Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>Interactive Campus Network Topology</span>
          </h2>
          <p className="text-xs text-slate-400">
            Click links to inspect utilization or adjust capacities. Add simulated hosts to test subnet loads.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Legend */}
          <div className="hidden md:flex items-center space-x-3 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400">Normal (&lt;70%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-400">Warning (70-85%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-400">Critical (&ge;85%)</span>
            </span>
          </div>

          <button
            onClick={handleResetTopology}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Topology</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${
          actionMessage.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Visual Topology Area & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive SVG Diagram (2 cols) */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-4 overflow-x-auto shadow-inner">
          <div className="min-w-[800px] h-[520px] relative">
            <svg className="w-full h-full" viewBox="0 0 1000 500">
              
              {/* Render Links */}
              {links.map((link) => {
                const srcNode = nodes.find((n) => n.id === link.source);
                const tgtNode = nodes.find((n) => n.id === link.target);
                if (!srcNode || !tgtNode) return null;

                const isSelected = selectedLink?.id === link.id;
                const strokeColor = getLinkColor(link);
                const strokeWidth = isSelected ? 4 : (link.layer === 'core' ? 3.5 : 2.5);

                return (
                  <g key={link.id} className="cursor-pointer" onClick={() => handleSelectLink(link)}>
                    {/* Wider transparent hit-area for easy clicking */}
                    <line
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      stroke="transparent"
                      strokeWidth={14}
                    />
                    {/* Visible colored link */}
                    <line
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tgtNode.x}
                      y2={tgtNode.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={link.utilization_pct >= 85 ? '6,3' : 'none'}
                      className="transition-all duration-300"
                    />

                    {/* Midpoint link label badge */}
                    {link.id.startsWith('L_CORE_') && (
                      <g
                        transform={`translate(${(srcNode.x + tgtNode.x) / 2}, ${(srcNode.y + tgtNode.y) / 2})`}
                      >
                        <rect
                          x={-28}
                          y={-9}
                          width={56}
                          height={18}
                          rx={4}
                          fill="#0f172a"
                          stroke={strokeColor}
                          strokeWidth={1}
                        />
                        <text
                          x={0}
                          y={3}
                          textAnchor="middle"
                          fill="#e2e8f0"
                          fontSize={9}
                          fontFamily="monospace"
                        >
                          {link.utilization_pct}%
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Render Nodes */}
              {nodes.map((node) => {
                const IconComponent = getNodeIcon(node.type);
                const isSelected = selectedNode?.id === node.id;
                const isRouter = node.type === 'router';
                const isSwitch = node.type === 'switch';
                const isAP = node.type === 'access_point';
                const isServer = node.type === 'server';

                let fillBg = '#1e293b';
                let strokeColor = '#475569';
                if (isRouter) {
                  fillBg = '#1e1b4b';
                  strokeColor = '#6366f1';
                } else if (isSwitch) {
                  fillBg = '#0c4a6e';
                  strokeColor = '#0284c7';
                } else if (isAP) {
                  fillBg = '#064e3b';
                  strokeColor = '#10b981';
                } else if (isServer) {
                  fillBg = '#3b0764';
                  strokeColor = '#c084fc';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedNode(node);
                      setSelectedLink(null);
                    }}
                  >
                    {/* Node Circle / Box */}
                    <rect
                      x={-22}
                      y={-22}
                      width={44}
                      height={44}
                      rx={node.type === 'host' ? 6 : 10}
                      fill={fillBg}
                      stroke={isSelected ? '#38bdf8' : strokeColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all"
                    />

                    {/* Icon Representation */}
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize={11}
                      fontWeight="bold"
                    >
                      {node.type === 'host' ? 'PC' : (node.type === 'server' ? 'SRV' : (isRouter ? 'RT' : (isAP ? 'AP' : 'SW')))}
                    </text>

                    {/* Label below node */}
                    <text
                      x={0}
                      y={34}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                      fontWeight="500"
                    >
                      {node.label}
                    </text>

                    {/* IP Subnet */}
                    <text
                      x={0}
                      y={45}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize={8}
                      fontFamily="monospace"
                    >
                      {node.ip}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Details & Inspector Panel (1 col) */}
        <div className="space-y-4">
          
          {/* Selected Link Inspector */}
          {selectedLink ? (
            <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Link Inspector</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  selectedLink.status === 'critical' ? 'bg-rose-500/20 text-rose-400' : (selectedLink.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400')
                }`}>
                  {selectedLink.status}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">{selectedLink.name}</h4>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedLink.source} &rarr; {selectedLink.target}
                </div>
              </div>

              {/* Real-time Link Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Offered Load</span>
                  <span className="font-semibold text-slate-200">{selectedLink.offered_mbps} Mbps</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Transmitted</span>
                  <span className="font-semibold text-emerald-400">{selectedLink.transmitted_mbps} Mbps</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Utilization</span>
                  <span className="font-semibold text-white">{selectedLink.utilization_pct}%</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Queue Packets</span>
                  <span className="font-semibold text-slate-200">{selectedLink.current_queue_packets} / {selectedLink.max_queue_packets}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Packet Drops</span>
                  <span className={`font-semibold ${selectedLink.packet_drops > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {selectedLink.packet_drops} drops
                  </span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Latency</span>
                  <span className="font-semibold text-sky-400">{selectedLink.latency_ms} ms</span>
                </div>
              </div>

              {/* Modify Link Bandwidth Capacity */}
              <form onSubmit={handleUpdateCapacity} className="pt-2 border-t border-slate-800">
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Configured Bandwidth Capacity (Mbps)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="5"
                    min="1"
                    max="10000"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          ) : selectedNode ? (
            /* Selected Node Inspector */
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Node Inspector</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                  {selectedNode.type}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{selectedNode.label}</h4>
                <div className="text-xs text-slate-400 mt-0.5">IP: <span className="font-mono text-cyan-300">{selectedNode.ip}</span></div>
                {selectedNode.vlan && <div className="text-xs text-slate-400">VLAN: <span className="text-slate-300">{selectedNode.vlan}</span></div>}
                {selectedNode.dept && <div className="text-xs text-slate-400">Department: <span className="text-slate-300">{selectedNode.dept}</span></div>}
              </div>

              {selectedNode.type === 'host' && (
                <button
                  onClick={() => handleRemoveHost(selectedNode.id)}
                  disabled={isSubmitting}
                  className="w-full mt-2 flex items-center justify-center space-x-1 py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Host</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-xl text-center text-xs text-slate-400">
              Click any link or network device in the campus diagram to view live telemetry and configuration controls.
            </div>
          )}

          {/* Add Simulated Host Form */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Simulated Host</span>
            </h4>
            <form onSubmit={handleAddHost} className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Host Name / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. M.Tech Research Node"
                  value={newHostLabel}
                  onChange={(e) => setNewHostLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Department Switch</label>
                <select
                  value={newHostSwitch}
                  onChange={(e) => setNewHostSwitch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  {nodes
                    .filter((n) => n.layer === 'distribution' || n.type === 'switch' || n.type === 'access_point')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} ({s.id})
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newHostLabel.trim()}
                className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded font-semibold transition"
              >
                Add Host to Campus
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
