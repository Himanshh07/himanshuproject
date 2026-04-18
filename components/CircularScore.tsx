"use client";

import { useEffect, useRef, useState } from "react";

interface CircularScoreProps {
  label: string;
  score: number;
  max?: number;
  color: string; // tailwind-style hex
  glowColor: string; // rgba for box-shadow
}

export default function CircularScore({
  label,
  score,
  max = 10,
  color,
  glowColor,
}: CircularScoreProps) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const pct = (score / max) * 100;

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedPct(pct), 120);
    return () => clearTimeout(timeout);
  }, [pct]);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  return (
    <div
      ref={ref}
      className="group relative flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow: `0 0 30px ${glowColor}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${glowColor}, 0 0 60px ${glowColor}`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${color}55`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${glowColor}`;
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
      }}
    >
      {/* Circular progress */}
      <div className="relative h-20 w-20 sm:h-28 sm:w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out will-change-[stroke-dashoffset]"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-white" style={{ textShadow: `0 0 12px ${glowColor}` }}>
            {score}
          </span>
          <span className="text-xs text-slate-500">/ {max}</span>
        </div>
      </div>

      <span className="text-sm font-medium tracking-wide text-slate-300">{label}</span>
    </div>
  );
}
