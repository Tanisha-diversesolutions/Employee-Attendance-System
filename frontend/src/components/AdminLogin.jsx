import React, { useState } from "react";
import { Lock, ShieldAlert, ArrowLeft, KeyRound, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";

export function AdminLogin({ onSuccess, onBack, onToast }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  // Read admin password from Vite environment or use a secure fallback
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Diverse@Admin2026";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter the administrator password.");
      return;
    }

    if (password === ADMIN_PASSWORD) {
      setError("");
      if (onToast) onToast("Authenticated successfully. Welcome, Administrator.", "success");
      onSuccess();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setError("Access denied: Incorrect administrator password.");
      if (onToast) onToast("Authentication failed: Invalid credentials", "error");
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
          <p>Restricted access for authorized management personnel only.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="input-label">Master Admin Password</label>
            <div className="password-input-wrapper">
              <KeyRound size={16} className="key-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="styled-input with-icon"
                autoFocus
                required
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

