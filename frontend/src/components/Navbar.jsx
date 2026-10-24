import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Activity, Sparkles } from 'lucide-react';

export default function Navbar({ dashboardData, onSimulationAction }) {
  const status = dashboardData?.status || 'stopped';
  const activeControl = dashboardData?.active_control || 'none';
  const activeScenario = dashboardData?.active_scenario || 'normal_academic';

  const getScenarioBadge = (sc) => {
    switch (sc) {
      case 'tech_fest':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'online_exams':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'induction_program':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Project Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">CampusNet Monitor</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                VNR VJIET
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Blocks A–PG Network Congestion & Device Access Control Console
            </p>
          </div>
        </div>

        {/* Center: Active Campus Event Scenario */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-slate-400">Mode:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getScenarioBadge(activeScenario)}`}>
            {activeScenario.replace('_', ' ')}
          </span>
        </div>

        {/* Right Controls: Simulator Status & Actions */}
        <div className="flex items-center space-x-3">
          {/* Status Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'running'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : status === 'paused'
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  : 'bg-slate-500'
              }`}
            />
            <span className="capitalize font-medium text-slate-300">{status}</span>
            <span className="text-slate-500 text-[11px]">#{dashboardData?.step_number || 0}</span>
          </div>

          {/* Quick Sim Controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 space-x-0.5">
            {status === 'running' ? (
              <button
                onClick={() => onSimulationAction('pause')}
                title="Pause Simulation"
                className="p-1.5 hover:bg-slate-800 text-amber-400 rounded transition"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onSimulationAction(status === 'paused' ? 'resume' : 'start')}
                title={status === 'paused' ? 'Resume Simulation' : 'Start Simulation'}
                className="p-1.5 hover:bg-slate-800 text-emerald-400 rounded transition"
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onSimulationAction('step')}
              title="Step Forward 1 Tick"
              className="p-1.5 hover:bg-slate-800 text-cyan-400 rounded transition"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSimulationAction('reset')}
              title="Reset Simulator"
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Active Control Tag */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">Control:</span>
            <span className={`font-semibold uppercase text-[11px] ${
              activeControl !== 'none' ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {activeControl.replace('_', ' ')}
            </span>
          </div>

        </div>
      </div>
    </header>
  );
}
