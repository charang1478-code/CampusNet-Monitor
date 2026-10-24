import React from 'react';
import {
  LayoutDashboard,
  Network,
  Building2,
  ShieldCheck,
  Sparkles,
  Activity,
  AlertTriangle,
  Sliders,
  GitCompare,
  History,
  Settings
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  alertCount = 0,
  breachedBlocksCount = 0,
  pendingDevicesCount = 0
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'topology', label: 'Campus Topology', icon: Network },
    { id: 'blocks', label: 'Blocks & Departments', icon: Building2, badge: breachedBlocksCount, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { id: 'devices', label: 'Device Access & NAC', icon: ShieldCheck, badge: pendingDevicesCount, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { id: 'scenarios', label: 'Campus Scenarios', icon: Sparkles },
    { id: 'monitoring', label: 'Live Traffic Monitoring', icon: Activity },
    { id: 'alerts', label: 'Congestion Alerts', icon: AlertTriangle, badge: alertCount, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { id: 'control', label: 'Traffic Control (QoS)', icon: Sliders },
    { id: 'comparison', label: 'Performance Comparison', icon: GitCompare },
    { id: 'history', label: 'Experiment History', icon: History },
    { id: 'settings', label: 'Settings & Syllabus', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800/80">
        <div className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
          VNR VJIET Network NOC
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Campus Simulation & Control
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>Campus:</span>
          <span className="text-slate-300 font-medium">VNR VJIET (A–PG)</span>
        </div>
        <div className="flex justify-between">
          <span>Course:</span>
          <span className="text-slate-400 font-medium">B.Tech III Sem CN</span>
        </div>
        <div className="flex justify-between">
          <span>Engine:</span>
          <span className="text-slate-400 font-medium">Flask + Discrete Ticks</span>
        </div>
      </div>
    </aside>
  );
}
