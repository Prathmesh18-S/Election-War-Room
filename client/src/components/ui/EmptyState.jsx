import { motion } from "framer-motion";
import clsx from "clsx";
import { HiOutlineInboxStack } from "react-icons/hi2";
import Button from "./Button";

function EmptyState({
  icon: Icon = HiOutlineInboxStack,
  title = "No data found",
  description,
  action,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="h-16 w-16 rounded-2xl bg-surface-tertiary border border-border-primary flex items-center justify-center mb-5">
        <Icon className="h-7 w-7 text-text-muted" />
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-text-tertiary max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          <Button
            variant={action.variant || "primary"}
            size="sm"
            icon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default EmptyState;
