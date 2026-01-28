import { clsx } from "clsx";
import React, { forwardRef, memo } from "react";

interface DockButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  highlight?: boolean;
}

const DockButton = memo(
  forwardRef<HTMLButtonElement, DockButtonProps>(
    ({ children, label, className = "", highlight = false, ...rest }, ref) => (
      <button
        ref={ref}
        {...rest}
        className={clsx(
          // Base styles
          "flex items-center justify-center shadow rounded-xl bg-zinc-700",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
          "transition-all duration-200",
          // Mobile: larger buttons, no offset
          "p-2.5 rounded-xl",
          // Desktop: original styling with offset
          "md:p-2 md:rounded-xl md:relative md:bottom-3 md:hover:scale-110",
          // Highlight variant
          highlight
            ? "bg-gradient-to-tr from-amber-500/90 via-orange-500/90 to-fuchsia-400/80 hover:from-orange-300/80 hover:to-fuchsia-200/80 focus-visible:!ring-white"
            : "bg-slate-700 hover:bg-slate-600 md:hover:bg-slate-500",
          className,
        )}
      >
        <span className="sr-only">{label}</span>
        <span className="flex items-center gap-1 md:gap-2 active:scale-90 transition-transform">
          {children}
        </span>
      </button>
    ),
  ),
);

DockButton.displayName = "DockButton";
export default DockButton;
