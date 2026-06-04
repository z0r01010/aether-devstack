import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// System Logs Storage (in-memory)
const systemLogs = [];
const logToDashboard = (message, type = 'info') => {
  const logEntry = {
    timestamp: new Date().toLocaleTimeString(),
    message,
    type // info, success, warning, error
  };
  systemLogs.push(logEntry);
  if (systemLogs.length > 100) systemLogs.shift();
  console.log(`[${logEntry.type.toUpperCase()}] ${message}`);
};

logToDashboard('Aether DevStack Backend initialized.', 'success');

// Dynamic Mock Server State
let mockServerInstance = null;
let mockEndpoints = [
  { id: '1', method: 'GET', path: '/api/user', status: 200, delay: 0, response: JSON.stringify({ id: 1, name: "John Doe", role: "Developer" }, null, 2) },
  { id: '2', method: 'POST', path: '/api/login', status: 200, delay: 500, response: JSON.stringify({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", success: true }, null, 2) }
];
let mockServerPort = 5000;
let mockServerActive = false;
let mockRequestHistory = [];

// SQLite Database Setup
const dbPath = path.resolve('./devstack.db');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logToDashboard(`Failed to connect to SQLite database: ${err.message}`, 'error');
  } else {
    logToDashboard(`Connected to SQLite database at ${dbPath}`, 'success');
    // Create a default table for demo if empty
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      port INTEGER,
      status TEXT
    )`, (err) => {
      if (!err) {
        db.get("SELECT COUNT(*) as count FROM projects", [], (err, row) => {
          if (!err && row.count === 0) {
            db.run("INSERT INTO projects (name, port, status) VALUES ('E-Commerce Webapp', 3000, 'active')");
            db.run("INSERT INTO projects (name, port, status) VALUES ('AI Analytics Tool', 8000, 'stopped')");
            db.run("INSERT INTO projects (name, port, status) VALUES ('Marketing Site', 8080, 'active')");
            logToDashboard('Initialized default SQLite table and seed data.', 'info');
          }
        });
      }
    });
  }
});

// 1. SYSTEM STATS ENDPOINT
app.get('/api/stats', (req, res) => {
  // Real total/free memory using OS module
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsagePercent = Math.round((usedMem / totalMem) * 100);

  // Generate standard simulated CPU load that fluctuates
  const baseCpu = 20 + Math.sin(Date.now() / 10000) * 15;
  const cpuLoad = Math.max(5, Math.min(95, Math.round(baseCpu + Math.random() * 10)));

  res.json({
    cpu: cpuLoad,
    memory: memoryUsagePercent,
    freeMemoryGB: (freeMem / (1024 * 1024 * 1024)).toFixed(2),
    totalMemoryGB: (totalMem / (1024 * 1024 * 1024)).toFixed(2),
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    platform: os.platform(),
    uptime: Math.round(os.uptime()),
    cpuModel: os.cpus()[0]?.model || 'Generic Processor',
    activeServices: {
      controlCenter: 'running',
      mockServer: mockServerActive ? 'running' : 'stopped',
      database: 'connected'
    }
  });
});

// 2. SYSTEM LOGS ENDPOINT
app.get('/api/logs', (req, res) => {
  res.json(systemLogs);
});

// 3. DYNAMIC MOCK SERVER ENDPOINTS
app.get('/api/mock-server/config', (req, res) => {
  res.json({
    active: mockServerActive,
    port: mockServerPort,
    endpoints: mockEndpoints,
    history: mockRequestHistory
  });
});

app.post('/api/mock-server/endpoints', (req, res) => {
  const { endpoints } = req.body;
  if (!Array.isArray(endpoints)) {
    return res.status(400).json({ error: 'Endpoints must be an array' });
  }
  mockEndpoints = endpoints;
  logToDashboard('Mock server endpoints updated.', 'info');
  res.json({ success: true, endpoints: mockEndpoints });
});

// Start Dynamic Mock Server
app.post('/api/mock-server/start', (req, res) => {
  const { port } = req.body;
  if (port) mockServerPort = Number(port);

  if (mockServerActive) {
    return res.status(400).json({ error: 'Mock server is already running' });
  }

  const mockApp = express();
  mockApp.use(cors());
  mockApp.use(express.json());

  // Dynamic request handler
  mockApp.all('*', (req, res) => {
    const matched = mockEndpoints.find(
      e => e.method === req.method && e.path.toLowerCase() === req.url.toLowerCase()
    );

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      method: req.method,
      url: req.url,
      status: matched ? matched.status : 404,
      matched: !!matched
    };

    mockRequestHistory.push(logEntry);
    if (mockRequestHistory.length > 50) mockRequestHistory.shift();

    if (!matched) {
      logToDashboard(`Mock server: 404 Not Found on ${req.method} ${req.url}`, 'warning');
      return res.status(404).json({ error: 'Route not mocked' });
    }

    logToDashboard(`Mock server request: ${req.method} ${req.url} -> Response ${matched.status}`, 'success');

    // Simulate network delay
    setTimeout(() => {
      try {
        const parsed = JSON.parse(matched.response);
        res.status(matched.status).json(parsed);
      } catch (err) {
        res.status(matched.status).send(matched.response);
      }
    }, matched.delay || 0);
  });

  try {
    mockServerInstance = mockApp.listen(mockServerPort, () => {
      mockServerActive = true;
      logToDashboard(`Dynamic Mock Server started on port ${mockServerPort}`, 'success');
      res.json({ success: true, port: mockServerPort });
    });

    mockServerInstance.on('error', (err) => {
      mockServerActive = false;
      mockServerInstance = null;
      logToDashboard(`Mock Server port error: ${err.message}`, 'error');
    });
  } catch (err) {
    logToDashboard(`Failed to start Mock Server: ${err.message}`, 'error');
    res.status(500).json({ error: err.message });
  }
});

// Stop Dynamic Mock Server
app.post('/api/mock-server/stop', (req, res) => {
  if (!mockServerActive || !mockServerInstance) {
    return res.status(400).json({ error: 'Mock server is not running' });
  }

  mockServerInstance.close(() => {
    mockServerActive = false;
    mockServerInstance = null;
    logToDashboard('Dynamic Mock Server stopped.', 'warning');
    res.json({ success: true });
  });
});

// Clear Mock Server History
app.post('/api/mock-server/history/clear', (req, res) => {
  mockRequestHistory = [];
  res.json({ success: true });
});

// 4. PORT MANAGER (WINDOWS COMPATIBLE)
app.post('/api/ports/scan', (req, res) => {
  const { ports } = req.body; // array of ports to scan, e.g. [3000, 5000, 8000, 8080]
  if (!Array.isArray(ports)) {
    return res.status(400).json({ error: 'Ports must be an array' });
  }

  // Windows command to find PID on port: netstat -ano | findstr LISTENING | findstr :PORT
  const results = [];
  let completed = 0;

  if (ports.length === 0) return res.json([]);

  ports.forEach(port => {
    const cmd = `netstat -ano | findstr LISTENING | findstr :${port}`;
    exec(cmd, (error, stdout, stderr) => {
      let active = false;
      let pid = null;

      if (!error && stdout) {
        // netstat output format: TCP  0.0.0.0:8080  0.0.0.0:0  LISTENING  12345
        const lines = stdout.trim().split('\n');
        const parts = lines[0].trim().split(/\s+/);
        pid = parts[parts.length - 1];
        active = true;
      }

      results.push({ port, active, pid });
      completed++;

      if (completed === ports.length) {
        // Sort results to match input port order
        results.sort((a, b) => ports.indexOf(a.port) - ports.indexOf(b.port));
        res.json(results);
      }
    });
  });
});

// KILL PORT PROCESS (WINDOWS COMPATIBLE)
app.post('/api/ports/kill', (req, res) => {
  const { pid, port } = req.body;
  if (!pid) {
    return res.status(400).json({ error: 'PID is required' });
  }

  const cmd = `taskkill /F /PID ${pid}`;
  logToDashboard(`Attempting to terminate PID ${pid} occupying port ${port || 'unknown'}`, 'info');

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logToDashboard(`Failed to kill process PID ${pid}: ${stderr.trim()}`, 'error');
      return res.status(500).json({ error: `Failed to terminate process: ${stderr}` });
    }
    logToDashboard(`Successfully terminated PID ${pid} (Port ${port || 'unknown'})`, 'success');
    res.json({ success: true, message: stdout.trim() });
  });
});

// 5. ENV EDITOR ENDPOINTS
app.post('/api/env/read', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    logToDashboard(`Environment file not found at ${absolutePath}`, 'warning');
    return res.status(404).json({ error: 'File not found. Specify a valid local .env path.' });
  }

  try {
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    const lines = fileContent.split('\n');
    const envVars = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Skip empty or comment lines
      if (!trimmed || trimmed.startsWith('#')) return;

      const delimiterIdx = trimmed.indexOf('=');
      if (delimiterIdx > 0) {
        const key = trimmed.substring(0, delimiterIdx).trim();
        const value = trimmed.substring(delimiterIdx + 1).trim();
        envVars.push({ id: String(idx), key, value });
      }
    });

    logToDashboard(`Loaded ${envVars.length} variables from env file at ${absolutePath}`, 'success');
    res.json({ success: true, path: absolutePath, variables: envVars });
  } catch (err) {
    logToDashboard(`Failed reading env file: ${err.message}`, 'error');
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/env/write', (req, res) => {
  const { filePath, variables } = req.body;
  if (!filePath || !Array.isArray(variables)) {
    return res.status(400).json({ error: 'FilePath and variables array are required' });
  }

  const absolutePath = path.resolve(filePath);
  try {
    // Generate .env file contents
    const content = variables
      .map(v => `${v.key.trim()}=${v.value.trim()}`)
      .join('\n') + '\n';

    fs.writeFileSync(absolutePath, content, 'utf8');
    logToDashboard(`Successfully saved changes to env file at ${absolutePath}`, 'success');
    res.json({ success: true });
  } catch (err) {
    logToDashboard(`Failed writing env file: ${err.message}`, 'error');
    res.status(500).json({ error: err.message });
  }
});

// 6. SQLITE PLAYGROUND ENDPOINT
app.post('/api/database/query', (req, res) => {
  const { sql } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'SQL query string is required' });
  }

  logToDashboard(`Executing SQL Query: ${sql}`, 'info');

  const queryType = sql.trim().split(/\s+/)[0].toUpperCase();

  if (['SELECT', 'PRAGMA'].includes(queryType)) {
    // Read queries
    db.all(sql, [], (err, rows) => {
      if (err) {
        logToDashboard(`SQL Error: ${err.message}`, 'error');
        return res.status(400).json({ error: err.message });
      }
      res.json({ success: true, rows, count: rows.length });
    });
  } else {
    // Modifying queries (INSERT, UPDATE, DELETE, CREATE, DROP)
    db.run(sql, [], function (err) {
      if (err) {
        logToDashboard(`SQL Error: ${err.message}`, 'error');
        return res.status(400).json({ error: err.message });
      }
      res.json({
        success: true,
        changes: this.changes,
        lastID: this.lastID,
        message: `Query executed successfully. Changes: ${this.changes}`
      });
    });
  }
});

// Catch-all static endpoint for frontend build (if client is served by Express)
// Serve Vite dist assets if available
const frontendDist = path.resolve('../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  logToDashboard(`Control Center Backend running on http://localhost:${PORT}`, 'success');
});
