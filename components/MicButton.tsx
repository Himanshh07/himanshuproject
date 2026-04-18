"use client";

import { useCallback } from "react";

export type MicState = "idle" | "recording" | "disabled";

interface MicButtonProps {
  state: MicState;
  onClick?: () => void;
}

export default function MicButton({ state, onClick }: MicButtonProps) {
  const handleClick = useCallback(() => {
    if (state !== "disabled" && onClick) onClick();
  }, [state, onClick]);

  const isRecording = state === "recording";
  const isDisabled = state === "disabled";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      className="relative grid h-14 w-14 place-items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/70 focus-visible:ring-4 focus-visible:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: isRecording
          ? "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.18))"
          : isDisabled
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.06)",
      }}
    >
      {/* Outer glow ring — always visible, pulses when recording */}
      <span
        className={`pointer-events-none absolute inset-[-3px] rounded-full transition-opacity duration-300 ${
          isRecording ? "opacity-100" : isDisabled ? "opacity-0" : "opacity-60"
        }`}
        style={{
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #6366f1)",
          padding: "2px",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Soft outer glow */}
      <span
        className={`pointer-events-none absolute inset-[-6px] rounded-full transition-all duration-500 ${
          isRecording ? "opacity-100" : "opacity-0"
        }`}
        style={{
          boxShadow:
            "0 0 24px rgba(34,211,238,0.55), 0 0 48px rgba(99,102,241,0.3), 0 0 72px rgba(139,92,246,0.15)",
        }}
      />

      {/* Pulsing ring animation when recording */}
      {isRecording && (
        <>
          <span
            className="pointer-events-none absolute inset-0 animate-ping rounded-full border-2 border-cyan-300/50"
            style={{ animationDuration: "1.8s" }}
          />
          <span
            className="pointer-events-none absolute inset-[-8px] animate-ping rounded-full border border-indigo-400/30"
            style={{ animationDuration: "2.4s" }}
          />
        </>
      )}

      {/* Hover glow (idle only) */}
      {!isRecording && !isDisabled && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 hover-trigger"
          style={{
            boxShadow: "0 0 18px rgba(99,102,241,0.5), 0 0 36px rgba(139,92,246,0.25)",
          }}
        />
      )}

      {/* Microphone icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={`relative z-10 h-6 w-6 transition-colors duration-300 ${
          isRecording
            ? "text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]"
            : isDisabled
            ? "text-slate-600"
            : "text-indigo-200"
        }`}
      >
        <rect x="9" y="2" width="6" height="11" rx="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 10a7 7 0 0 1-14 0" />
        <line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round" />
        <line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round" />
      </svg>

      {/* Inline hover style — CSS-in-JS fallback for hover glow */}
      <style jsx>{`
        button:not(:disabled):hover .hover-trigger {
          opacity: 1;
        }
        button:not(:disabled):hover {
          transform: scale(1.06);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.45);
        }
      `}</style>
    </button>
  );
}
