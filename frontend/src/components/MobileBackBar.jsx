import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { memo } from "react";

function MobileBackBar({ to, label = "Back" }) {
  const navigate = useNavigate();

  if (to === undefined || to === null) return null;

  const handleClick = () => navigate(to);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <div className="mobile-back-bar sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
        <button
          type="button"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className="btn-pill btn-outline btn-outline-neutral inline-flex items-center gap-1.5"
          aria-label={`Navigate back to ${label}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {label}
        </button>
      </div>
    </div>
  );
}

export default memo(MobileBackBar);
