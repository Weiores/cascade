import { cn } from "../lib/utils";

/** Horizontal transit line with station dots — used as a section divider. */
export function TrackDivider({
  color = "#111111",
  stations = 3,
  className,
  animated = false,
}: {
  color?: string;
  stations?: number;
  className?: string;
  animated?: boolean;
}) {
  const dots = Array.from({ length: stations }, (_, i) => ((i + 1) / (stations + 1)) * 100);
  return (
    <div className={cn("relative h-6 w-full", className)} aria-hidden>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 24">
        <line
          x1="0"
          y1="12"
          x2="100"
          y2="12"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={animated ? "6 6" : undefined}
          className={animated ? "animate-dash" : undefined}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {dots.map((x, i) => (
        <span
          key={i}
          className="absolute top-1/2 flex h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] bg-paper"
          style={{ left: `${x}%`, borderColor: color }}
        >
          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
        </span>
      ))}
    </div>
  );
}

/** Small station dot, used inline before labels/nav items. */
export function StationDot({ color = "#111111", active = false, className }: { color?: string; active?: boolean; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full border-[1.5px] transition-all", className)}
      style={{
        borderColor: color,
        backgroundColor: active ? color : "transparent",
        boxShadow: active ? `0 0 0 3px ${color}22` : undefined,
      }}
      aria-hidden
    />
  );
}

/** Line-color chip, e.g. "EWL" style line label. */
export function LineChip({ label, color, className }: { label: string; color: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white", className)}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
