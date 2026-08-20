import React, { useState, useMemo } from "react";
import { Search, Filter, Download, RefreshCw, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";

export function LedgerTable({ records, onRefresh, isRefreshing }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'present' | 'late'

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        String(r.employee_id).includes(q) ||
        (r.employee_name && r.employee_name.toLowerCase().includes(q));
      
      const matchesStatus =
        statusFilter === "all" ||
        r.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ["Employee ID", "Employee Name", "Check-in Timestamp", "Status", "Delay (Minutes)"];
    const rows = records.map((r) => [
      r.employee_id,
      r.employee_name || `Employee #${r.employee_id}`,
      new Date(r.check_in).toISOString(),
      r.status?.toUpperCase(),
      r.late_by_minutes || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance_ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card ledger-station-card">
      {/* Table Top Controls */}
      <div className="table-controls-header">
        <div>
          <div className="card-eyebrow">
            <Users size={14} className="eyebrow-icon" />
            Live Master Ledger
          </div>
          <h2 className="card-heading">Today's Attendance Records</h2>
        </div>

        <div className="table-actions-group">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-secondary btn-icon-only"
            title="Refresh Attendance Ledger"
          >
            <RefreshCw size={16} className={isRefreshing ? "spin-animation" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="btn-secondary"
            title="Export to CSV Spreadsheet"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Punches ({records.length})
          </button>
          <button
            className={`filter-tab on-time ${statusFilter === "present" ? "active" : ""}`}
            onClick={() => setStatusFilter("present")}
          >
            On Time ({records.filter((r) => r.status === "present").length})
          </button>
          <button
            className={`filter-tab late ${statusFilter === "late" ? "active" : ""}`}
            onClick={() => setStatusFilter("late")}
          >
            Late ({records.filter((r) => r.status === "late").length})
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-responsive-wrapper">
        {filteredRecords.length === 0 ? (
          <div className="empty-ledger-state">
            <Clock size={36} className="empty-icon" />
            <h3>No Attendance Records Found</h3>
            <p>
              {records.length === 0
                ? "No check-ins have been recorded today. Punches will stream here live."
                : "No check-in entries match your current search or status filter."}
            </p>
          </div>
        ) : (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Check-in Time</th>
                <th>Status</th>
                <th>Deviation from Policy</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, idx) => {
                const isLate = record.status === "late";
                return (
                  <tr key={`${record.employee_id}-${record.check_in}-${idx}`} className={isLate ? "row-late" : "row-on-time"}>
                    <td>
                      <div className="employee-cell">
                        <div className="table-avatar">
                          {record.employee_name ? record.employee_name.charAt(0).toUpperCase() : record.employee_id}
                        </div>
                        <div className="employee-details">
                          <span className="table-emp-name">
                            {record.employee_name || `Employee #${record.employee_id}`}
                          </span>
                          <span className="table-emp-id">Staff ID: #{record.employee_id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="time-cell">
                        <Clock size={14} className="time-icon" />
                        <span>
                          {new Date(record.check_in).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${isLate ? "pill-late" : "pill-present"}`}>
                        {isLate ? (
                          <>
                            <AlertTriangle size={12} />
                            Late Arrival
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} />
                            On Schedule
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={`delay-text ${isLate ? "late-val" : "ok-val"}`}>
                        {isLate ? `+${record.late_by_minutes} mins past 09:30` : "0 mins (Compliant)"}
                      </span>
                    </td>
                    <td>
                      <span className="verified-badge">System Verified</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
