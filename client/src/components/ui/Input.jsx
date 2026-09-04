import { forwardRef } from "react";
import clsx from "clsx";

const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      className,
      containerClassName,
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={clsx(
              "w-full h-10 rounded-[var(--radius-md)]",
              "bg-surface-secondary border border-border-primary",
              "text-sm text-text-primary placeholder:text-text-muted",
              "transition-all duration-[var(--duration-fast)]",
              "hover:border-border-hover",
              "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted",
              Icon ? "pl-10 pr-3" : "px-3",
              error && "border-error focus:border-error focus:ring-error-muted",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-error mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
