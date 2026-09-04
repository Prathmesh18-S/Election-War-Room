import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  HiArrowTrendingUp,
  HiArrowTrendingDown,
} from "react-icons/hi2";

function useAnimatedCount(target, duration = 800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof target === "number" ? target : parseInt(target, 10);
    if (isNaN(num)) {
      setCount(target);
      return;
    }

    let startTime;
    const startValue = 0;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startValue + (num - startValue) * eased));

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return count;
}

const iconColorMap = {
  indigo: "bg-accent-muted text-accent",
  green: "bg-success-muted text-success",
  amber: "bg-warning-muted text-warning",
  red: "bg-error-muted text-error",
  blue: "bg-info-muted text-info",
  default: "bg-surface-tertiary text-text-secondary",
};

function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "default",
  suffix,
  className,
}) {
  const animatedValue = useAnimatedCount(value);
  const displayValue =
    typeof value === "number" ? animatedValue.toLocaleString() : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "rounded-[var(--radius-xl)] border border-border-primary",
        "bg-surface-secondary p-5",
        "transition-all duration-[var(--duration-base)]",
        "hover:border-border-subtle hover:shadow-md",
        "group",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {label}
        </p>
        {Icon && (
          <div
            className={clsx(
              "h-9 w-9 rounded-[var(--radius-lg)] flex items-center justify-center",
              "transition-transform duration-[var(--duration-base)] group-hover:scale-105",
              iconColorMap[iconColor] || iconColorMap.default
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text-primary tracking-tight">
          {displayValue}
        </span>
        {suffix && (
          <span className="text-sm text-text-tertiary">{suffix}</span>
        )}
      </div>

      {change !== undefined && change !== null && (
        <div className="mt-2 flex items-center gap-1">
          {changeType === "positive" && (
            <HiArrowTrendingUp className="h-3.5 w-3.5 text-success" />
          )}
          {changeType === "negative" && (
            <HiArrowTrendingDown className="h-3.5 w-3.5 text-error" />
          )}
          <span
            className={clsx(
              "text-xs font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-error",
              changeType === "neutral" && "text-text-tertiary"
            )}
          >
            {change}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default StatCard;
