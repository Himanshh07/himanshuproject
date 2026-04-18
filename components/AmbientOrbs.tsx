"use client";

import { useEffect, useRef } from "react";

/**
 * Animated ambient floating orbs for pages that don't have ParticleField.
 * Renders 4-6 softly moving gradient blobs on a canvas.
 */
export default function AmbientOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const orbs = [
      { x: 0.18, y: 0.15, r: 280, color: [99, 102, 241], speed: 0.0003, phase: 0 },
      { x: 0.82, y: 0.78, r: 240, color: [139, 92, 246], speed: 0.00025, phase: 1.8 },
      { x: 0.5, y: 0.45, r: 200, color: [59, 130, 246], speed: 0.00035, phase: 3.2 },
      { x: 0.3, y: 0.75, r: 180, color: [167, 139, 250], speed: 0.0002, phase: 4.5 },
      { x: 0.72, y: 0.2, r: 160, color: [96, 165, 250], speed: 0.00028, phase: 5.8 },
    ];

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      for (const orb of orbs) {
        const cx = w * orb.x + Math.sin(t * orb.speed + orb.phase) * w * 0.06;
        const cy = h * orb.y + Math.cos(t * orb.speed * 0.8 + orb.phase) * h * 0.05;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.r);
        grad.addColorStop(0, `rgba(${orb.color.join(",")}, 0.12)`);
        grad.addColorStop(0.5, `rgba(${orb.color.join(",")}, 0.04)`);
        grad.addColorStop(1, `rgba(${orb.color.join(",")}, 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, orb.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}
