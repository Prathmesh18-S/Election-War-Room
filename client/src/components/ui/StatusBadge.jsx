import clsx from "clsx";

const variantStyles = {
  success: {
    bg: "bg-success-muted",
    text: "text-success",
    dot: "bg-success",
  },
  warning: {
    bg: "bg-warning-muted",
    text: "text-warning",
    dot: "bg-warning",
  },
  error: {
    bg: "bg-error-muted",
    text: "text-error",
    dot: "bg-error",
  },
  info: {
    bg: "bg-info-muted",
    text: "text-info",
    dot: "bg-info",
  },
  neutral: {
    bg: "bg-surface-tertiary",
    text: "text-text-secondary",
    dot: "bg-text-tertiary",
  },
};

const sizeStyles = {
  sm: "text-[11px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-2",
};

function StatusBadge({
  children,
  variant = "neutral",
  size = "md",
  pulse = false,
  dot = true,
  className,
}) {
  const style = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full",
        "whitespace-nowrap select-none",
        style.bg,
        style.text,
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full shrink-0",
            style.dot,
            pulse && "animate-[pulse-subtle_2s_ease-in-out_infinite]"
          )}
        />
      )}
      {children}
    </span>
  );
}

export default StatusBadge;
