import React from 'react';
import {
  LayoutDashboard,
  Network,
  Activity,
  AlertTriangle,
  Sliders,
  GitCompare,
  History,
  Settings,
  BookOpen
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, alertCount = 0 }) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'topology', label: 'Campus Topology', icon: Network },
    { id: 'monitoring', label: 'Live Traffic Monitoring', icon: Activity },
    { id: 'alerts', label: 'Congestion Alerts', icon: AlertTriangle, badge: alertCount },
    { id: 'control', label: 'Traffic Control (QoS)', icon: Sliders },
    { id: 'comparison', label: 'Performance Comparison', icon: GitCompare },
    { id: 'history', label: 'Experiment History', icon: History },
    { id: 'settings', label: 'Settings & Syllabus', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800/80">
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Network Operations Center
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Campus Simulation Console
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
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
          <span>Course:</span>
          <span className="text-slate-400 font-medium">B.Tech III Sem CN</span>
        </div>
        <div className="flex justify-between">
          <span>Engine:</span>
          <span className="text-slate-400 font-medium">Python 3 + Flask</span>
        </div>
        <div className="flex justify-between">
          <span>Database:</span>
          <span className="text-slate-400 font-medium">SQLite3 (Active)</span>
        </div>
      </div>
    </aside>
  );
}
