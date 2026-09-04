import { forwardRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-hover shadow-xs hover:shadow-md",
  secondary:
    "bg-surface-tertiary text-text-primary border border-border-primary hover:border-border-hover hover:bg-surface-elevated",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-tertiary",
  danger:
    "bg-error text-white hover:bg-red-600 shadow-xs hover:shadow-md",
  outline:
    "bg-transparent text-accent border border-accent-border hover:bg-accent-muted",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-md)]",
  md: "h-9 px-4 text-sm gap-2 rounded-[var(--radius-md)]",
  lg: "h-11 px-6 text-sm gap-2.5 rounded-[var(--radius-lg)]",
};

const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon: Icon,
      iconRight: IconRight,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-[var(--duration-fast)]",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "cursor-pointer select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : null}

        {children && <span>{children}</span>}

        {IconRight && !loading && (
          <IconRight className="h-4 w-4 shrink-0" />
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
