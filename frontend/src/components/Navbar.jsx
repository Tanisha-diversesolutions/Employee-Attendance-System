import React, { useState, useEffect } from "react";
import { Clock, Shield, User, ArrowLeftRight, Building2, Calendar } from "lucide-react";

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="live-clock-badge">
      <div className="clock-icon-wrapper">
        <Clock className="clock-icon" size={16} />
      </div>
      <div className="clock-text">
        <span className="clock-time">{formattedTime}</span>
        <span className="clock-date">{formattedDate}</span>
      </div>
    </div>
  );
}

export function Navbar({ role, onSwitchRole, shiftTime = "09:30 AM" }) {
  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <div className="brand-badge">
          <Building2 size={22} className="brand-icon" />
        </div>
        <div className="brand-info">
          <div className="brand-title-row">
            <h1 className="brand-title">Apex Attendance</h1>
            <span className="brand-version">v2.4 Enterprise</span>
          </div>
          <p className="brand-subtitle">Automated Shift & Work Management Desk</p>
        </div>
      </div>

      <div className="navbar-center">
        <div className="policy-pill">
          <span className="policy-dot"></span>
          <span className="policy-label">Company Shift:</span>
          <strong className="policy-value">{shiftTime}</strong>
          <span className="policy-tag">Strict Cutoff</span>
        </div>
        <LiveClock />
      </div>

      <div className="navbar-right">
        {role && (
          <div className="user-role-badge">
            {role === "admin" ? (
              <>
                <div className="role-avatar admin">
                  <Shield size={16} />
                </div>
                <div className="role-meta">
                  <span className="role-name">Administrator</span>
                  <span className="role-access">HR Management Console</span>
                </div>
              </>
            ) : (
              <>
                <div className="role-avatar employee">
                  <User size={16} />
                </div>
                <div className="role-meta">
                  <span className="role-name">Employee Portal</span>
                  <span className="role-access">Self-Service Desk</span>
                </div>
              </>
            )}
            <button
              onClick={onSwitchRole}
              className="btn-switch-role"
              title="Switch Workspace / Role"
            >
              <ArrowLeftRight size={14} />
              <span>Switch</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
