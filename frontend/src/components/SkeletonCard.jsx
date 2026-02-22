import React from "react";
import SkeletonRow from "./SkeletonRow";

export default function SkeletonCard({ title, className = "", children }) {
  return (
    <section className={`surface-panel card-reveal p-6 ${className}`.trim()}>
      {title && (
        <div className="mb-4">
          <SkeletonRow className="h-4 w-32" />
        </div>
      )}
      {children}
    </section>
  );
}
