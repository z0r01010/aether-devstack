import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Clock, 
  Layers, 
  Terminal,
  RefreshCw,
  Trash2
} from 'lucide-react';

function Dashboard({ stats, backendUrl }) {
  const [logs, setLogs] = useState([]);
  const consoleEndRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // Autoscroll console logs to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Format uptime (seconds -> days, hours, mins, secs)
  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? `${d}d ` : "";
    const hDisplay = h > 0 ? `${h}h ` : "";
    const mDisplay = m > 0 ? `${m}m ` : "";
    const sDisplay = s > 0 ? `${s}s` : `${s}s`;
    return dDisplay + hDisplay + mDisplay + sDisplay;
  };

  return (
    <div>
      <header className="view-header">
        <h1 className="view-title">System Control Center</h1>
        <p className="view-subtitle">Monitor server parameters, process statuses, and system execution diagnostics.</p>
      </header>

      {/* Stats Widgets */}
      <div className="grid-3">
        {/* CPU Util Card */}
        <div className="glass-card stat-box">
          <div className="card-title" style={{ marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
            <Cpu size={20} /> CPU Load
          </div>
          <div className="stat-value">{stats ? `${stats.cpu}%` : '0%'}</div>
          <div className="stat-progress-bar">
            <div 
              className="stat-progress-fill" 
              style={{ width: `${stats ? stats.cpu : 0}%`, background: 'linear-gradient(90deg, #a855f7, #6366f1)' }}
            ></div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {stats ? stats.cpuModel : 'Loading processor details...'}
          </span>
        </div>

        {/* Memory Util Card */}
        <div className="glass-card stat-box">
          <div className="card-title" style={{ marginBottom: '0.5rem', color: 'var(--color-info)' }}>
            <HardDrive size={20} /> Memory Usage
          </div>
          <div className="stat-value">{stats ? `${stats.memory}%` : '0%'}</div>
          <div className="stat-progress-bar">
            <div 
              className="stat-progress-fill" 
              style={{ width: `${stats ? stats.memory : 0}%`, background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }}
            ></div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {stats ? `${stats.freeMemoryGB} GB free of ${stats.totalMemoryGB} GB` : 'Loading...'}
          </span>
        </div>

        {/* Uptime Widget */}
        <div className="glass-card stat-box">
          <div className="card-title" style={{ marginBottom: '0.5rem', color: 'var(--color-success)' }}>
            <Clock size={20} /> Server Uptime
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
            {stats ? formatUptime(stats.uptime) : '0s'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
            Platform: <span style={{ textTransform: 'capitalize', color: '#fff' }}>{stats ? stats.platform : 'Loading...'}</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1rem' }}>
        {/* System Diagnostics Info */}
        <div className="glass-card">
          <h3 className="card-title"><Layers size={18} /> OS Properties</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.6rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Operating System:</span>
              <span style={{ marginLeft: 'auto', fontWeight: 500 }}>{stats ? stats.os : 'Loading...'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.6rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Backend Port:</span>
              <span style={{ marginLeft: 'auto', fontWeight: 500, color: 'var(--color-accent)' }}>4000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.6rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active DB Service:</span>
              <span style={{ marginLeft: 'auto', fontWeight: 500, color: 'var(--color-success)' }}>SQLite (devstack.db)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'between', paddingBottom: '0.2rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mock Server status:</span>
              <span 
                className={`badge ${stats?.activeServices?.mockServer === 'running' ? 'success' : 'warning'}`} 
                style={{ marginLeft: 'auto' }}
              >
                {stats ? stats.activeServices.mockServer : 'stopped'}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Web server Logs */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}><Terminal size={18} /> Console Output</h3>
            <button className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={fetchLogs}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          <div className="console-container">
            {logs.length === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>Waiting for system logs...</span>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="console-line">
                  <span className="console-time">[{log.timestamp}]</span>
                  <span className={`console-msg ${log.type}`}>{log.message}</span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
