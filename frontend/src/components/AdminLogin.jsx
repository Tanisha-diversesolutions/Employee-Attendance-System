import React, { useState } from "react";
import { Lock, ShieldAlert, ArrowLeft, KeyRound, Check } from "lucide-react";

export function AdminLogin({ onSuccess, onBack, onToast }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const ADMIN_PASSWORD = "admin123";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setError("");
      if (onToast) onToast("Authenticated as HR Administrator", "success");
      onSuccess();
    } else {
      setError("Incorrect password. Demo access is 'admin123'.");
      if (onToast) onToast("Invalid credentials", "error");
    }
  };

  return (
    <div className="login-modal-wrapper">
      <div className="card admin-login-card">
        <div className="login-icon-header">
          <div className="shield-circle">
            <Lock size={28} className="shield-icon" />
          </div>
        </div>

        <div className="login-header-text">
          <h2>HR Administrator Portal</h2>
          <p>Restricted area for company attendance records & policy management.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="input-label">Master Admin Password</label>
            <div className="password-input-wrapper">
              <KeyRound size={16} className="key-icon" />
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="styled-input with-icon"
                autoFocus
              />
            </div>
            <div className="password-hint">
              <span>Demo Password: <code>admin123</code></span>
              <button
                type="button"
                className="btn-quick-fill"
                onClick={() => setPassword("admin123")}
              >
                Auto-fill
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-box alert-error">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-btn-row">
            <button type="button" onClick={onBack} className="btn-secondary">
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Authenticate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
