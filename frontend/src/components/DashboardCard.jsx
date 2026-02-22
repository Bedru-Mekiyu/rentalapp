// src/components/DashboardCard.jsx
export default function DashboardCard({
  title,
  description,
  children,
  actions,
  action, // support singular prop too
}) {
  const renderedActions = actions || action;

  return (
    <section className="surface-panel card-reveal p-6">
      {(title || description || renderedActions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="panel-title">{title}</h2>}
            {description && (
              <p className="panel-subtitle mt-1">{description}</p>
            )}
          </div>
          {renderedActions && (
            <div className="flex items-center gap-2">{renderedActions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
