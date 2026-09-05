"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/** Catmull-Rom smoothed cubic path through normalized points. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Stretchy area chart: fills its container, stroke stays crisp via
 * non-scaling-stroke; the live end-point dot is HTML for a perfect circle.
 */
export function Area({
  points,
  accent,
  height = 96,
  showDot = true,
  animate = true,
}: {
  points: number[];
  accent: string;
  height?: number;
  showDot?: boolean;
  animate?: boolean;
}) {
  const id = useId().replace(/[:]/g, "");
  const W = 100;
  const H = 40;

  if (points.length === 0) {
    return <div style={{ height }} className="rounded-2xl bg-ink/[0.03]" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const lo = min - span * 0.18;
  const hi = max + span * 0.18;

  const pts = points.map((v, i) => ({
    x: (i / Math.max(1, points.length - 1)) * W,
    y: H - ((v - lo) / (hi - lo)) * H,
  }));

  const line = smoothPath(pts);
  const area = `${line} L ${W} ${H + 2} L 0 ${H + 2} Z`;
  const last = pts[pts.length - 1];

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#g-${id})`}
          initial={animate ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={accent}
          strokeWidth={1.6}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={animate ? { pathLength: 0 } : undefined}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
      {showDot && points.length > 1 && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(last.x / W) * 100}%`, top: `${(last.y / H) * 100}%` }}
        >
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ background: accent }}
            animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <span
            className="relative block size-[7px] rounded-full ring-2 ring-card"
            style={{ background: accent }}
          />
        </div>
      )}
    </div>
  );
}

export function vitalStats(points: number[]) {
  if (!points.length) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const avg = points.reduce((a, b) => a + b, 0) / points.length;
  return { min, max, avg };
}
