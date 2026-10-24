import React from 'react';
import {
  Activity,
  Server,
  Zap,
  Users,
  AlertTriangle,
  Clock,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Info,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function OverviewDashboard({ dashboardData, onSelectTab }) {
  const latest = dashboardData?.latest_metrics || {};
  const history = dashboardData?.recent_history || [];
  const protocols = dashboardData?.protocol_distribution || [];
  const recentAlerts = dashboardData?.recent_alerts || [];
  const activeControl = dashboardData?.active_control || 'none';
  const blocks = dashboardData?.blocks_summary || {};
  const blockList = Object.values(blocks);
  const breachedCount = dashboardData?.breached_blocks_count || 0;
  const deviceCounts = dashboardData?.device_counts || { total: 0, authorized: 0, guest_allowed: 0, pending_approval: 0, quarantined: 0 };
  const scenarioMeta = dashboardData?.scenario_details || {};
  const activeScenario = dashboardData?.active_scenario || 'normal_academic';

  // Format chart data
  const chartData = history.map((snap) => ({
    step: `#${snap.step_number}`,
    offered: snap.total_offered_mbps,
    transmitted: snap.total_transmitted_mbps,
    dropped: snap.total_dropped_mbps,
    utilization: snap.overall_utilization,
    latency: snap.avg_latency_ms
  }));

  const PROTO_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b'];

  const kpis = [
    {
      label: 'Simulated Network Load',
      value: `${latest.total_offered_mbps || 0} Mbps`,
      subtext: `Delivered: ${latest.total_transmitted_mbps || 0} Mbps`,
      icon: Activity,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20'
    },
    {
      label: 'Configured Network Capacity',
      value: `${dashboardData?.network_capacity_mbps || 0} Mbps`,
      subtext: 'Across all simulated campus links',
      icon: Server,
      color: 'text-blue-400',
      border: 'border-blue-500/20'
    },
    {
      label: 'Overall Utilization',
      value: `${latest.overall_utilization || 0}%`,
      subtext: latest.overall_utilization >= 85 ? 'Critical saturation' : (latest.overall_utilization >= 70 ? 'Warning threshold' : 'Optimal range'),
      icon: Zap,
      color: latest.overall_utilization >= 85 ? 'text-rose-400' : (latest.overall_utilization >= 70 ? 'text-amber-400' : 'text-emerald-400'),
      border: latest.overall_utilization >= 85 ? 'border-rose-500/20' : (latest.overall_utilization >= 70 ? 'border-amber-500/20' : 'border-emerald-500/20')
    },
    {
      label: 'Active Simulated Hosts',
      value: dashboardData?.active_hosts_count || 0,
      subtext: 'CSE, ECE, Admin, Lib, Wi-Fi',
      icon: Users,
      color: 'text-indigo-400',
      border: 'border-indigo-500/20'
    },
    {
      label: 'Congested Links',
      value: latest.active_congested_links || 0,
      subtext: `${latest.active_congested_links > 0 ? 'Exceeding thresholds' : 'All links within normal bounds'}`,
      icon: AlertTriangle,
      color: (latest.active_congested_links || 0) > 0 ? 'text-rose-400' : 'text-emerald-400',
      border: (latest.active_congested_links || 0) > 0 ? 'border-rose-500/30' : 'border-slate-800'
    },
    {
      label: 'Simulated Latency',
      value: `${latest.avg_latency_ms || 0} ms`,
      subtext: 'Propagation + Queue delay',
      icon: Clock,
      color: 'text-sky-400',
      border: 'border-sky-500/20'
    },
    {
      label: 'Simulated Packet Loss',
      value: `${latest.packet_loss_pct || 0}%`,
      subtext: `Dropped: ${latest.total_dropped_mbps || 0} Mbps`,
      icon: TrendingDown,
      color: (latest.packet_loss_pct || 0) > 2 ? 'text-rose-400' : 'text-slate-300',
      border: (latest.packet_loss_pct || 0) > 2 ? 'border-rose-500/20' : 'border-slate-800'
    },
    {
      label: 'Traffic Control Engine',
      value: activeControl === 'none' ? 'Disabled' : activeControl.replace('_', ' ').toUpperCase(),
      subtext: activeControl !== 'none' ? 'Active shaping/policing' : 'FIFO drop-tail baseline',
      icon: ShieldCheck,
      color: activeControl !== 'none' ? 'text-emerald-400' : 'text-slate-400',
      border: activeControl !== 'none' ? 'border-emerald-500/30' : 'border-slate-800'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Environment Status Strip */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-200">VNR VJIET Network Simulation & Traffic Telemetry Engine Active</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">1000ms Ticks &bull; Discrete Event Queue</span>
      </div>

      {/* Active Campus Event Scenario Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">Active Campus Scenario:</span>
              <span className="text-sm font-bold text-white">{scenarioMeta.name || activeScenario}</span>
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold rounded-full border border-cyan-500/30">
                Live State
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Guest Policy: <span className="text-slate-300 font-medium">{scenarioMeta.guest_policy || 'Standard Access Control'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectTab('scenarios')}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition"
        >
          <span>Switch Event Mode</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 bg-slate-900/90 rounded-xl border ${kpi.border} shadow-sm flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="my-2">
                <div className={`text-2xl font-bold tracking-tight ${kpi.color}`}>
                  {kpi.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {kpi.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Throughput & Drops Trend (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Live Network Throughput & Packet Drops</h3>
              <p className="text-xs text-slate-400">Offered demand vs admitted transmission throughput over time</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
              Last {chartData.length} Ticks
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="offeredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="transGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="step" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="offered" stroke="#38bdf8" fillOpacity={1} fill="url(#offeredGrad)" name="Offered Load (Mbps)" />
                <Area type="monotone" dataKey="transmitted" stroke="#34d399" fillOpacity={1} fill="url(#transGrad)" name="Transmitted (Mbps)" />
                <Area type="monotone" dataKey="dropped" stroke="#f43f5e" fillOpacity={1} fill="url(#dropGrad)" name="Dropped (Mbps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution (1 col) */}
        <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Campus Protocol Breakdown</h3>
            <p className="text-xs text-slate-400 mb-3">Simulated transport layer share (TCP / UDP / ICMP)</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocols}
                  dataKey="share_pct"
                  nameKey="protocol"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                >
                  {protocols.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROTO_COLORS[index % PROTO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            {protocols.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROTO_COLORS[idx % PROTO_COLORS.length] }}></span>
                  <span>{p.protocol}</span>
                </div>
                <span className="font-mono text-slate-400">{p.share_pct}% ({p.mbps} Mbps)</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* VNR VJIET Block & Department Bandwidth Quota Monitor */}
      <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">VNR VJIET Block & Department Quota Health</h3>
              {breachedCount > 0 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {breachedCount} Block Quota Breached
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  All Quotas Optimal
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Blocks A, B, C, D, E, PG & Wi-Fi Mesh real-time telemetry vs configured campus limits.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('blocks')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition self-start sm:self-auto"
          >
            Manage Quota Limits &rarr;
          </button>
        </div>

        {/* 7-Block Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {blockList.map((block) => {
            const isBreached = block.quota_status === 'breached';
            const isWarning = block.quota_status === 'warning';
            const barColor = isBreached ? 'bg-rose-500' : (isWarning ? 'bg-amber-500' : 'bg-emerald-500');
            const badgeBg = isBreached
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : (isWarning ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30');

            return (
              <div
                key={block.block_id}
                onClick={() => onSelectTab('blocks')}
                className={`p-3.5 rounded-lg border cursor-pointer transition hover:border-slate-700 ${
                  isBreached ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-slate-200 truncate pr-2" title={block.name}>
                    {block.name.split(':')[0]}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold rounded border ${badgeBg}`}>
                    {block.quota_status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-400">
                    <strong className={isBreached ? 'text-rose-400' : 'text-slate-200'}>{block.current_load_mbps}</strong> / {block.bandwidth_limit_mbps} Mbps
                  </span>
                  <span className={`font-semibold ${isBreached ? 'text-rose-400' : 'text-slate-300'}`}>
                    {block.utilization_pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${barColor} h-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, block.utilization_pct)}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-500 mt-2 truncate">
                  {block.departments.slice(0, 2).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Access Control (NAC) & Device Permissions Banner */}
      <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Campus 802.1X NAC & Guest Device Access Control
            </h4>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
              <span className="text-slate-400">
                Authorized Assets: <strong className="text-emerald-400">{deviceCounts.authorized}</strong>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-400">
                Guest Connections: <strong className="text-cyan-400">{deviceCounts.guest_allowed}</strong>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-400">
                Pending Requests: <strong className={deviceCounts.pending_approval > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}>{deviceCounts.pending_approval}</strong>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-400">
                Quarantined: <strong className={deviceCounts.quarantined > 0 ? 'text-rose-400' : 'text-slate-400'}>{deviceCounts.quarantined}</strong>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('devices')}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
        >
          <span>Device Permissions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Section: Recent Congestion Alerts & Active Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Alerts (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Recent Congestion Events</h3>
            </div>
            <button
              onClick={() => onSelectTab('alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition"
            >
              View All Alerts &rarr;
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              No active congestion alarms. Campus links operating within configured thresholds.
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((evt) => (
                <div
                  key={evt.id || evt.event_id}
                  className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        evt.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {evt.severity}
                      </span>
                      <span className="font-semibold text-slate-200">{evt.link_name}</span>
                      <span className="text-slate-500 text-[11px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{evt.cause}</p>
                  </div>

                  <div className="text-right text-[11px] font-mono text-slate-400 shrink-0 ml-3">
                    <div>Util: <span className="text-white font-semibold">{evt.utilization}%</span></div>
                    <div>Queue: {evt.queue_occupancy}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Control Panel Card (1 col) */}
        <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Active Traffic Control</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real-time intervention applied to bottleneck department distribution links.
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Algorithm:</span>
                <span className="font-semibold text-cyan-300 uppercase">{activeControl.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Intervention Mode:</span>
                <span className="text-slate-300">{activeControl === 'none' ? 'Uncontrolled (Drop-Tail)' : 'Active Regulation'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Bottleneck:</span>
                <span className="text-slate-300 font-mono">SW_CORE ↔ SW_BLOCK_C (CSE/IT)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('control')}
            className="w-full mt-4 py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition"
          >
            Configure Traffic Algorithms &rarr;
          </button>
        </div>

      </div>

    </div>
  );
}
