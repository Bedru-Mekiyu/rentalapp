import React from "react";

export default function Card({
  title,
  description,
  actions,
  className = "",
  children,
}) {
  return (
    <section className={`surface-panel card-reveal p-6 ${className}`.trim()}>
      {(title || description || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="panel-title">{title}</h2>}
            {description && (
              <p className="panel-subtitle mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
