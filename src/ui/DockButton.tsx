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
          "flex items-center justify-center p-2 shadow rounded-xl relative bottom-3 bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 duration-300 group hover:scale-110 transition-all",
          highlight
            ? "bg-gradient-to-tr from-amber-500/90 via-orange-500/90 to-fuchsia-400/80 hover:from-orange-300/80 hover:to-fuchsia-200/80 focus-visible:!ring-white"
            : "bg-slate-700 hover:bg-slate-500",
          className,
        )}
      >
        <span className="sr-only">{label}</span>
        <span className="group-active:scale-90 flex items-center gap-2 transition-transform">
          {children}
        </span>
      </button>
    ),
  ),
);

DockButton.displayName = "DockButton";
export default DockButton;
