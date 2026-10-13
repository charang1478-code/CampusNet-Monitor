import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewDashboard from './pages/OverviewDashboard';
import NetworkTopology from './pages/NetworkTopology';
import LiveMonitoring from './pages/LiveMonitoring';
import CongestionAlerts from './pages/CongestionAlerts';
import TrafficControl from './pages/TrafficControl';
import PerformanceComparison from './pages/PerformanceComparison';
import ExperimentHistory from './pages/ExperimentHistory';
import SettingsAbout from './pages/SettingsAbout';
import { api } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [topologyData, setTopologyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Poll state from Flask backend
  const fetchState = async () => {
    try {
      const [dash, topo] = await Promise.all([
        api.getDashboard(),
        api.getTopology()
      ]);
      setDashboardData(dash);
      setTopologyData(topo);
      setError(null);
    } catch (err) {
      console.error('Polling error:', err);
      setError(err.message || 'Cannot connect to CampusNet backend service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSimulationAction = async (action) => {
    try {
      if (action === 'start') await api.startSimulation();
      else if (action === 'pause') await api.pauseSimulation();
      else if (action === 'resume') await api.resumeSimulation();
      else if (action === 'step') await api.stepSimulation();
      else if (action === 'reset') await api.resetSimulation();
      fetchState();
    } catch (err) {
      console.error('Simulation control error:', err);
    }
  };

  const alertCount = (dashboardData?.recent_alerts || []).filter(a => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        dashboardData={dashboardData}
        onSimulationAction={handleSimulationAction}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          alertCount={alertCount}
        />

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/70">
          <div className="max-w-7xl mx-auto">
            
            {error && (
              <div className="mb-6 p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs text-rose-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-bold">Backend Connection Warning: </span>
                    {error}. Ensure Flask backend is running on port 5000 (<code className="bg-slate-900 px-1 py-0.5 rounded">python backend/app.py</code>).
                  </div>
                </div>
                <button
                  onClick={fetchState}
                  className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded font-semibold transition"
                >
                  Retry
                </button>
              </div>
            )}

            {/* View Router */}
            {activeTab === 'dashboard' && (
              <OverviewDashboard
                dashboardData={dashboardData}
                onSelectTab={setActiveTab}
              />
            )}

            {activeTab === 'topology' && (
              <NetworkTopology
                topologyData={topologyData}
                onRefreshTopology={fetchState}
              />
            )}

            {activeTab === 'monitoring' && (
              <LiveMonitoring
                dashboardData={dashboardData}
                topologyData={topologyData}
                onRefresh={fetchState}
              />
            )}

            {activeTab === 'alerts' && (
              <CongestionAlerts
                onRefreshDashboard={fetchState}
              />
            )}

            {activeTab === 'control' && (
              <TrafficControl
                dashboardData={dashboardData}
                onRefresh={fetchState}
              />
            )}

            {activeTab === 'comparison' && (
              <PerformanceComparison
                onRefreshDashboard={fetchState}
              />
            )}

            {activeTab === 'history' && (
              <ExperimentHistory />
            )}

            {activeTab === 'settings' && (
              <SettingsAbout
                onRefreshDashboard={fetchState}
              />
            )}

          </div>
        </main>
      </div>

    </div>
  );
}
