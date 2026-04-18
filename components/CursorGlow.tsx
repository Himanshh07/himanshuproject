"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a subtle radial glow that follows the mouse cursor.
 * Only visible on pointer (non-touch) devices.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hide on touch devices
    const mql = window.matchMedia("(pointer: fine)");
    if (!mql.matches) {
      el.style.display = "none";
      return;
    }

    let x = -400;
    let y = -400;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const tick = () => {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" />;
}
