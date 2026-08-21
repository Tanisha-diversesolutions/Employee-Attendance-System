import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Building2,
  Shield,
  User,
  ArrowRight,
  TrendingUp,
  Award,
} from "lucide-react";

import { Navbar } from "./components/Navbar";
import { StatCard } from "./components/StatCard";
import { CheckInPanel } from "./components/CheckInPanel";
import { WorkLogForm } from "./components/WorkLogForm";
import { LedgerTable } from "./components/LedgerTable";
import { WorkLogFeed } from "./components/WorkLogFeed";
import { AdminLogin } from "./components/AdminLogin";
import { DemoToolbar } from "./components/DemoToolbar";
import { EmployeeManager } from "./components/EmployeeManager";

import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://employee-attendance-system-xgsf.onrender.com");

export default function App() {
  const [role, setRole] = useState(null); // null | "employee" | "admin" | "admin-locked"
  const [records, setRecords] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast Notification Dispatcher
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Fetch Attendance Records
  const fetchAttendance = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get(`${API_URL}/attendance/today`);
      setRecords(res.data || []);
    } catch {
      /* silent on error */
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch once on entering Admin View (No auto-polling, manual refresh only)
  useEffect(() => {
    if (role === "admin") {
      fetchAttendance();
    }
  }, [role, fetchAttendance]);

  // Executive KPI Calculations
  const totalPunches = records.length;
  const onTimeCount = records.filter((r) => r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const punctualityRate =
    totalPunches > 0 ? Math.round((onTimeCount / totalPunches) * 100) : 100;

  return (
    <div className="app-shell">
      {/* Top Enterprise Navigation */}
      <Navbar
        role={role}
        onSwitchRole={() => setRole(null)}
        shiftTime="09:30 AM"
      />

      {/* 1. GATEWAY LANDING VIEW */}
      {role === null && (
        <div className="gateway-container">
          <div className="gateway-intro">
            <h2>Welcome to Diverse Solutions Attendance Portal</h2>
            <p>
              Corporate attendance validation, shift compliance monitoring, and
              daily end-of-day standup logs. Please select your workspace.
            </p>
          </div>

          <div className="gateway-cards-grid">
            {/* Employee Portal Card */}
            <div
              className="gateway-card employee-portal"
              onClick={() => setRole("employee")}
            >
              <div className="gateway-icon-wrap">
                <User size={32} />
              </div>
              <h3>Employee Workspace</h3>
              <p>
                Punch in for your daily shift, verify reporting timeliness, and
                submit end-of-day work summaries.
              </p>
              <button className="gateway-action-btn">
                <span>Enter Employee Portal</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Admin Management Card */}
            <div
              className="gateway-card admin-portal"
              onClick={() => setRole("admin-locked")}
            >
              <div className="gateway-icon-wrap">
                <Shield size={32} />
              </div>
              <h3>HR Management Console</h3>
              <p>
                Real-time master ledger, executive punctuality analytics, CSV
                reports, and employee work update feed.
              </p>
              <button className="gateway-action-btn">
                <span>Enter Admin Console</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN AUTHENTICATION MODAL */}
      {role === "admin-locked" && (
        <AdminLogin
          onSuccess={() => setRole("admin")}
          onBack={() => setRole(null)}
          onToast={showToast}
        />
      )}

      {/* 3. EMPLOYEE PORTAL VIEW */}
      {role === "employee" && (
        <div className="dashboard-grid">
          <div className="employee-two-col">
            <CheckInPanel
              apiUrl={API_URL}
              onNewRecord={fetchAttendance}
              onToast={showToast}
            />
            <WorkLogForm apiUrl={API_URL} onToast={showToast} />
          </div>
        </div>
      )}

      {/* 4. ADMIN MANAGEMENT CONSOLE */}
      {role === "admin" && (
        <div className="dashboard-grid">
          {/* Demo Sandbox Toolbar */}
          <DemoToolbar
            apiUrl={API_URL}
            onResetLedger={() => setRecords([])}
            onToast={showToast}
          />

          {/* Executive Stat Cards */}
          <div className="stats-grid">
            <StatCard
              title="Today's Total Punches"
              value={totalPunches}
              subtext="Recorded employee timecards"
              icon={Users}
              trend={{ label: "Today's Ledger", type: "trend-info" }}
              variant="default"
            />
            <StatCard
              title="On-Time Arrivals"
              value={onTimeCount}
              subtext="Complied with 09:30 AM shift"
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard
              title="Late Arrivals"
              value={lateCount}
              subtext="Exceeded grace period"
              icon={AlertTriangle}
              variant="warning"
            />
            <StatCard
              title="Punctuality Score"
              value={`${punctualityRate}%`}
              subtext="Overall shift compliance"
              icon={Award}
              variant="info"
            />
          </div>

          {/* Employee Directory & Registration */}
          <EmployeeManager
            apiUrl={API_URL}
            onToast={showToast}
            onEmployeeCreated={fetchAttendance}
          />

          {/* Master Live Ledger */}
          <LedgerTable
            records={records}
            onRefresh={fetchAttendance}
            isRefreshing={isRefreshing}
          />

          {/* Work Updates / Standups Feed */}
          <WorkLogFeed apiUrl={API_URL} />
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            {t.type === "success" && <CheckCircle2 size={16} />}
            {t.type === "warning" && <AlertTriangle size={16} />}
            {t.type === "error" && <AlertTriangle size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}