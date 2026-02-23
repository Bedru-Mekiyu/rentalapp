import React from "react";

export default function AppHeader({ title }) {
  return (
    <header className="nav-shell">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <h1 className="app-title text-lg font-semibold text-slate-900">
          {title}
        </h1>
        <img
          src="https://i.pravatar.cc/40"
          alt="Profile"
          className="h-9 w-9 rounded-full border border-white/60 shadow"
        />
      </div>
    </header>
  );
}
