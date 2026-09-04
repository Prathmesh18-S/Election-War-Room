import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { HiXMark } from "react-icons/hi2";
import clsx from "clsx";

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
  hideCloseButton = false,
}) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
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

        {/* Panel */}
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
            <DialogPanel
              className={clsx(
                "w-full rounded-[var(--radius-xl)]",
                "bg-surface-secondary border border-border-primary",
                "shadow-xl overflow-hidden",
                sizeMap[size],
                className
              )}
            >
              {/* Header */}
              {(title || !hideCloseButton) && (
                <div className="flex items-start justify-between px-6 py-4 border-b border-border-primary">
                  <div>
                    {title && (
                      <DialogTitle className="text-base font-semibold text-text-primary">
                        {title}
                      </DialogTitle>
                    )}
                    {description && (
                      <p className="text-sm text-text-tertiary mt-0.5">
                        {description}
                      </p>
                    )}
                  </div>
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-1.5 -mr-1.5 -mt-0.5 rounded-[var(--radius-md)] text-text-muted hover:text-text-secondary hover:bg-surface-tertiary transition-colors cursor-pointer"
                    >
                      <HiXMark className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="px-6 py-5">{children}</div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Modal;
