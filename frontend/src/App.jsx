import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://attendance-backend.onrender.com";

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="live-clock">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </div>
  );
}

function CheckInPanel({ onNewRecord }) {
  const [employeeId, setEmployeeId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setError("");
    if (!employeeId) {
      setError("Enter an employee ID to punch in.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/attendance/checkin/${employeeId}`);
      setResult(res.data);
      onNewRecord(res.data);
    } catch (err) {
      setError("Punch failed — check the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card punch-card">
      <div className="eyebrow">Punch In</div>
      <LiveClock />

      <div className="field-row">
        <input
          type="number"
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
        />
        <button onClick={handleCheckIn} disabled={loading}>
          {loading ? "Stamping…" : "Punch In"}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {result && (
        <div className={`stamp ${result.status}`}>
          <div className="stamp-status">
            {result.status === "late" ? "LATE" : "ON TIME"}
          </div>
          <div className="stamp-detail">
            {result.status === "late"
              ? `${result.late_by_minutes} min past 9:30`
              : "Right on schedule"}
          </div>
          <div className="stamp-time">
            {new Date(result.check_in).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

function Ledger({ records }) {
  return (
    <div className="card ledger-card">
      <div className="eyebrow">Today's Ledger</div>
      {records.length === 0 ? (
        <p className="empty-state">No punches logged yet — the ledger fills in as people check in.</p>
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Status</th>
              <th>Late by</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className={r.status === "late" ? "row-late" : ""}>
                <td>{r.employee_id}</td>
                <td>{new Date(r.check_in).toLocaleTimeString()}</td>
                <td>
                  <span className={`badge ${r.status}`}>{r.status}</span>
                </td>
                <td>{r.status === "late" ? `${r.late_by_minutes}m` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DemoControls({ onReset }) {
  const [message, setMessage] = useState("");

  const resetDemo = async () => {
    const res = await axios.post(`${API_URL}/demo/reset`);
    setMessage(res.data.message);
    onReset();
  };

  const simulateLate = async () => {
    const res = await axios.post(`${API_URL}/demo/simulate-late`);
    setMessage(res.data.message);
  };

  return (
    <div className="demo-bar">
      <button className="demo-btn" onClick={resetDemo}>Reset Demo</button>
      <button className="demo-btn secondary" onClick={simulateLate}>
        Simulate Late Arrival
      </button>
      {message && <span className="demo-message">{message}</span>}
    </div>
  );
}

const ADMIN_PASSWORD = "admin123"; // demo-only — see README note on real auth

function RoleSelect({ onSelect }) {
  return (
    <div className="card role-card">
      <div className="eyebrow">Who's checking in?</div>
      <p className="role-intro">Choose how you'd like to continue.</p>
      <div className="role-buttons">
        <button className="role-btn" onClick={() => onSelect("employee")}>
          I'm an Employee
        </button>
        <button className="role-btn secondary" onClick={() => onSelect("admin")}>
          I'm an Admin
        </button>
      </div>
    </div>
  );
}

function AdminLogin({ onSuccess, onBack }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const tryLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError("Wrong password.");
    }
  };

  return (
    <div className="card role-card">
      <div className="eyebrow">Admin Login</div>
      <div className="field-row">
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryLogin()}
        />
        <button onClick={tryLogin}>Enter</button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="link-btn" onClick={onBack}>← Back</button>
    </div>
  );
}

function App() {
  const [role, setRole] = useState(null);   // null | "employee" | "admin" | "admin-locked"
  const [records, setRecords] = useState([]);

  const fetchLate = async () => {
    try {
      const res = await axios.get(`${API_URL}/attendance/late-today`);
      setRecords((prev) => {
        const ids = new Set(prev.map((p) => `${p.employee_id}-${p.check_in}`));
        const merged = [...prev];
        res.data.forEach((r) => {
          const key = `${r.employee_id}-${r.check_in}`;
          if (!ids.has(key)) merged.push(r);
        });
        return merged;
      });
    } catch {
      /* backend may not have data yet — silent */
    }
  };

  useEffect(() => {
    if (role === "admin") fetchLate();
  }, [role]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-mark">09:30</div>
        <div>
          <h1>Attendance Desk</h1>
          <p>Reporting time is 9:30 AM — every punch is checked against it.</p>
        </div>
      </header>

      {/* Nobody has chosen a role yet */}
      {role === null && <RoleSelect onSelect={(r) => setRole(r === "admin" ? "admin-locked" : "employee")} />}

      {/* Admin picked, but not authenticated yet */}
      {role === "admin-locked" && (
        <AdminLogin onSuccess={() => setRole("admin")} onBack={() => setRole(null)} />
      )}

      {/* EMPLOYEE VIEW — only their own punch result, nothing else */}
      {role === "employee" && (
        <>
          <button className="link-btn" onClick={() => setRole(null)}>← Switch role</button>
          <main className="grid single-col">
            <CheckInPanel onNewRecord={() => {}} />
          </main>
        </>
      )}

      {/* ADMIN VIEW — full ledger + demo controls */}
      {role === "admin" && (
        <>
          <button className="link-btn" onClick={() => setRole(null)}>← Switch role</button>
          <DemoControls onReset={() => setRecords([])} />
          <main className="grid">
            <CheckInPanel onNewRecord={(rec) => setRecords((prev) => [rec, ...prev])} />
            <Ledger records={records} />
          </main>
        </>
      )}
    </div>
  );
}

export default App;