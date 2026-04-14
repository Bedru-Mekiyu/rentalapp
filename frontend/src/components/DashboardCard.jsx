// src/components/DashboardCard.jsx
export default function DashboardCard({
  title,
  description,
  children,
  actions,
  action,
  className = "",
  premium = false,
  icon: Icon,
}) {
  const renderedActions = actions || action;
  const hasHeader = title || description || renderedActions;

  return (
    <section
      className={`${
        premium ? "surface-panel-premium" : "surface-panel"
      } p-4 sm:p-5 ${className}`.trim()}
    >
      {hasHeader && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div>
              {title && <h2 className="panel-title">{title}</h2>}
              {description && (
                <p className="panel-subtitle mt-1">{description}</p>
              )}
            </div>
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
