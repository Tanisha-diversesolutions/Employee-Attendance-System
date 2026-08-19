import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileText, AlertOctagon, CheckCircle2, Clock, RefreshCw, User } from "lucide-react";

export function WorkLogFeed({ apiUrl }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEmp, setFilterEmp] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/worklog/today`);
      setLogs(res.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [apiUrl]);

  const filteredLogs = logs.filter((log) => {
    if (!filterEmp) return true;
    return String(log.employee_id).includes(filterEmp.trim());
  });

  return (
    <div className="card worklog-feed-card">
      <div className="table-controls-header">
        <div>
          <div className="card-eyebrow">
            <FileText size={14} className="eyebrow-icon" />
            Executive Oversight
          </div>
          <h2 className="card-heading">Today's Work Updates & Standups</h2>
        </div>

        <div className="table-actions-group">
          <input
            type="text"
            placeholder="Filter by Employee ID..."
            value={filterEmp}
            onChange={(e) => setFilterEmp(e.target.value)}
            className="search-input compact"
          />
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-secondary btn-icon-only"
            title="Refresh Daily Worklogs"
          >
            <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="empty-ledger-state">
          <FileText size={36} className="empty-icon" />
          <h3>No Work Reports Submitted Today</h3>
          <p>Employees' daily standup summaries and progress reports will appear here once submitted.</p>
        </div>
      ) : (
        <div className="worklog-grid-cards">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="worklog-item-card">
              <div className="worklog-item-header">
                <div className="employee-pill">
                  <User size={14} />
                  <span>Employee #{log.employee_id}</span>
                </div>
                <div className="time-stamp-badge">
                  <Clock size={12} />
                  <span>
                    {log.submitted_at
                      ? new Date(log.submitted_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Today"}
                  </span>
                </div>
              </div>

              <div className="worklog-content-block">
                <div className="worklog-section-title">
                  <CheckCircle2 size={14} className="icon-success" />
                  <span>Completed Deliverables</span>
                </div>
                <p className="worklog-text">{log.completed_work}</p>
              </div>

              {log.pending_work && (
                <div className="worklog-content-block">
                  <div className="worklog-section-title">
                    <Clock size={14} className="icon-pending" />
                    <span>In-Progress / Carrying Over</span>
                  </div>
                  <p className="worklog-text muted">{log.pending_work}</p>
                </div>
              )}

              {log.blockers && (
                <div className="worklog-blocker-box">
                  <div className="blocker-title">
                    <AlertOctagon size={14} className="icon-danger" />
                    <span>Reported Blocker</span>
                  </div>
                  <p className="blocker-desc">{log.blockers}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
