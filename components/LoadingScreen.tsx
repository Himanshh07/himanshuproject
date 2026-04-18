"use client";

/**
 * Fullscreen skeleton loading state with shimmer bars + breathing orb.
 * Use as a suspense fallback or initial load overlay.
 */
export default function LoadingScreen() {
  return (
    <div className="ds-page flex items-center justify-center">
      {/* Breathing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className="w-44 h-44 rounded-full animate-breathe"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
      </div>

      {/* Skeleton card */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-8 space-y-5">
        {/* Fake title bar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl animate-loading-shimmer" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-3/4 rounded-full animate-loading-shimmer" />
            <div className="h-2.5 w-1/2 rounded-full animate-loading-shimmer" />
          </div>
        </div>

        {/* Fake content lines */}
        <div className="space-y-3 pt-2">
          <div className="h-2.5 w-full rounded-full animate-loading-shimmer" />
          <div className="h-2.5 w-5/6 rounded-full animate-loading-shimmer" />
          <div className="h-2.5 w-4/6 rounded-full animate-loading-shimmer" />
        </div>

        {/* Fake action bar */}
        <div className="flex items-center gap-3 pt-3">
          <div className="h-9 flex-1 rounded-xl animate-loading-shimmer" />
          <div className="h-9 w-9 rounded-xl animate-loading-shimmer" />
        </div>

        {/* Animated loading text */}
        <p className="text-center text-xs tracking-widest uppercase text-slate-600 animate-pulse">
          Loading…
        </p>
      </div>
    </div>
  );
}
