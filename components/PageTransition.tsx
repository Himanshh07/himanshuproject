"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Wraps page content with a mount-enter transition.
 * On mount: content fades + slides in.
 * Keeps it minimal — no route-change detection needed.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Tiny delay so the initial state (opacity 0) paints first
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="page-transition"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  );
}
