import { useState } from "react";
import clsx from "clsx";
import { HiXMark, HiFunnel } from "react-icons/hi2";

function FilterBar({
  filters = [],
  activeFilters = {},
  onChange,
  className,
}) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = Object.values(activeFilters).filter(
    (v) => v !== "" && v !== null && v !== undefined && v !== "all"
  ).length;

  const handleFilterChange = (key, value) => {
    onChange?.({ ...activeFilters, [key]: value });
  };

  const handleClearAll = () => {
    const cleared = {};
    filters.forEach((f) => {
      cleared[f.key] = "all";
    });
    onChange?.(cleared);
  };

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)]",
            "text-sm font-medium transition-all duration-[var(--duration-fast)]",
            "border cursor-pointer",
            expanded
              ? "bg-accent-muted text-accent border-accent-border"
              : "bg-surface-secondary text-text-secondary border-border-primary hover:border-border-hover"
          )}
        >
          <HiFunnel className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-accent text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <>
            {filters.map((filter) => {
              const val = activeFilters[filter.key];
              if (!val || val === "all") return null;
              const option = filter.options.find((o) => o.value === val);
              return (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-surface-tertiary border border-border-primary text-xs text-text-secondary"
                >
                  <span className="text-text-tertiary">{filter.label}:</span>
                  <span className="font-medium text-text-primary">
                    {option?.label || val}
                  </span>
                  <button
                    onClick={() => handleFilterChange(filter.key, "all")}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-surface-elevated text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    <HiXMark className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            <button
              onClick={handleClearAll}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Expanded filter row */}
      {expanded && (
        <div className="flex items-center gap-3 flex-wrap animate-[slide-up_0.2s_ease]">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                {filter.label}
              </label>
              <select
                value={activeFilters[filter.key] || "all"}
                onChange={(e) =>
                  handleFilterChange(filter.key, e.target.value)
                }
                className="h-8 px-2.5 rounded-[var(--radius-md)] bg-surface-secondary border border-border-primary text-xs text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="all">All</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
