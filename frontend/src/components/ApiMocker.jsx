import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  FileText, 
  Globe, 
  Clock, 
  Settings,
  AlertCircle
} from 'lucide-react';

function ApiMocker({ backendUrl }) {
  const [active, setActive] = useState(false);
  const [port, setPort] = useState(5000);
  const [endpoints, setEndpoints] = useState([]);
  const [history, setHistory] = useState([]);

  // New endpoint form state
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [status, setStatus] = useState(200);
  const [delay, setDelay] = useState(0);
  const [responseBody, setResponseBody] = useState('{\n  "status": "success",\n  "data": {}\n}');
  const [jsonError, setJsonError] = useState('');

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/mock-server/config`);
      if (res.ok) {
        const data = await res.json();
        setActive(data.active);
        setPort(data.port);
        setEndpoints(data.endpoints);
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Error fetching mock configuration', err);
    }
  };

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, 3000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  const handleStartStop = async () => {
    const endpoint = active ? 'stop' : 'start';
    try {
      const res = await fetch(`${backendUrl}/api/mock-server/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: Number(port) })
      });
      const data = await res.json();
      if (res.ok) {
        setActive(!active);
        fetchConfig();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Connection failed: ${err.message}`);
    }
  };

  const handleAddEndpoint = async (e) => {
    e.preventDefault();
    setJsonError('');

    // Quick JSON validation
    try {
      if (responseBody.trim()) {
        JSON.parse(responseBody);
      }
    } catch (err) {
      setJsonError('Invalid JSON format. Please correct it before saving.');
      return;
    }

    if (!path.startsWith('/')) {
      alert('Endpoint path must start with a slash (e.g. /api/users)');
      return;
    }

    const newEndpoint = {
      id: String(Date.now()),
      method,
      path,
      status: Number(status),
      delay: Number(delay),
      response: responseBody
    };

    const updatedEndpoints = [...endpoints, newEndpoint];

    try {
      const res = await fetch(`${backendUrl}/api/mock-server/endpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: updatedEndpoints })
      });
      if (res.ok) {
        setEndpoints(updatedEndpoints);
        // Reset form
        setPath('');
        setResponseBody('{\n  "status": "success",\n  "data": {}\n}');
      }
    } catch (err) {
      alert(`Failed to save endpoint: ${err.message}`);
    }
  };

  const handleDeleteEndpoint = async (id) => {
    const updatedEndpoints = endpoints.filter(e => e.id !== id);
    try {
      const res = await fetch(`${backendUrl}/api/mock-server/endpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: updatedEndpoints })
      });
      if (res.ok) {
        setEndpoints(updatedEndpoints);
      }
    } catch (err) {
      alert(`Failed to delete endpoint: ${err.message}`);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/mock-server/history/clear`, { method: 'POST' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <header className="view-header">
        <h1 className="view-title">Dynamic API Mocker</h1>
        <p className="view-subtitle">Generate dynamic developer API endpoints and spin up custom local mock servers.</p>
      </header>

      {/* Control Card */}
      <div className="glass-card glow-on-active" style={{ borderLeft: active ? '4px solid var(--color-success)' : '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Settings size={24} className="color-accent" style={{ color: 'var(--color-accent)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Server Controller</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {active ? `Mock server actively listening on port ${port}` : 'Mock server stands by'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="input-group" style={{ margin: 0, width: '120px' }}>
              <input 
                type="number" 
                className="form-input" 
                value={port} 
                onChange={(e) => setPort(e.target.value)} 
                disabled={active}
                placeholder="Port"
                style={{ padding: '0.6rem 0.8rem' }}
              />
            </div>
            <button 
              className={active ? 'btn-danger' : 'btn-primary'} 
              onClick={handleStartStop}
              style={{ padding: '0.65rem 1.5rem' }}
            >
              {active ? <><Square size={16} /> Stop Server</> : <><Play size={16} /> Start Server</>}
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Endpoint Creator Form */}
        <div className="glass-card">
          <h3 className="card-title"><Plus size={18} /> Add Mock Endpoint</h3>
          <form onSubmit={handleAddEndpoint}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="input-group" style={{ flex: '1' }}>
                <span className="input-label">HTTP Method</span>
                <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="input-group" style={{ flex: '3' }}>
                <span className="input-label">Route Path</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={path} 
                  onChange={(e) => setPath(e.target.value)} 
                  placeholder="/api/v1/users"
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="input-group">
                <span className="input-label">HTTP Status</span>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="200">200 OK</option>
                  <option value="201">201 Created</option>
                  <option value="400">400 Bad Request</option>
                  <option value="401">401 Unauthorized</option>
                  <option value="403">403 Forbidden</option>
                  <option value="404">404 Not Found</option>
                  <option value="500">500 Server Error</option>
                </select>
              </div>

              <div className="input-group">
                <span className="input-label">Latency Delay (ms)</span>
                <input 
                  type="number" 
                  className="form-input" 
                  value={delay} 
                  onChange={(e) => setDelay(e.target.value)} 
                  placeholder="0"
                  min="0"
                  max="10000"
                />
              </div>
            </div>

            <div className="input-group">
              <span className="input-label">JSON Response Body</span>
              <textarea 
                className="form-textarea code-textarea" 
                value={responseBody} 
                onChange={(e) => setResponseBody(e.target.value)} 
                rows="6"
                placeholder="{}"
                required
              ></textarea>
              {jsonError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  <AlertCircle size={14} /> {jsonError}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              <Plus size={16} /> Save Endpoint Route
            </button>
          </form>
        </div>

        {/* Existing Mock Endpoints List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title"><Globe size={18} /> Mock Endpoints Routes</h3>
          <div style={{ overflowY: 'auto', flexGrow: 1, maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {endpoints.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
                No active mock routes. Create one using the form on the left.
              </div>
            ) : (
              endpoints.map((e) => (
                <div key={e.id} className="glass-card" style={{ padding: '1rem', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${e.method === 'GET' ? 'info' : e.method === 'POST' ? 'success' : e.method === 'DELETE' ? 'danger' : 'warning'}`}>
                        {e.method}
                      </span>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{e.path}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Response status: <span style={{ color: 'var(--text-primary)' }}>{e.status}</span> &bull; Delay: <span style={{ color: 'var(--text-primary)' }}>{e.delay}ms</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteEndpoint(e.id)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-error)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Request Logs */}
      <div className="glass-card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}><Clock size={18} /> Request Execution Stream</h3>
          <button className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={handleClearHistory}>
            <Trash2 size={12} /> Clear Stream
          </button>
        </div>

        <div className="console-container" style={{ height: '180px' }}>
          {history.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>No requests received by the mock server yet. Try making a call.</span>
          ) : (
            [...history].reverse().map((h, idx) => (
              <div key={idx} className="console-line">
                <span className="console-time">[{h.timestamp}]</span>
                <span className={`badge ${h.method === 'GET' ? 'info' : h.method === 'POST' ? 'success' : 'warning'}`} style={{ transform: 'scale(0.85)', padding: '0.1rem 0.4rem' }}>
                  {h.method}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{h.url}</span>
                <span style={{ marginLeft: 'auto' }} className={`console-msg ${h.status >= 200 && h.status < 300 ? 'success' : 'error'}`}>
                  HTTP {h.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ApiMocker;
