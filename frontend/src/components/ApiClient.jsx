import React, { useState } from 'react';
import { 
  Send, 
  History, 
  Play, 
  Trash2,
  Clock,
  HardDrive
} from 'lucide-react';

function ApiClient({ backendUrl }) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('http://localhost:5000/api/user');
  const [activeTab, setActiveTab] = useState('body'); // body or headers
  
  // Headers list state
  const [headers, setHeaders] = useState([
    { id: '1', key: 'Content-Type', value: 'application/json', active: true }
  ]);
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  // Request Body
  const [requestBody, setRequestBody] = useState('{\n  "name": "Jane Doe"\n}');

  // Response state
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);

  const handleAddHeader = (e) => {
    e.preventDefault();
    if (!newHeaderKey.trim()) return;
    setHeaders([
      ...headers,
      { id: String(Date.now()), key: newHeaderKey.trim(), value: newHeaderValue.trim(), active: true }
    ]);
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  const handleRemoveHeader = (id) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  const handleToggleHeader = (id) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, active: !h.active } : h));
  };

  const executeRequest = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResponse(null);

    const startTime = performance.now();

    // Construct headers object
    const reqHeaders = {};
    headers.forEach(h => {
      if (h.active && h.key && h.value) {
        reqHeaders[h.key] = h.value;
      }
    });

    const fetchOptions = {
      method,
      headers: reqHeaders
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      fetchOptions.body = requestBody;
    }

    try {
      const res = await fetch(url, fetchOptions);
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      const contentType = res.headers.get('content-type') || '';
      let formattedBody = '';
      let isJson = false;

      if (contentType.includes('application/json')) {
        const json = await res.json();
        formattedBody = JSON.stringify(json, null, 2);
        isJson = true;
      } else {
        formattedBody = await res.text();
      }

      // Read response headers
      const resHeaders = [];
      res.headers.forEach((val, key) => {
        resHeaders.push({ key, value: val });
      });

      const responseSize = new Blob([formattedBody]).size;

      const successResponse = {
        status: res.status,
        statusText: res.statusText || 'OK',
        headers: resHeaders,
        body: formattedBody,
        isJson,
        time: durationMs,
        size: responseSize,
        error: false
      };

      setResponse(successResponse);

      // Add to local sandbox history
      const historyItem = {
        id: String(Date.now()),
        method,
        url,
        status: res.status,
        time: durationMs
      };
      setRequestHistory([historyItem, ...requestHistory.slice(0, 19)]);

    } catch (err) {
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      const errorResponse = {
        status: 0,
        statusText: 'Failed Connection',
        headers: [],
        body: `Connection Error:\n${err.message}\n\nMake sure the target server is running and supports CORS.`,
        isJson: false,
        time: durationMs,
        size: 0,
        error: true
      };

      setResponse(errorResponse);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    setMethod(item.method);
    setUrl(item.url);
  };

  const clearHistory = () => {
    setRequestHistory([]);
  };

  return (
    <div>
      <header className="view-header">
        <h1 className="view-title">Request Sandbox</h1>
        <p className="view-subtitle">Send test HTTP requests, view timing diagnostics, and analyze JSON responses.</p>
      </header>

      <div className="grid-2" style={{ gridTemplateColumns: '7fr 5fr' }}>
        {/* Request Panel */}
        <div className="glass-card">
          <h3 className="card-title"><Send size={18} /> Request Composer</h3>
          <form onSubmit={executeRequest}>
            {/* URL/Method bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <select 
                className="form-select" 
                value={method} 
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: '120px', fontWeight: 600, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input 
                type="url" 
                className="form-input" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="http://localhost:5000/api/user"
                required
                style={{ flexGrow: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
              />
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0 1.5rem' }}>
                {loading ? 'Sending...' : <><Play size={16} /> Send</>}
              </button>
            </div>

            {/* Tab Swapper */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '1rem' }}>
              <button 
                type="button"
                className={`menu-item-btn ${activeTab === 'body' ? 'active' : ''}`}
                onClick={() => setActiveTab('body')}
                style={{ width: 'auto', padding: '0.5rem 1rem', borderLeft: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
              >
                Body
              </button>
              <button 
                type="button"
                className={`menu-item-btn ${activeTab === 'headers' ? 'active' : ''}`}
                onClick={() => setActiveTab('headers')}
                style={{ width: 'auto', padding: '0.5rem 1rem', borderLeft: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
              >
                Headers ({headers.length})
              </button>
            </div>

            {/* Body View */}
            {activeTab === 'body' && (
              <div className="input-group">
                <span className="input-label">JSON Request Body (POST/PUT)</span>
                <textarea 
                  className="form-textarea code-textarea" 
                  value={requestBody} 
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows="10"
                ></textarea>
              </div>
            )}

            {/* Headers View */}
            {activeTab === 'headers' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {headers.map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={h.active} 
                        onChange={() => handleToggleHeader(h.id)} 
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        readOnly 
                        value={h.key} 
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }} 
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        readOnly 
                        value={h.value} 
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }} 
                      />
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => handleRemoveHeader(h.id)}
                        style={{ padding: '0.4rem 0.6rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <span className="input-label">Key</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newHeaderKey} 
                      onChange={(e) => setNewHeaderKey(e.target.value)} 
                      placeholder="Authorization"
                      style={{ padding: '0.5rem 0.75rem' }}
                    />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <span className="input-label">Value</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newHeaderValue} 
                      onChange={(e) => setNewHeaderValue(e.target.value)} 
                      placeholder="Bearer token"
                      style={{ padding: '0.5rem 0.75rem' }}
                    />
                  </div>
                  <button type="button" className="btn-secondary" onClick={handleAddHeader} style={{ padding: '0.55rem 1rem' }}>
                    Add
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Sandbox History */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}><History size={18} /> Call History</h3>
            {requestHistory.length > 0 && (
              <button className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={clearHistory}>
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '360px' }}>
            {requestHistory.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No local sandbox requests sent yet.</span>
            ) : (
              requestHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="glass-card interactive" 
                  onClick={() => loadFromHistory(item)}
                  style={{ padding: '0.75rem 1rem', margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span className={`badge ${item.method === 'GET' ? 'info' : 'success'}`} style={{ fontSize: '0.7rem' }}>
                    {item.method}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                    {item.url}
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} className={item.status >= 200 && item.status < 300 ? 'color-success' : 'color-error'}>
                    {item.status || 'ERR'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Response Panel */}
      <div className="glass-card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Response</h3>
          {response && (
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                Status: 
                <span className={`badge ${response.error ? 'danger' : response.status >= 200 && response.status < 300 ? 'success' : 'warning'}`}>
                  {response.status} {response.statusText}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                <Clock size={14} /> {response.time} ms
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                <HardDrive size={14} /> {(response.size / 1024).toFixed(2)} KB
              </div>
            </div>
          )}
        </div>

        {response ? (
          <pre 
            className="console-container" 
            style={{ 
              height: '350px', 
              fontSize: '0.85rem', 
              color: response.error ? 'var(--color-error)' : 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto'
            }}
          >
            {response.body}
          </pre>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>
            No response payload. Set up a request parameters and execute click "Send".
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiClient;
