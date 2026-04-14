import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBack();
    }
  };

  return (
    <header className={`mb-6 sm:mb-8 ${className}`.trim()} role="banner">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          {backTo !== undefined && backTo !== null && (
            <button
              type="button"
              onClick={handleBack}
              onKeyDown={handleKeyDown}
              className={`inline-flex items-center gap-1.5 ${backClassName}`}
              aria-label={`Navigate back to ${backLabel}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </button>
          )}
          {eyebrow && (
            <span className={`pill ${eyebrowClassName}`.trim()} role="status">
              {eyebrow}
            </span>
          )}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end" role="toolbar" aria-label="Page actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
