import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  shortcutKey = "K",
  debounceMs = 0,
  onClear,
}) {
  const [localValue, setLocalValue] = useState(value || "");
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value !== undefined) setLocalValue(value);
  }, [value]);

  // Keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcutKey.toLowerCase()) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcutKey]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);

    if (debounceMs > 0) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange?.(val), debounceMs);
    } else {
      onChange?.(val);
    }
  };

  const handleClear = () => {
    setLocalValue("");
    onChange?.("");
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div
      className={clsx(
        "relative flex items-center",
        "h-9 rounded-[var(--radius-md)]",
        "bg-surface-secondary border border-border-primary",
        "transition-all duration-[var(--duration-fast)]",
        "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-muted",
        "hover:border-border-hover",
        className
      )}
    >
      <HiMagnifyingGlass className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" />

      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-full bg-transparent text-sm text-text-primary placeholder:text-text-muted pl-9 pr-20 outline-none"
      />

      <div className="absolute right-2 flex items-center gap-1.5">
        {localValue && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-surface-tertiary text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            <HiXMark className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-tertiary border border-border-primary text-[10px] font-medium text-text-muted">
          ⌘{shortcutKey}
        </kbd>
      </div>
    </div>
  );
}

export default SearchBar;
