import React, { useState } from "react";
import axios from "axios";
import { RotateCcw, AlertTriangle, PlayCircle, CheckCircle } from "lucide-react";

export function DemoToolbar({ apiUrl, onResetLedger, onToast }) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/demo/reset`);
      setStatusMessage(res.data.message);
      if (onResetLedger) onResetLedger();
      if (onToast) onToast("Demo reset: 2 employees ready, records cleared, 09:30 shift active.", "success");
    } catch (err) {
      if (onToast) onToast("Demo reset failed. Backend offline.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateLate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/demo/simulate-late`);
      setStatusMessage(res.data.message);
      if (onToast) onToast("Shift set 1 min in past — next punch will be marked LATE.", "warning");
    } catch (err) {
      if (onToast) onToast("Simulation failed. Backend offline.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-toolbar-container">
      <div className="demo-toolbar-content">
        <div className="demo-toolbar-left">
          <div className="simulation-badge">
            <PlayCircle size={14} />
            <span>Interactive Demo Sandbox</span>
          </div>
          <span className="demo-toolbar-desc">
            Test policy workflows, punch latency, and lateness penalties dynamically.
          </span>
        </div>

        <div className="demo-toolbar-buttons">
          <button
            onClick={handleResetDemo}
            disabled={loading}
            className="btn-demo-action"
            title="Wipe punches and seed demo employees"
          >
            <RotateCcw size={14} className={loading ? "spin-animation" : ""} />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={handleSimulateLate}
            disabled={loading}
            className="btn-demo-action late-sim"
            title="Backdate shift policy to test Late status"
          >
            <AlertTriangle size={14} />
            <span>Simulate Late Punch</span>
          </button>
        </div>
      </div>
      {statusMessage && (
        <div className="demo-feedback-banner">
          <CheckCircle size={14} />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
