/**
 * CampusNet Monitor API Client
 * Interfaces with Flask REST backend endpoints.
 */

const API_BASE = '/api';

export const api = {
  // Dashboard & Status
  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch dashboard metrics`);
    return res.json();
  },

  // Topology Management
  async getTopology() {
    const res = await fetch(`${API_BASE}/topology`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch topology`);
    return res.json();
  },

  async updateLinkCapacity(linkId, capacityMbps) {
    const res = await fetch(`${API_BASE}/topology/link/capacity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: linkId, capacity_mbps: capacityMbps })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update link capacity');
    }
    return res.json();
  },

  async addHost(label, switchId, ip) {
    const res = await fetch(`${API_BASE}/topology/host/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, switch_id: switchId, ip })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add host');
    }
    return res.json();
  },

  async removeHost(hostId) {
    const res = await fetch(`${API_BASE}/topology/host/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_id: hostId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove host');
    }
    return res.json();
  },

  async resetTopology() {
    const res = await fetch(`${API_BASE}/topology/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset topology');
    return res.json();
  },

  // Simulation Lifecycle
  async startSimulation() {
    const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
    return res.json();
  },

  async pauseSimulation() {
    const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
    return res.json();
  },

  async resumeSimulation() {
    const res = await fetch(`${API_BASE}/simulation/resume`, { method: 'POST' });
    return res.json();
  },

  async stopSimulation() {
    const res = await fetch(`${API_BASE}/simulation/stop`, { method: 'POST' });
    return res.json();
  },

  async stepSimulation() {
    const res = await fetch(`${API_BASE}/simulation/step`, { method: 'POST' });
    return res.json();
  },

  async resetSimulation() {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    return res.json();
  },

  async setProfile(profile, customLoad = null) {
    const payload = { profile };
    if (customLoad !== null) payload.custom_load_mbps = customLoad;
    const res = await fetch(`${API_BASE}/simulation/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async boostLink(linkId, multiplier = 2.5) {
    const res = await fetch(`${API_BASE}/simulation/boost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: linkId, multiplier })
    });
    return res.json();
  },

  // Link Telemetry
  async getLinks() {
    const res = await fetch(`${API_BASE}/links`);
    return res.json();
  },

  // Alerts & Events
  async getAlerts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/alerts?${query}`);
    return res.json();
  },

  async acknowledgeAlert(eventId) {
    const res = await fetch(`${API_BASE}/alerts/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId })
    });
    return res.json();
  },

  async clearAlerts() {
    const res = await fetch(`${API_BASE}/alerts/clear`, { method: 'POST' });
    return res.json();
  },

  // Settings & Thresholds
  async getThresholds() {
    const res = await fetch(`${API_BASE}/settings/thresholds`);
    return res.json();
  },

  async updateThresholds(warning, critical, persistenceWindow) {
    const res = await fetch(`${API_BASE}/settings/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warning: Number(warning),
        critical: Number(critical),
        persistence_window: Number(persistenceWindow)
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update thresholds');
    }
    return res.json();
  },

  // Traffic Control & QoS
  async configureControl(algorithm, config = {}) {
    const res = await fetch(`${API_BASE}/control/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm, config })
    });
    return res.json();
  },

  async configureQoS(mode, totalBuffer = 20.0, capacity = 45.0) {
    const res = await fetch(`${API_BASE}/control/qos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, total_buffer_mb: totalBuffer, link_capacity_mbps: capacity })
    });
    return res.json();
  },

  // Experiments
  async runExperiment(profile, duration, algorithm, config = {}, customLoad = null, seed = 42) {
    const res = await fetch(`${API_BASE}/experiments/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        duration: Number(duration),
        algorithm,
        config,
        custom_load_mbps: customLoad,
        random_seed: Number(seed)
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Experiment execution failed');
    }
    return res.json();
  },

  async getExperimentHistory() {
    const res = await fetch(`${API_BASE}/experiments/history`);
    return res.json();
  },

  // VNR VJIET Block & Department Quota Management
  async getBlocks() {
    const res = await fetch(`${API_BASE}/blocks`);
    return res.json();
  },

  async updateBlockLimit(blockId, limitMbps) {
    const res = await fetch(`${API_BASE}/blocks/limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_id: blockId, limit_mbps: limitMbps })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update block limit');
    }
    return res.json();
  },

  // Network Access Control (NAC) & Device Permissions
  async getDevices(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/devices?${query}`);
    return res.json();
  },

  async authorizeDevice(macAddress, status = 'guest_allowed', bandwidthCap = 15.0, notes = '') {
    const res = await fetch(`${API_BASE}/devices/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac_address: macAddress, status, bandwidth_cap_mbps: bandwidthCap, notes })
    });
    return res.json();
  },

  async quarantineDevice(macAddress, reason = 'Security policy violation') {
    const res = await fetch(`${API_BASE}/devices/quarantine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac_address: macAddress, reason })
    });
    return res.json();
  },

  async revokeDevice(macAddress) {
    const res = await fetch(`${API_BASE}/devices/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac_address: macAddress })
    });
    return res.json();
  },

  async requestDeviceAccess(deviceData) {
    const res = await fetch(`${API_BASE}/devices/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
    return res.json();
  },

  // Campus Event Scenarios (Tech Fest, Online Exams, Induction, Normal)
  async getScenarios() {
    const res = await fetch(`${API_BASE}/scenarios`);
    return res.json();
  },

  async activateScenario(scenarioId) {
    const res = await fetch(`${API_BASE}/scenarios/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to activate scenario');
    }
    return res.json();
  },

  // Export URLs
  getMetricsCsvUrl() {
    return `${API_BASE}/export/metrics/csv`;
  },

  getEventsCsvUrl() {
    return `${API_BASE}/export/events/csv`;
  },

  getExperimentCsvUrl(experimentId = null) {
    return experimentId ? `${API_BASE}/export/experiment/csv?experiment_id=${experimentId}` : `${API_BASE}/export/experiment/csv`;
  },

  getExperimentReportUrl(experimentId = null) {
    return experimentId ? `${API_BASE}/export/experiment/report?experiment_id=${experimentId}` : `${API_BASE}/export/experiment/report`;
  }
};
