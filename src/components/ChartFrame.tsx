import { useEffect, useState, type ReactNode } from "react";

/**
 * Recharts computes paths from the measured container size. During SSR the
 * container has no size, so area/pie shapes hydrate empty. Mounting after
 * hydration guarantees a real measurement.
 */
export function ChartFrame({ className, children }: { className?: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return <div className={className}>{mounted ? children : null}</div>;
}
