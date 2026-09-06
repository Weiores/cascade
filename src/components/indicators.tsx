import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { priorityColor, trustColor } from "./badges";

/** Circular progress indicator for trust scores, color-coded red/amber/green. */
export function TrustScoreBadge({ score, size = 44 }: { score: number; size?: number }) {
  const color = trustColor(score);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#11111114" strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-semibold tabular" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

/** Small pill showing final priority with color gradient. */
export function PriorityPill({ score, className }: { score: number; className?: string }) {
  const color = priorityColor(score);
  return (
    <span
      className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular", className)}
      style={{ color, backgroundColor: `${color}14` }}
    >
      {score}
    </span>
  );
}

/** Animated count-up number for KPI cards. */
export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const start = performance.now();
    const dur = 600;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="tabular">
      {display}
      {suffix}
    </span>
  );
}
