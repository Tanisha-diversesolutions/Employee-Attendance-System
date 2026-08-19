import React, { useState } from "react";
import axios from "axios";
import { LogIn, CheckCircle2, AlertCircle, Sparkles, UserCheck, Timer } from "lucide-react";

export function CheckInPanel({ apiUrl, onNewRecord, onToast }) {
  const [employeeId, setEmployeeId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demoEmployees = [
    { id: "1", name: "Ananya Rout", role: "Software Engineer" },
    { id: "2", name: "Rohit Sahoo", role: "Product Designer" },
  ];

  const handleCheckIn = async (customId) => {
    const idToPunch = customId || employeeId;
    setError("");
    if (!idToPunch) {
      setError("Please select or enter an Employee ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/attendance/checkin/${idToPunch}`);
      setResult(res.data);
      if (onNewRecord) onNewRecord(res.data);
      if (onToast) {
        onToast(
          res.data.status === "late"
            ? `Late check-in recorded for Employee #${idToPunch}`
            : `Punch confirmed! Employee #${idToPunch} marked On Time.`,
          res.data.status === "late" ? "warning" : "success"
        );
      }
    } catch (err) {
      const errMsg = "Punch recording failed. Ensure backend service is reachable.";
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
        Record your shift attendance. Your punch timestamp is automatically verified against official shift policy.
      </p>

      {/* Quick Select Employee Chips */}
      <div className="quick-select-section">
        <label className="input-label">Quick Select Employee:</label>
        <div className="quick-chips-grid">
          {demoEmployees.map((emp) => (
            <button
              key={emp.id}
              type="button"
              className={`employee-chip ${employeeId === emp.id ? "active" : ""}`}
              onClick={() => {
                setEmployeeId(emp.id);
                setError("");
              }}
            >
              <div className="chip-avatar">{emp.name.charAt(0)}</div>
              <div className="chip-text">
                <span className="chip-name">{emp.name}</span>
                <span className="chip-id">ID: #{emp.id} • {emp.role}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Employee ID Input & Punch Button */}
      <div className="punch-input-group">
        <div className="input-wrapper">
          <label className="input-label">Employee ID Number</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 1, 2, 101"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
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
              <span className="detail-label">Employee ID</span>
              <strong className="detail-val">#{result.employee_id}</strong>
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
