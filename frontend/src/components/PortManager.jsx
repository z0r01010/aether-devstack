import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Search, 
  AlertOctagon, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Plus, 
  RefreshCw 
} from 'lucide-react';

function PortManager({ backendUrl }) {
  const [monitoredPorts, setMonitoredPorts] = useState([3000, 4000, 5000, 8000, 8080, 9000]);
  const [newPort, setNewPort] = useState('');
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runPortScan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/ports/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ports: monitoredPorts })
      });
      if (res.ok) {
        const data = await res.json();
        setScanResults(data);
      }
    } catch (err) {
      console.error('Port scan failure', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPortScan();
  }, [monitoredPorts, backendUrl]);

  const handleAddPort = (e) => {
    e.preventDefault();
    const portNum = Number(newPort);
    if (!portNum || portNum < 1 || portNum > 65535) {
      alert('Enter a valid port number between 1 and 65535.');
      return;
    }
    if (monitoredPorts.includes(portNum)) {
      alert('Port is already being monitored.');
      return;
    }
    setMonitoredPorts([...monitoredPorts, portNum]);
    setNewPort('');
  };

  const handleDeleteMonitoredPort = (portToDelete) => {
    setMonitoredPorts(monitoredPorts.filter(p => p !== portToDelete));
  };

  const handleKillProcess = async (pid, port) => {
    if (!confirm(`Are you sure you want to terminate process PID ${pid} running on port ${port}? This will force-close the running application.`)) {
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/ports/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: Number(pid), port: Number(port) })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully terminated port ${port} process.`);
        runPortScan();
      } else {
        alert(`Failed to terminate process: ${data.error}`);
      }
    } catch (err) {
      alert(`Error sending command: ${err.message}`);
    }
  };

  return (
    <div>
      <header className="view-header">
        <h1 className="view-title">Port Manager & Killer</h1>
        <p className="view-subtitle">Scan local ports, check active processes (PIDs), and instantly terminate port-blocking programs.</p>
      </header>

      <div className="grid-2">
        {/* Scanned Ports Panel */}
        <div className="glass-card" style={{ gridColumn: 'span 2 / span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}><Network size={20} /> Port Scan Status</h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={runPortScan} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : ''} /> {loading ? 'Scanning...' : 'Rescan Ports'}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="sql-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Port Number</th>
                  <th style={{ width: '25%' }}>Status</th>
                  <th style={{ width: '25%' }}>Process ID (PID)</th>
                  <th style={{ width: '30%', textSelf: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scanResults.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                      No ports scanned. Add ports to monitor.
                    </td>
                  </tr>
                ) : (
                  scanResults.map((result) => (
                    <tr key={result.port}>
                      <td>
                        <strong style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>{result.port}</strong>
                      </td>
                      <td>
                        <span className={`badge ${result.active ? 'danger' : 'success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {result.active ? (
                            <><XCircle size={12} /> Occupied</>
                          ) : (
                            <><CheckCircle2 size={12} /> Available</>
                          )}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {result.active ? (
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>PID {result.pid}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>--</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {result.active ? (
                            <button 
                              className="btn-danger" 
                              onClick={() => handleKillProcess(result.pid, result.port)}
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            >
                              <AlertOctagon size={14} /> Force Terminate
                            </button>
                          ) : (
                            <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                              Ready for use
                            </span>
                          )}
                          <button 
                            className="btn-secondary"
                            onClick={() => handleDeleteMonitoredPort(result.port)}
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Remove from monitoring list"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Port Panel */}
        <div className="glass-card" style={{ gridColumn: 'span 2 / span 2' }}>
          <h3 className="card-title"><Plus size={18} /> Monitor Additional Port</h3>
          <form onSubmit={handleAddPort} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
            <div className="input-group" style={{ margin: 0, flexGrow: 1 }}>
              <span className="input-label">Port Number</span>
              <input 
                type="number" 
                className="form-input" 
                value={newPort} 
                onChange={(e) => setNewPort(e.target.value)} 
                placeholder="e.g. 9090"
                min="1"
                max="65535"
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
              <Plus size={16} /> Add Port
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PortManager;
