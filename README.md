# Aether DevStack 🌌

Aether DevStack is a premium, visually stunning, and highly interactive **Local Development Environment Manager & Dashboard** (similar to a modernized XAMPP). Designed with a modern, glassmorphic dark-theme UI, it empowers developers to control their local environment directly from a unified control panel.

This project is built from scratch using a **React + Vite** frontend and a **Node.js + Express + SQLite** backend. It is an exceptional, unique full-stack addition to any software engineering resume.

---

## 🚀 Key Features

* **⚡ Real-time System Dashboard**: Monitor CPU load, Memory allocation, and control center status using responsive gauges. View system characteristics and real-time execution logs from a terminal console stream.
* **🔧 Dynamic API Mocker**: Spin up dynamic local REST servers on any port. Define custom methods (`GET`, `POST`, etc.), endpoints, delays, status codes, and mock JSON responses with instant validation.
* **🌐 Port Manager & Killer**: Scan running local server ports (e.g. 3000, 8080, 9000). Identify active Process IDs (PIDs) occupying ports, and force-kill port-blocking processes with a single click.
* **📨 Request Sandbox**: A built-in HTTP request client (Postman alternative) to build, configure, and send API calls, inspect response times, statuses, sizing details, and formatted JSON output.
* **📝 Visual Environment (.env) Editor**: Load local project `.env` configurations, securely manage key-value pairs with masking toggle inputs, delete/append keys, and save updates back to disk.
* **💾 Database SQL Explorer**: An interactive client panel (phpMyAdmin replacement) pointing to SQLite. Run custom queries, create tables, query datasets, and inspect visual table grids.

---

## 🛠️ Tech Stack

* **Frontend**: React.js, Vite, Lucide React (Icons), Vanilla CSS (Custom Glassmorphism, animations, responsive grids).
* **Backend**: Node.js, Express, SQLite (`sqlite3` module for database connection), child_process (for Windows system queries).
* **Storage**: SQLite file database (`backend/devstack.db`).

---

## 📦 Getting Started & Installation

Follow these steps to run the application on your computer:

### Step 1: Open the directory in your Terminal / Workspace
Locate the project folder:
```bash
cd C:\Users\Swastik\.gemini\antigravity\scratch\aether-devstack
```

### Step 2: Install Backend Dependencies
Open a terminal in the `backend` folder, and install the modules:
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
Open a separate terminal window in the `frontend` folder, and install:
```bash
cd ../frontend
npm install
```

### Step 4: Run the Application
1. **Start the backend server** (runs on `http://localhost:4000`):
   ```bash
   cd backend
   npm start
   ```
2. **Start the frontend Vite server** (runs on `http://localhost:3000`):
   ```bash
   cd frontend
   npm run dev
   ```
3. Open your browser and navigate to **`http://localhost:3000`** to interact with the dashboard!

---

## 🐙 Adding this to your Resume & GitHub

This project is custom-built and unique. To showcase it on your GitHub:

1. **Initialize a Git repository** in the project root:
   ```bash
   cd C:\Users\Swastik\.gemini\antigravity\scratch\aether-devstack
   git init
   ```
2. **Create a `.gitignore` file** to exclude node modules and logs:
   Create a file named `.gitignore` in the root folder containing:
   ```text
   node_modules/
   dist/
   .env
   *.db
   *.log
   ```
3. **Commit your code**:
   ```bash
   git add .
   git commit -m "feat: Initial commit of Aether DevStack local management suite"
   ```
4. **Create a new repository on GitHub** (e.g., `aether-devstack`).
5. **Link and push**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/aether-devstack.git
   git branch -M main
   git push -u origin main
   ```
