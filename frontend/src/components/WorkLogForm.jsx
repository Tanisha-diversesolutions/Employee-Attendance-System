import React, { useState } from "react";
import axios from "axios";
import { FileText, Send, CheckCircle2, AlertCircle, Sparkles, HelpCircle } from "lucide-react";

export function WorkLogForm({ apiUrl, onToast }) {
  const [employeeId, setEmployeeId] = useState("");
  const [completed, setCompleted] = useState("");
  const [pending, setPending] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !completed.trim()) {
      if (onToast) onToast("Please provide your Employee ID or Name and completed work.", "warning");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${apiUrl}/worklog/submit/${encodeURIComponent(employeeId.trim())}`, {
        completed_work: completed.trim(),
        pending_work: pending.trim(),
        blockers: "",
      });
      setSubmittedSuccess(true);
      setCompleted("");
      setPending("");
      if (onToast) onToast("Daily work report submitted successfully!", "success");
      setTimeout(() => setSubmittedSuccess(false), 6000);
    } catch (err) {
      if (onToast) onToast("Worklog submission failed. Check backend connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card worklog-card">
      <div className="card-header-row">
        <div>
          <div className="card-eyebrow">
            <FileText size={14} className="eyebrow-icon" />
            Daily Standup
          </div>
          <h2 className="card-heading">End-of-Day Work Update</h2>
        </div>
        <span className="badge-pill subtle">Admin Visible</span>
      </div>

      <p className="card-description">
        Submit your deliverables and in-progress tasks for management review and project tracking.
      </p>

      {submittedSuccess && (
        <div className="alert-box alert-success animate-fade-in">
          <CheckCircle2 size={18} />
          <div>
            <strong>Update Logged!</strong> Your daily work report is now visible in the HR Management Console.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="worklog-form">
        <div className="form-group">
          <label className="input-label">
            Employee ID or Full Name <span className="req-star">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 1, 101, or Ananya Rout"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="styled-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="input-label">
            Completed Tasks Today <span className="req-star">*</span>
          </label>
          <textarea
            rows="3"
            placeholder="• Shipped the attendance API integration&#10;• Refactored database queries&#10;• Reviewed PR #42"
            value={completed}
            onChange={(e) => setCompleted(e.target.value)}
            className="styled-textarea"
            required
          />
        </div>

        <div className="form-group">
          <label className="input-label">In-Progress / Carrying Over (Optional)</label>
          <textarea
            rows="2"
            placeholder="What will you pick up next session?"
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            className="styled-textarea"
          />
        </div>

        <div className="form-footer">
          <div className="char-hint">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Updates are timestamped and linked to your attendance card.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <span>Submitting Report…</span>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Daily Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
