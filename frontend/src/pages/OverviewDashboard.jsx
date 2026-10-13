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
  Info
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
      
      {/* Academic Simulation Notice */}
      <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-start space-x-3 text-xs text-blue-200">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Simulated Campus Environment: </span>
          All data points, packet drops, delays, and queues reflect the local time-stepped network simulation engine built for the B.Tech Computer Networks Course Based Project. Real campus hardware is neither accessed nor altered.
        </div>
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
                <span className="text-slate-300 font-mono">SW_CORE ↔ SW_CSE</span>
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
