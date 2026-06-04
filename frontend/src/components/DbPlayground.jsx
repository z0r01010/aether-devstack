import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  Terminal, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

function DbPlayground({ backendUrl }) {
  const [sql, setSql] = useState('SELECT * FROM projects;');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Quick Preset Queries
  const presets = [
    { label: 'Show Projects', query: 'SELECT * FROM projects;' },
    { label: 'View Database Schema', query: "SELECT name, type, sql FROM sqlite_master WHERE type='table';" },
    { label: 'Add Sample Project', query: "INSERT INTO projects (name, port, status) VALUES ('Aether DevStack App', 4000, 'active');" }
  ];

  const handleExecuteQuery = async (queryText = sql) => {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch(`${backendUrl}/api/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: queryText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to execute query.');
      }
    } catch (err) {
      setError(`Database connection failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (queryText) => {
    setSql(queryText);
    handleExecuteQuery(queryText);
  };

  // Helper to extract table headers from database results rows
  const getTableHeaders = () => {
    if (!result || !result.rows || result.rows.length === 0) return [];
    return Object.keys(result.rows[0]);
  };

  return (
    <div>
      <header className="view-header">
        <h1 className="view-title">SQL Explorer & Playground</h1>
        <p className="view-subtitle">Interact with local SQLite databases, create tables, query records, and verify schema integrity.</p>
      </header>

      {/* Connection Info */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Database size={24} className="color-success" style={{ color: 'var(--color-success)' }} />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Active Database Connection</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Connected to <code>sqlite3://devstack.db</code>
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '7fr 5fr' }}>
        {/* SQL Input Area */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}><Terminal size={18} /> SQL Query Input</h3>
            <button 
              className="btn-primary" 
              onClick={() => handleExecuteQuery()} 
              disabled={loading}
              style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem' }}
            >
              {loading ? 'Running...' : <><Play size={14} /> Run Query</>}
            </button>
          </div>

          <div className="input-group">
            <textarea 
              className="form-textarea code-textarea" 
              value={sql} 
              onChange={(e) => setSql(e.target.value)} 
              rows="8"
              placeholder="SELECT * FROM projects;"
              style={{ fontSize: '0.9rem' }}
            ></textarea>
          </div>
        </div>

        {/* Quick Reference / Presets */}
        <div className="glass-card">
          <h3 className="card-title"><BookOpen size={18} /> Quick Reference</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Select a query blueprint to run instantly:
            </span>
            {presets.map((preset, idx) => (
              <button 
                key={idx}
                className="btn-secondary"
                onClick={() => handlePresetClick(preset.query)}
                style={{ textAlign: 'left', justifyContent: 'start', fontSize: '0.85rem', width: '100%', fontFamily: 'var(--font-mono)' }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>
            <HelpCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              You can perform standard DDL/DML statements like <code>CREATE TABLE</code>, <code>INSERT</code>, or <code>DROP</code>. Changes persist inside <code>devstack.db</code>.
            </div>
          </div>
        </div>
      </div>

      {/* Query Results / Output Panel */}
      <div className="glass-card" style={{ marginTop: '1rem' }}>
        <h3 className="card-title">Query Console Output</h3>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
            Executing query on SQLite database...
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'start', 
            gap: '0.75rem', 
            padding: '1.25rem', 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '12px',
            color: 'var(--color-error)'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>SQL Syntax Error</strong>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{error}</pre>
            </div>
          </div>
        )}

        {/* Success Modifying Query Status (INSERT, CREATE, etc) */}
        {result && result.message && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'start', 
            gap: '0.75rem', 
            padding: '1.25rem', 
            background: 'rgba(16, 185, 129, 0.12)', 
            border: '1px solid rgba(16, 185, 129, 0.3)', 
            borderRadius: '12px',
            color: 'var(--color-success)'
          }}>
            <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Success</strong>
              <span style={{ fontSize: '0.9rem' }}>{result.message}</span>
              {result.lastID !== undefined && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  Inserted row ID: {result.lastID}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Data Query Table (SELECT) */}
        {result && result.rows && (
          <div>
            {result.rows.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Query executed successfully. Result set is empty (0 rows).
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Returned {result.count} rows in query set
                </div>
                <div className="sql-table-wrapper">
                  <table className="sql-table">
                    <thead>
                      <tr>
                        {getTableHeaders().map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {getTableHeaders().map((colHeader) => (
                            <td key={colHeader}>
                              {row[colHeader] === null ? (
                                <em style={{ color: 'var(--text-muted)' }}>NULL</em>
                              ) : (
                                String(row[colHeader])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no queries have run */}
        {!loading && !result && !error && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>
            No query results to display. Type an SQL expression and click "Run Query".
          </div>
        )}
      </div>
    </div>
  );
}

export default DbPlayground;
