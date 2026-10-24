import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Users,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function CampusScenarios({ dashboardData, onRefresh }) {
  const [isActivating, setIsActivating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const activeScenario = dashboardData?.active_scenario || 'normal_academic';
  const scenarioDetails = dashboardData?.scenario_details || {};

  const scenarios = [
    {
      id: 'normal_academic',
      name: 'Standard Academic Working Day',
      subtitle: 'Routine Lab Sessions, Theory & Research',
      description: 'Balanced network traffic distributed evenly across all engineering blocks (A, B, C, D, E, PG). Standard 802.1X student authentication and routine department quotas enforced.',
      targetBlocks: ['All Blocks (A, B, C, D, E, PG)'],
      baseLoad: '75–85 Mbps',
      securityPosture: 'Standard 802.1X Authentication',
      guestPolicy: 'Approval required; throttled to 10 Mbps',
      icon: Briefcase,
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'tech_fest',
      name: 'Annual Tech Fest (Convergence / Sintillashunz)',
      subtitle: 'Hackathons, Coding Contests & External Visitors',
      description: 'Massive surge in student BYOD and external participant devices. High Wi-Fi demand across C-Block (CSE/IT hackathon labs), E-Block (Auditorium competitions), and open festival grounds. Guest requests auto-queued with 15 Mbps caps.',
      targetBlocks: ['C-Block (Labs)', 'E-Block (Auditorium)', 'Campus Wi-Fi'],
      baseLoad: '260 Mbps (High Saturation)',
      securityPosture: 'Open Captive Portal with Dynamic Shaping',
      guestPolicy: 'Guest access granted with 15 Mbps cap; auto-quarantine on rogue ARP',
      icon: Sparkles,
      color: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10'
    },
    {
      id: 'online_exams',
      name: 'Autonomous Online Examinations (Lockdown)',
      subtitle: 'TCS iON / End-Semester Exam Hall Security',
      description: 'Strict security lockdown mode. Dedicated high-priority bandwidth reserved for Block A (Examination Branch Server) and Block C (Exam Computer Labs). Unauthorized Wi-Fi devices in exam zones are automatically quarantined to prevent malpractice.',
      targetBlocks: ['A-Block (Exam Branch)', 'C-Block (Exam Labs)'],
      baseLoad: '140 Mbps (High Priority Traffic)',
      securityPosture: 'High-Security Strict MAC Whitelist & VLAN Isolation',
      guestPolicy: 'STRICT LOCKDOWN: Unauthorized devices in exam blocks blocked',
      icon: ShieldAlert,
      color: 'border-rose-500/50 text-rose-400 bg-rose-500/10'
    },
    {
      id: 'induction_program',
      name: 'First-Year Induction & Orientation Program',
      subtitle: 'Parent & New Student Welcome at K.S. Auditorium',
      description: 'Orientation gathering centered around Block E (Central Auditorium & H&S Department). Large crowds of parents and incoming students onboarded with temporary guest passes for web access.',
      targetBlocks: ['E-Block (Central Auditorium)', 'Campus Wi-Fi'],
      baseLoad: '180 Mbps',
      securityPosture: 'Guest Onboarding Captive Portal Active',
      guestPolicy: 'Temporary 1-day guest passes issued for web & campus portal only',
      icon: GraduationCap,
      color: 'border-amber-500/50 text-amber-400 bg-amber-500/10'
    }
  ];

  const handleActivate = async (scenarioId) => {
    setIsActivating(true);
    setFeedback(null);
    try {
      const res = await api.activateScenario(scenarioId);
      setFeedback({ type: 'success', text: res.message || `Activated scenario: ${scenarioId}` });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">VNR VJIET Campus Event Scenarios & Policies</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between real-world institutional modes (Tech Fest, Online Exams, Induction, Normal Day) to observe dynamic bandwidth allocation and device access policies.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs self-start md:self-auto">
          <span className="text-slate-400">Current Active Mode:</span>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase border border-cyan-500/30">
            {activeScenario.replace('_', ' ')}
          </span>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-xs ${
          feedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Active Mode Highlight Card */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl space-y-2 shadow-lg shadow-cyan-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Live Campus Policy Enforcement</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Tick Step #{dashboardData?.step_number || 0}</span>
        </div>

        <h3 className="text-lg font-bold text-white">{scenarioDetails.name || 'Standard Academic Operation'}</h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          {scenarioDetails.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Active Security Posture</span>
            <span className="font-semibold text-white mt-0.5 block">{scenarioDetails.security_posture}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Guest Device Permission Policy</span>
            <span className="font-semibold text-cyan-300 mt-0.5 block">{scenarioDetails.guest_policy}</span>
          </div>
        </div>
      </div>

      {/* 4 Interactive Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = activeScenario === sc.id;

          return (
            <div
              key={sc.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-slate-900/95 border-cyan-500 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg border ${sc.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{sc.name}</h4>
                      <span className="text-[11px] text-slate-400">{sc.subtitle}</span>
                    </div>
                  </div>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 my-3 leading-relaxed">
                  {sc.description}
                </p>

                <div className="space-y-1.5 p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Focus Blocks:</span>
                    <span className="text-slate-200 font-medium">{sc.targetBlocks.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Offered Load:</span>
                    <span className="text-cyan-300 font-mono font-semibold">{sc.baseLoad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guest Access:</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{sc.guestPolicy}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleActivate(sc.id)}
                disabled={isActive || isActivating}
                className={`w-full mt-4 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                }`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Currently Active Mode</span>
                  </>
                ) : (
                  <>
                    <span>Activate {sc.name.split(' ')[0]} Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
