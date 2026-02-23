import React from "react";

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  eyebrowClassName = "bg-slate-100 text-slate-700",
  actions,
  className = "",
}) {
  return (
    <header className={`surface-panel header-panel p-6 ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow && (
            <span className={`pill ${eyebrowClassName}`.trim()}>
              {eyebrow}
            </span>
          )}
          <h1 className="page-title tracking-tight">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
