import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  FolderOpen, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Save,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

function EnvManager({ backendUrl }) {
  // We point to a default dummy env in our own directory to make it instantly testable!
  const [filePath, setFilePath] = useState('./.env');
  const [variables, setVariables] = useState([]);
  const [loadedPath, setLoadedPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Visibility states for individual keys (by index or key name)
  const [visibleKeys, setVisibleKeys] = useState({});

  // New variable row input
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const loadEnvFile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setVariables([]);
    setLoadedPath('');

    try {
      const res = await fetch(`${backendUrl}/api/env/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVariables(data.variables);
        setLoadedPath(data.path);
      } else {
        alert(data.error || 'Failed to read env file.');
      }
    } catch (err) {
      alert(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEnvFile = async () => {
    if (!loadedPath) return;
    setSaving(true);

    try {
      const res = await fetch(`${backendUrl}/api/env/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: loadedPath, variables })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Environment file saved successfully!');
      } else {
        alert(data.error || 'Failed to save environment file.');
      }
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateValue = (id, val) => {
    setVariables(variables.map(v => v.id === id ? { ...v, value: val } : v));
  };

  const handleAddVariable = (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    // Check duplicates
    if (variables.some(v => v.key === newKey.trim().toUpperCase())) {
      alert('Key already exists. Modify the existing value instead.');
      return;
    }

    const newVar = {
      id: String(Date.now()),
      key: newKey.trim().toUpperCase(),
      value: newValue.trim()
    };

    setVariables([...variables, newVar]);
    setNewKey('');
    setNewValue('');
  };

  const handleDeleteVariable = (id) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const toggleVisibility = (id) => {
    setVisibleKeys({
      ...visibleKeys,
      [id]: !visibleKeys[id]
    });
  };

  return (
    <div>
      <header className="view-header">
        <h1 className="view-title">Environment Editor</h1>
        <p className="view-subtitle">Safely load, mask, and synchronize local project configuration (.env) keys.</p>
      </header>

      {/* File Path Loader */}
      <div className="glass-card">
        <h3 className="card-title"><FolderOpen size={18} /> Load Configuration</h3>
        <form onSubmit={loadEnvFile} style={{ display: 'flex', gap: '0.75rem', alignItems: 'end' }}>
          <div className="input-group" style={{ margin: 0, flexGrow: 1 }}>
            <span className="input-label">Absolute/Relative Path to .env File</span>
            <input 
              type="text" 
              className="form-input" 
              value={filePath} 
              onChange={(e) => setFilePath(e.target.value)} 
              placeholder="./.env"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem' }}>
            {loading ? 'Loading...' : 'Load File'}
          </button>
        </form>
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <HelpCircle size={14} /> Tip: We created a sample environment file at <code>./.env</code> (relative to the backend directory).
        </div>
      </div>

      {loadedPath && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}><FileCode size={20} /> Loaded Configuration Variables</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {loadedPath}
              </span>
            </div>
            <button 
              className="btn-primary" 
              onClick={handleSaveEnvFile} 
              disabled={saving || variables.length === 0}
              style={{ background: 'linear-gradient(135deg, var(--color-success), #059669)' }}
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save File Changes'}
            </button>
          </div>

          {/* Variables Table Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {variables.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                No variables present. Add a variable using the fields below.
              </div>
            ) : (
              variables.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.02)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  {/* Variable Key */}
                  <div style={{ flex: '1', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent)' }}>
                    {item.key}
                  </div>

                  {/* Variable Value (with toggled masking) */}
                  <div style={{ flex: '2', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type={visibleKeys[item.id] ? 'text' : 'password'} 
                      className="form-input" 
                      value={item.value} 
                      onChange={(e) => handleUpdateValue(item.id, e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }} 
                    />
                    <button 
                      className="btn-secondary" 
                      onClick={() => toggleVisibility(item.id)}
                      style={{ padding: '0.4rem 0.6rem' }}
                    >
                      {visibleKeys[item.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Delete Variable */}
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleDeleteVariable(item.id)}
                    style={{ padding: '0.4rem 0.6rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Key Section */}
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Add Variable Row
            </h4>
            <form onSubmit={handleAddVariable} style={{ display: 'flex', gap: '0.75rem', alignItems: 'end' }}>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <span className="input-label">Key Name</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newKey} 
                  onChange={(e) => setNewKey(e.target.value)} 
                  placeholder="API_KEY_SECRET"
                  style={{ textTransform: 'uppercase' }}
                  required
                />
              </div>
              <div className="input-group" style={{ margin: 0, flex: 2 }}>
                <span className="input-label">Value</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newValue} 
                  onChange={(e) => setNewValue(e.target.value)} 
                  placeholder="production_super_secret_value"
                />
              </div>
              <button type="submit" className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                <Plus size={16} /> Add Key
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnvManager;
