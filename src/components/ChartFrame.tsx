import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Recharts computes paths from the measured container size. During SSR the
 * container has no size, so area/pie shapes hydrate empty. Mounting after
 * hydration guarantees a real measurement.
 *
 * `min-w-0 overflow-hidden` is load-bearing on mobile: flex/grid children
 * default to `min-width: auto`, so if ResponsiveContainer ever reports (or
 * briefly flashes, e.g. right after a route change) a width wider than the
 * card, the chart pushes the whole page wider than the viewport instead of
 * clipping. That horizontal overflow is what makes the fixed bottom nav bar
 * and other floating elements appear to "fly off" to the right on phones.
 */
export function ChartFrame({ className, children }: { className?: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={cn("min-w-0 w-full overflow-hidden", className)}>
      {mounted ? children : null}
    </div>
  );
}
