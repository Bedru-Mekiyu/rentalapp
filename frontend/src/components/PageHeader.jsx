import { useNavigate } from "react-router-dom";

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  eyebrowClassName = "bg-slate-100 text-slate-700",
  actions,
  backTo,
  backLabel = "Back",
  backClassName = "btn-pill btn-outline btn-outline-neutral",
  className = "",
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo === undefined || backTo === null) return;
    navigate(backTo);
  };

  return (
    <header className={`mb-8 ${className}`.trim()}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          {backTo !== undefined && backTo !== null && (
            <button
              type="button"
              onClick={handleBack}
              className={backClassName}
            >
              {backLabel}
            </button>
          )}
          {eyebrow && (
            <span className={`pill ${eyebrowClassName}`.trim()}>
              {eyebrow}
            </span>
          )}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
