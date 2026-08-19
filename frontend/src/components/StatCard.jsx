import React from "react";

export function StatCard({ title, value, subtext, icon: Icon, trend, variant = "default" }) {
  return (
    <div className={`stat-card stat-${variant}`}>
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon-box">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
      {trend && (
        <div className="stat-footer">
          <span className={`trend-badge ${trend.type}`}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
