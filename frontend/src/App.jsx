import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Terminal, 
  Network, 
  FileCode, 
  Database,
  Send,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import ApiMocker from './components/ApiMocker';
import PortManager from './components/PortManager';
import ApiClient from './components/ApiClient';
import EnvManager from './components/EnvManager';
import DbPlayground from './components/DbPlayground';

const BACKEND_URL = 'http://localhost:4000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendStats, setBackendStats] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setBackendStats(data);
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch (err) {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  // Poll backend stats every 2.5 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2500);
    return () => clearInterval(interval);
  }, []);

  const renderActiveView = () => {
    if (!backendOnline && !loading) {
      return (
        <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'center', padding: '4rem 2rem' }}>
          <AlertTriangle size={64} className="color-error" style={{ color: 'var(--color-error)', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Control Center Offline</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Aether DevStack backend service is not running. Please start the backend server to enable local system stats, SQLite playground, mock API routing, and port control utilities.
          </p>
          <button className="btn-primary" onClick={fetchStats}>
            <RefreshCw size={16} /> Reconnect Control Center
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={backendStats} backendUrl={BACKEND_URL} />;
      case 'mocker':
        return <ApiMocker backendUrl={BACKEND_URL} />;
      case 'ports':
        return <PortManager backendUrl={BACKEND_URL} />;
      case 'client':
        return <ApiClient backendUrl={BACKEND_URL} />;
      case 'env':
        return <EnvManager backendUrl={BACKEND_URL} />;
      case 'db':
        return <DbPlayground backendUrl={BACKEND_URL} />;
      default:
        return <Dashboard stats={backendStats} backendUrl={BACKEND_URL} />;
    }
  };

  const getMenuBtnClass = (tabName) => {
    return `menu-item-btn ${activeTab === tabName ? 'active' : ''}`;
  };

  return (
    <div className="app-container">
      {/* Dynamic Glassmorphic Sidebar */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <Cpu size={24} color="#fff" />
          </div>
          <span className="brand-name">Aether DevStack</span>
        </div>

        <nav className="sidebar-menu">
          <button className={getMenuBtnClass('dashboard')} onClick={() => setActiveTab('dashboard')}>
            <Activity size={18} /> Dashboard
          </button>
          <button className={getMenuBtnClass('mocker')} onClick={() => setActiveTab('mocker')}>
            <Terminal size={18} /> API Mocker
          </button>
          <button className={getMenuBtnClass('ports')} onClick={() => setActiveTab('ports')}>
            <Network size={18} /> Port Manager
          </button>
          <button className={getMenuBtnClass('client')} onClick={() => setActiveTab('client')}>
            <Send size={18} /> Request Sandbox
          </button>
          <button className={getMenuBtnClass('env')} onClick={() => setActiveTab('env')}>
            <FileCode size={18} /> .env Editor
          </button>
          <button className={getMenuBtnClass('db')} onClick={() => setActiveTab('db')}>
            <Database size={18} /> SQL Explorer
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="server-status-pill">
            <div className={`status-dot ${backendOnline ? 'active' : 'stopped'}`}></div>
            <div>
              <div style={{ fontWeight: 600 }}>Control Center</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {backendOnline ? 'Online (Port 4000)' : 'Offline'}
              </div>
            </div>
          </div>

          <div className="server-status-pill">
            <div className={`status-dot ${backendStats?.activeServices?.mockServer === 'running' ? 'active' : 'stopped'}`}></div>
            <div>
              <div style={{ fontWeight: 600 }}>API Mock Server</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {backendStats?.activeServices?.mockServer === 'running' ? 'Running' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Working Viewport */}
      <main className="main-viewport">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
