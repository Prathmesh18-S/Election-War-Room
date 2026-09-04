import { useState, useMemo } from "react";
import clsx from "clsx";
import {
  HiChevronUp,
  HiChevronDown,
  HiChevronUpDown,
} from "react-icons/hi2";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";

function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found",
  emptyDescription,
  onRowClick,
  className,
  stickyHeader = true,
  striped = false,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null,
  });

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortConfig.direction === "desc" ? -comparison : comparison;
    });
  }, [data, sortConfig]);

  const getSortIcon = (key, sortable) => {
    if (!sortable) return null;
    if (sortConfig.key !== key)
      return <HiChevronUpDown className="h-3.5 w-3.5 text-text-muted" />;
    if (sortConfig.direction === "asc")
      return <HiChevronUp className="h-3.5 w-3.5 text-accent" />;
    return <HiChevronDown className="h-3.5 w-3.5 text-accent" />;
  };

  if (loading) {
    return <LoadingSkeleton variant="table" rows={5} cols={columns.length || 4} className={className} />;
  }

  if (!data.length) {
    return (
      <div
        className={clsx(
          "rounded-[var(--radius-xl)] border border-border-primary bg-surface-secondary",
          className
        )}
      >
        <EmptyState
          title={emptyMessage}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-[var(--radius-xl)] border border-border-primary bg-surface-secondary overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className={clsx(
                "border-b border-border-primary",
                stickyHeader && "sticky top-0 z-10 bg-surface-secondary"
              )}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    "px-5 py-3.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider",
                    "whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none hover:text-text-secondary transition-colors",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                  onClick={() => handleSort(col.key, col.sortable)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {getSortIcon(col.key, col.sortable)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {sortedData.map((row, rowIdx) => (
              <tr
                key={row._id || row.id || rowIdx}
                className={clsx(
                  "transition-colors duration-[var(--duration-fast)]",
                  "hover:bg-surface-tertiary/50",
                  onRowClick && "cursor-pointer",
                  striped && rowIdx % 2 === 1 && "bg-surface-primary/30"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      "px-5 py-3.5 text-sm text-text-secondary whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.cellClassName
                    )}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
