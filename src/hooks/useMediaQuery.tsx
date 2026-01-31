import { useState, useEffect, useRef } from "react";

export function useContainerBreakpoint(
  threshold: number = 672
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAboveThreshold, setIsAboveThreshold] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsAboveThreshold(entry.contentRect.width >= threshold);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [threshold]);

  return [containerRef, isAboveThreshold];
}
