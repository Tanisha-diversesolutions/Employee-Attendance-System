import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { UserPlus, Users, Search, RefreshCw, CheckCircle2, AlertCircle, Mail, Hash, Sparkles } from "lucide-react";

export function EmployeeManager({ apiUrl, onToast, onEmployeeCreated }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [customId, setCustomId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchEmployees = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get(`${apiUrl}/employees`);
      setEmployees(res.data || []);
    } catch {
      /* silent */
    } finally {
      setIsRefreshing(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const parsedId = parseInt(customId, 10);

    if (!trimmedName) {
      setError("Please enter the employee's full name.");
      return;
    }
    if (!customId || isNaN(parsedId) || parsedId <= 0) {
      setError("Please enter a valid positive Employee ID.");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter the employee's email address.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        id: parsedId,
        email: trimmedEmail,
      };

      const res = await axios.post(`${apiUrl}/employees`, payload);
      const created = res.data;

      setSuccessMsg(`Employee #${created.id} (${created.name}) created successfully!`);
      setName("");
      setCustomId("");
      setEmail("");

      if (onToast) {
        onToast(`Employee #${created.id} (${created.name}) registered successfully!`, "success");
      }

      await fetchEmployees();
      if (onEmployeeCreated) {
        onEmployeeCreated(created);
      }

      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create employee. Check backend connection.";
      setError(msg);
      if (onToast) onToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      String(emp.id).includes(q) ||
      emp.name.toLowerCase().includes(q) ||
      (emp.email && emp.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="card employee-manager-card">
      <div className="card-header-row">
        <div>
          <div className="card-eyebrow">
            <UserPlus size={14} className="eyebrow-icon" />
            Staff Administration
          </div>
          <h2 className="card-heading">Employee Directory & Registration</h2>
        </div>
        <div className="table-actions-group">
          <button
            onClick={fetchEmployees}
            disabled={isRefreshing}
            className="btn-secondary btn-icon-only"
            title="Refresh Employees List"
          >
            <RefreshCw size={16} className={isRefreshing ? "spin-animation" : ""} />
            <span>Refresh</span>
          </button>
          <span className="live-pulse-badge">
            <span className="pulse-dot"></span> {employees.length} Active Staff
          </span>
        </div>
      </div>

      <p className="card-description">
        Register new employees with their assigned Employee ID and Email Address. Once registered, employees can immediately punch in and submit daily work logs.
      </p>

      {/* Grid: Create Form (Left) & Directory List (Right) */}
      <div className="employee-mgmt-layout">
        {/* Create Employee Form */}
        <div className="create-emp-box">
          <h3 className="section-subheading">
            <UserPlus size={16} />
            <span>Register New Employee</span>
          </h3>

          <form onSubmit={handleCreate} className="create-emp-form">
            <div className="form-group">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="styled-input"
                required
              />
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label className="input-label">Employee ID *</label>
                <div className="input-with-icon">
                  <Hash size={14} className="field-icon" />
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 101"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    className="styled-input with-icon"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={14} className="field-icon" />
                  <input
                    type="email"
                    placeholder="e.g. rahul@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="styled-input with-icon"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="alert-box alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert-box alert-success">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary btn-block">
              {loading ? (
                <span className="spinner-loading">Saving to Supabase…</span>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Employee</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Directory & Quick Search */}
        <div className="emp-roster-box">
          <div className="roster-header">
            <h3 className="section-subheading">
              <Users size={16} />
              <span>Registered Staff ({employees.length})</span>
            </h3>
            <div className="search-input-wrapper small">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="emp-roster-list">
            {filteredEmployees.length === 0 ? (
              <div className="empty-roster-state">
                <Users size={28} className="empty-icon" />
                <p>No employees match your search.</p>
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div key={emp.id} className="emp-roster-item">
                  <div className="emp-avatar-circle">
                    {emp.name ? emp.name.charAt(0).toUpperCase() : "#"}
                  </div>
                  <div className="emp-meta">
                    <span className="emp-name-text">{emp.name}</span>
                    <span className="emp-email-text">{emp.email || "No email assigned"}</span>
                  </div>
                  <div className="emp-id-badge">ID: #{emp.id}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
