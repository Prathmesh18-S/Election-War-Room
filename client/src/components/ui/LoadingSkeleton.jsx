import clsx from "clsx";

/* ── Primitive shapes ──────────────────────────────────────── */

function Line({ width = "100%", height = "h-4", className }) {
  return (
    <div
      className={clsx("skeleton rounded", height, className)}
      style={{ width }}
    />
  );
}

function Circle({ size = "h-10 w-10", className }) {
  return <div className={clsx("skeleton rounded-full", size, className)} />;
}

function Block({ className }) {
  return (
    <div className={clsx("skeleton rounded-[var(--radius-lg)]", className)} />
  );
}

/* ── Compound variants ─────────────────────────────────────── */

function TextSkeleton({ lines = 3, className }) {
  return (
    <div className={clsx("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Line
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height="h-3.5"
        />
      ))}
    </div>
  );
}

function CardSkeleton({ className }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-xl)] border border-border-primary bg-surface-secondary p-5",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <Line width="40%" height="h-3" />
        <Circle size="h-9 w-9" />
      </div>
      <Line width="50%" height="h-7" className="mb-2" />
      <Line width="30%" height="h-3" />
    </div>
  );
}

function TableSkeleton({ rows = 5, cols = 4, className }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-xl)] border border-border-primary bg-surface-secondary overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border-primary bg-surface-primary/30">
        {Array.from({ length: cols }).map((_, i) => (
          <Line key={i} width={`${20 + Math.random() * 15}%`} height="h-3" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 px-6 py-4 border-b border-border-primary last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Line
              key={colIdx}
              width={`${25 + Math.random() * 20}%`}
              height="h-3.5"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatSkeleton({ className }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-xl)] border border-border-primary bg-surface-secondary p-5",
        className
      )}
    >
      <Line width="60%" height="h-3" className="mb-3" />
      <Line width="40%" height="h-6" className="mb-2" />
      <Line width="30%" height="h-3" />
    </div>
  );
}

function AvatarSkeleton({ className }) {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <Circle size="h-10 w-10" />
      <div className="flex-1 space-y-2">
        <Line width="70%" height="h-3.5" />
        <Line width="50%" height="h-3" />
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

function LoadingSkeleton({
  variant = "text",
  count = 1,
  className,
  ...props
}) {
  const Component = {
    text: TextSkeleton,
    card: CardSkeleton,
    table: TableSkeleton,
    stat: StatSkeleton,
    avatar: AvatarSkeleton,
  }[variant];

  if (!Component) return null;

  if (count === 1) {
    return <Component className={className} {...props} />;
  }

  return (
    <div className={clsx("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} {...props} />
      ))}
    </div>
  );
}

// Attach primitives as sub-components
LoadingSkeleton.Line = Line;
LoadingSkeleton.Circle = Circle;
LoadingSkeleton.Block = Block;

export default LoadingSkeleton;
