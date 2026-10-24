import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Smartphone,
  Laptop,
  Server,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Sliders,
  Filter,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function DeviceAccessControl({ onRefreshDashboard }) {
  const [devices, setDevices] = useState([]);
  const [counts, setCounts] = useState({ total: 0, authorized: 0, pending_approval: 0, guest_allowed: 0, quarantined: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // New simulated device form state
  const [simName, setSimName] = useState('');
  const [simType, setSimType] = useState('Guest Smartphone');
  const [simOwner, setSimOwner] = useState('');
  const [simBlock, setSimBlock] = useState('WIFI_MESH');
  const [simNotes, setSimNotes] = useState('Tech Fest Convergence participant seeking Wi-Fi');

  // Approval modal state
  const [approvingDevice, setApprovingDevice] = useState(null);
  const [approveRole, setApproveRole] = useState('guest_allowed');
  const [approveCap, setApproveCap] = useState(15.0);
  const [approveNote, setApproveNote] = useState('Approved by Network Admin for Event Duration');

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterBlock) params.block = filterBlock;
      const data = await api.getDevices(params);
      if (data) {
        setDevices(data.devices || []);
        setCounts(data.counts || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 2500);
    return () => clearInterval(interval);
  }, [filterStatus, filterBlock]);

  const handleSimulateDevice = async (e) => {
    e.preventDefault();
    if (!simName.trim()) return;
    try {
      await api.requestDeviceAccess({
        device_name: simName,
        device_type: simType,
        owner: simOwner || 'External Visitor',
        target_block: simBlock,
        notes: simNotes
      });
      setFeedback({ type: 'success', text: `Connection request simulated for '${simName}'. Device placed in approval queue.` });
      setSimName('');
      setSimOwner('');
      fetchDevices();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleOpenApproval = (device) => {
    setApprovingDevice(device);
    setApproveRole('guest_allowed');
    setApproveCap(15.0);
  };

  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!approvingDevice) return;
    try {
      await api.authorizeDevice(approvingDevice.mac_address, approveRole, parseFloat(approveCap), approveNote);
      setFeedback({ type: 'success', text: `Access granted for ${approvingDevice.device_name} (Role: ${approveRole}, Cap: ${approveCap} Mbps)` });
      setApprovingDevice(null);
      fetchDevices();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleQuarantine = async (mac, name) => {
    try {
      await api.quarantineDevice(mac, 'Administrative isolation / Security policy');
      setFeedback({ type: 'warning', text: `Device '${name}' has been quarantined and isolated from the intranet.` });
      fetchDevices();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleRevoke = async (mac) => {
    try {
      await api.revokeDevice(mac);
      setFeedback({ type: 'info', text: 'Device connection revoked and deleted from active tables.' });
      fetchDevices();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const pendingDevices = devices.filter(d => d.status === 'pending_approval');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Campus Network Access Control (NAC) & Device Permissions</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage unauthorized external devices, review captive portal requests, grant throttled guest permissions, and quarantine rogue hardware.
          </p>
        </div>

        <button
          onClick={fetchDevices}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition self-start md:self-auto"
        >
          Refresh Devices
        </button>
      </div>

      {feedback && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' :
          feedback.type === 'warning' ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30' :
          'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* NAC Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-slate-900/90 rounded-xl border border-emerald-500/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Authorized College Assets</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{counts.authorized || 0}</div>
          <span className="text-[10px] text-slate-500">Lab PCs, Servers, Faculty Laptops</span>
        </div>

        <div className={`p-3.5 bg-slate-900/90 rounded-xl border shadow-sm ${
          counts.pending_approval > 0 ? 'border-amber-500/50 bg-amber-950/10 animate-pulse' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Pending Authorization</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{counts.pending_approval || 0}</div>
          <span className="text-[10px] text-slate-500">Guest requests awaiting approval</span>
        </div>

        <div className="p-3.5 bg-slate-900/90 rounded-xl border border-cyan-500/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Guest Allowed Access</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-1">{counts.guest_allowed || 0}</div>
          <span className="text-[10px] text-slate-500">Throttled external visitor passes</span>
        </div>

        <div className="p-3.5 bg-slate-900/90 rounded-xl border border-rose-500/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Quarantined / Blocked</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{counts.quarantined || 0}</div>
          <span className="text-[10px] text-slate-500">Isolated unauthorized endpoints</span>
        </div>
      </div>

      {/* Pending Unauthorized Requests Queue (Prominent Callout) */}
      <div className="p-5 bg-slate-900/95 border border-amber-500/40 rounded-xl shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Unauthorized Device Access Approval Queue ({pendingDevices.length})
            </h3>
          </div>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
            Action Required
          </span>
        </div>

        {pendingDevices.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800/50">
            <CheckCircle2 className="w-7 h-7 text-emerald-500/40 mx-auto mb-1.5" />
            No unauthorized devices currently waiting for permission. All connected devices are verified.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingDevices.map((dev) => (
              <div
                key={dev.mac_address}
                className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/90 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{dev.device_name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{dev.mac_address} • {dev.device_type}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-bold">
                      Pending
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1.5 space-y-0.5">
                    <div>Owner: <span className="text-slate-200">{dev.owner}</span></div>
                    <div>Target: <span className="text-cyan-300 font-semibold">{dev.target_block}</span> ({dev.ip_address})</div>
                    <div className="text-[10px] text-slate-500 italic mt-1">{dev.notes}</div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-slate-900">
                  <button
                    onClick={() => handleOpenApproval(dev)}
                    className="flex-1 py-1.5 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-semibold transition"
                  >
                    Grant Access
                  </button>
                  <button
                    onClick={() => handleQuarantine(dev.mac_address, dev.device_name)}
                    className="py-1.5 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold transition"
                  >
                    Quarantine
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulator: Inject New Guest Device Request (Interactive Demonstration) */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Interactive Demonstration: Simulate Incoming Device Request</span>
        </h3>
        <p className="text-xs text-slate-400">
          Simulate an external guest laptop or smartphone attempting to connect during college events (Tech Fest, Online Exams, Induction).
        </p>

        <form onSubmit={handleSimulateDevice} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs pt-1">
          <div>
            <label className="text-slate-400 block mb-1">Device Name / Hostname</label>
            <input
              type="text"
              placeholder="e.g. CBIT Hackathon Team 4"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Device Type</label>
            <select
              value={simType}
              onChange={(e) => setSimType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              <option value="Guest Laptop">Guest Laptop (Hackathon / Evaluator)</option>
              <option value="Guest Smartphone">Guest Smartphone (Visitor BYOD)</option>
              <option value="Parent Tablet">Parent Tablet (Induction Program)</option>
              <option value="Proctor Testing Unit">Proctor Unit (Online Examination)</option>
              <option value="Unregistered Microcontroller">Unknown Microcontroller (ESP32/Rogue)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Owner / Organization</label>
            <input
              type="text"
              placeholder="e.g. External Participant"
              value={simOwner}
              onChange={(e) => setSimOwner(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Target Campus Block</label>
            <select
              value={simBlock}
              onChange={(e) => setSimBlock(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
            >
              <option value="WIFI_MESH">Campus Wi-Fi Mesh</option>
              <option value="BLOCK_C">C-Block (CSE, IT, Library)</option>
              <option value="BLOCK_E">E-Block (Auditorium & H&S)</option>
              <option value="BLOCK_A">A-Block (Admin & Examination)</option>
              <option value="BLOCK_B">B-Block (EEE & AI/ML)</option>
              <option value="BLOCK_PG">PG-Block (Incubation Hub)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!simName.trim()}
              className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded font-semibold transition"
            >
              Send Connection Request
            </button>
          </div>
        </form>
      </div>

      {/* Full Device Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <h3 className="font-bold text-white">Campus Connected & Registered Devices ({devices.length})</h3>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300"
            >
              <option value="">All Statuses</option>
              <option value="authorized">Authorized College Assets</option>
              <option value="guest_allowed">Guest Access Allowed</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="quarantined">Quarantined</option>
            </select>

            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300"
            >
              <option value="">All Blocks</option>
              <option value="BLOCK_A">A-Block</option>
              <option value="BLOCK_B">B-Block</option>
              <option value="BLOCK_C">C-Block</option>
              <option value="BLOCK_D">D-Block</option>
              <option value="BLOCK_E">E-Block</option>
              <option value="BLOCK_PG">PG-Block</option>
              <option value="WIFI_MESH">Wi-Fi Mesh</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Device Name</th>
                <th className="py-2.5 px-3">MAC / IP</th>
                <th className="py-2.5 px-3">Block Subnet</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Bandwidth Cap</th>
                <th className="py-2.5 px-3">Policy Notes</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {devices.map((d) => {
                const isAuth = d.status === 'authorized';
                const isGuest = d.status === 'guest_allowed';
                const isPending = d.status === 'pending_approval';
                const isQuarantined = d.status === 'quarantined';

                return (
                  <tr key={d.mac_address} className="hover:bg-slate-850">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{d.device_name}</div>
                      <div className="text-[10px] text-slate-400">{d.device_type} • {d.owner}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <div>{d.mac_address}</div>
                      <div className="text-slate-400">{d.ip_address}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-cyan-300">{d.target_block}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold inline-flex items-center space-x-1 ${
                        isAuth ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isGuest ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                        isPending ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        <span>{d.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {d.bandwidth_cap_mbps > 0 ? `${d.bandwidth_cap_mbps} Mbps` : '0 Mbps (Blocked)'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {d.notes}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {isPending && (
                          <button
                            onClick={() => handleOpenApproval(d)}
                            className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-semibold transition"
                          >
                            Approve
                          </button>
                        )}
                        {!isQuarantined && !d.is_college_asset && (
                          <button
                            onClick={() => handleQuarantine(d.mac_address, d.device_name)}
                            className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] transition"
                            title="Quarantine Device"
                          >
                            Isolate
                          </button>
                        )}
                        {!d.is_college_asset && (
                          <button
                            onClick={() => handleRevoke(d.mac_address)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition"
                            title="Revoke and Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Access / Authorization Modal */}
      {approvingDevice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Grant Network Access Permission</span>
              </h3>
              <button onClick={() => setApprovingDevice(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
              <div>Device: <strong className="text-white">{approvingDevice.device_name}</strong></div>
              <div>MAC: <span className="font-mono text-cyan-300">{approvingDevice.mac_address}</span></div>
              <div>Target Block: <span className="text-slate-200">{approvingDevice.target_block}</span></div>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Access Permission Role</label>
                <select
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="guest_allowed">Guest Access (Throttled for Visitors / Tech Fest)</option>
                  <option value="authorized">Authorize as Verified College Asset</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Bandwidth Quota Cap (Mbps)</label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  max="100"
                  value={approveCap}
                  onChange={(e) => setApproveCap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Recommended: 10–15 Mbps for guest devices to prevent network saturation.
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Authorization Reason / Event Note</label>
                <input
                  type="text"
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingDevice(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold transition"
                >
                  Confirm & Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
