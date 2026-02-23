import React from "react";

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className = "",
}) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = total === 0 ? 0 : Math.min(page * pageSize, total);

  if (totalPages <= 1) return null;

  const start = Math.max(page - 2, 1);
  const end = Math.min(page + 2, totalPages);
  const pages = [];

  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  const showFirst = start > 1;
  const showLast = end < totalPages;

  return (
    <div className={`pagination-shell ${className}`.trim()}>
      <div className="pagination-meta">
        Showing {startItem}-{endItem} of {total} · Page {page} of {totalPages}
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn-pill btn-outline btn-outline-slate disabled:opacity-50"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        {showFirst && (
          <>
            <button
              type="button"
              className={`btn-pill btn-outline btn-outline-slate ${
                page === 1 ? "pagination-active" : ""
              }`}
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            <span className="pagination-ellipsis">…</span>
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`btn-pill btn-outline btn-outline-slate ${
              page === p ? "pagination-active" : ""
            }`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {showLast && (
          <>
            <span className="pagination-ellipsis">…</span>
            <button
              type="button"
              className={`btn-pill btn-outline btn-outline-slate ${
                page === totalPages ? "pagination-active" : ""
              }`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="btn-pill btn-outline btn-outline-slate disabled:opacity-50"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
