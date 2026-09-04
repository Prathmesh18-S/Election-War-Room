import { motion } from "framer-motion";
import clsx from "clsx";

function DashboardCard({
  title,
  subtitle,
  children,
  headerAction,
  className,
  noPadding = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "rounded-[var(--radius-xl)] border border-border-primary",
        "bg-surface-secondary",
        "transition-all duration-[var(--duration-base)]",
        "hover:border-border-subtle hover:shadow-lg",
        className
      )}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-tertiary mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0">{headerAction}</div>
          )}
        </div>
      )}
      <div className={clsx(!noPadding && "p-6")}>{children}</div>
    </motion.div>
  );
}

export default DashboardCard;
