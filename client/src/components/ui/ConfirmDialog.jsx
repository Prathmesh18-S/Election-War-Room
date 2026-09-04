import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import clsx from "clsx";
import {
  HiExclamationTriangle,
  HiExclamationCircle,
  HiInformationCircle,
} from "react-icons/hi2";
import Button from "./Button";

const variantConfig = {
  danger: {
    icon: HiExclamationTriangle,
    iconBg: "bg-error-muted",
    iconColor: "text-error",
    confirmVariant: "danger",
  },
  warning: {
    icon: HiExclamationCircle,
    iconBg: "bg-warning-muted",
    iconColor: "text-warning",
    confirmVariant: "primary",
  },
  info: {
    icon: HiInformationCircle,
    iconBg: "bg-info-muted",
    iconColor: "text-info",
    confirmVariant: "primary",
  },
};

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) {
  const config = variantConfig[variant] || variantConfig.danger;
  const IconComp = config.icon;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-[var(--ease-out-expo)] duration-300"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-sm rounded-[var(--radius-xl)] bg-surface-secondary border border-border-primary shadow-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={clsx(
                      "h-10 w-10 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0",
                      config.iconBg
                    )}
                  >
                    <IconComp className={clsx("h-5 w-5", config.iconColor)} />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold text-text-primary">
                      {title}
                    </DialogTitle>
                    {message && (
                      <p className="text-sm text-text-tertiary mt-1.5 leading-relaxed">
                        {message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-primary bg-surface-primary/50">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={config.confirmVariant}
                  size="sm"
                  onClick={onConfirm}
                  loading={loading}
                >
                  {confirmText}
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export default ConfirmDialog;
