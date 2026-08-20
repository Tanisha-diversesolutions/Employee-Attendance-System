import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { LogIn, CheckCircle2, AlertCircle, Sparkles, UserCheck, Timer, User } from "lucide-react";

export function CheckInPanel({ apiUrl, onNewRecord, onToast }) {
  const [identifier, setIdentifier] = useState("");
  const [employees, setEmployees] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/employees`);
      setEmployees(res.data || []);
    } catch {
      /* fallback if offline */
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCheckIn = async (customIdentifier) => {
    const inputVal = (customIdentifier !== undefined ? customIdentifier : identifier).toString().trim();
    setError("");
    setResult(null);

    if (!inputVal) {
      setError("Please enter your Employee ID or Full Name.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/attendance/checkin/${encodeURIComponent(inputVal)}`);
      const data = res.data;
      setResult(data);

      if (onNewRecord) onNewRecord(data);
      if (onToast) {
        const empLabel = data.employee_name || `Employee #${data.employee_id}`;
        onToast(
          data.status === "late"
            ? `Late check-in recorded for ${empLabel} (+${data.late_by_minutes}m)`
            : `Punch confirmed! ${empLabel} marked On Time.`,
          data.status === "late" ? "warning" : "success"
        );
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        "Punch recording failed. Ensure backend service is reachable.";
      setError(errMsg);
      if (onToast) onToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card punch-station-card">
      <div className="card-header-row">
        <div>
          <div className="card-eyebrow">
            <Timer size={14} className="eyebrow-icon" />
            Digital Time Card
          </div>
          <h2 className="card-heading">Employee Punch Station</h2>
        </div>
        <span className="live-pulse-badge">
          <span className="pulse-dot"></span> Active Terminal
        </span>
      </div>

      <p className="card-description">
        Record your shift attendance. Enter your <strong>Employee ID</strong> (e.g. <code>1</code>, <code>101</code>) or your <strong>Full Name</strong> (e.g. <code>Ananya Rout</code>).
      </p>

      {/* Dynamic Registered Employee Chips */}
      {employees.length > 0 && (
        <div className="quick-select-section">
          <label className="input-label">Quick Select Employee:</label>
          <div className="quick-chips-grid">
            {employees.slice(0, 8).map((emp) => {
              const isSelected =
                identifier === String(emp.id) ||
                identifier.toLowerCase() === emp.name.toLowerCase();
              return (
                <button
                  key={emp.id}
                  type="button"
                  className={`employee-chip ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setIdentifier(String(emp.id));
                    setError("");
                  }}
                >
                  <div className="chip-avatar">
                    {emp.name ? emp.name.charAt(0).toUpperCase() : "#"}
                  </div>
                  <div className="chip-text">
                    <span className="chip-name">{emp.name}</span>
                    <span className="chip-id">ID: #{emp.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee ID or Name Input & Punch Button */}
      <div className="punch-input-group">
        <div className="input-wrapper">
          <label className="input-label">Employee ID or Name</label>
          <input
            type="text"
            placeholder="Enter ID (e.g. 1) or Name (e.g. Rahul)"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
            className="styled-input"
          />
        </div>

        <button
          onClick={() => handleCheckIn()}
          disabled={loading}
          className="btn-punch-action"
        >
          {loading ? (
            <span className="spinner-loading">Stamping Timecard…</span>
          ) : (
            <>
              <LogIn size={18} />
              <span>Punch In Now</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Digital Stamp Result Card */}
      {result && (
        <div className={`digital-stamp-container ${result.status}`}>
          <div className="stamp-watermark">
            {result.status === "late" ? "LATE RECORDED" : "VERIFIED ON-TIME"}
          </div>
          <div className="stamp-header">
            <div className="stamp-badge">
              {result.status === "late" ? (
                <AlertCircle size={20} className="icon-late" />
              ) : (
                <CheckCircle2 size={20} className="icon-present" />
              )}
              <span className="stamp-status-text">
                {result.status === "late" ? "LATE ARRIVAL" : "ON-TIME CHECK-IN"}
              </span>
            </div>
            <span className="stamp-timestamp">
              {new Date(result.check_in).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>

          <div className="stamp-body-details">
            <div className="detail-item">
              <span className="detail-label">Employee</span>
              <strong className="detail-val">
                {result.employee_name || `#${result.employee_id}`} (ID: #{result.employee_id})
              </strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Reporting Policy</span>
              <strong className="detail-val">09:30 AM Cutoff</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Lateness Delay</span>
              <strong className={`detail-val ${result.status === "late" ? "val-late" : "val-ok"}`}>
                {result.status === "late" ? `+${result.late_by_minutes} Minutes` : "0 min (Compliant)"}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

