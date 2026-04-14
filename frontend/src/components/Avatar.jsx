import { memo } from "react";

/**
 * Avatar - Displays user initials in a styled circle
 * @param {string} name - Full name of the user
 * @param {string} [className] - Additional CSS classes
 * @param {string} [fallback="U"] - Fallback letter if no name provided
 */
const Avatar = memo(function Avatar({ name = "", className = "", fallback = "U" }) {
  const initials = (name || fallback)
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white ring-2 ring-white ${className}`}
      role="img"
      aria-label={`Avatar: ${name || "User"}`}
    >
      {initials}
    </div>
  );
});

export default Avatar;
