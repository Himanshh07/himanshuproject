"use client";

import { useState } from "react";
import Link from "next/link";
import ParticleField from "@/components/ParticleField";
import OrbitalRings from "@/components/OrbitalRings";
import { Badge } from "@/components/ui";
import PageTransition from "@/components/PageTransition";

/* ─── feature card data ─── */
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    title: "AI-Powered Analysis",
    description:
      "Real-time evaluation of communication, pedagogy, and subject mastery using LLMs.",
    accent: "rgba(99,102,241,",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Instant Scoring",
    description:
      "Comprehensive scorecard generated in under 60 seconds with detailed feedback.",
    accent: "rgba(139,92,246,",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Bias-Free Screening",
    description:
      "Standardized AI interviews ensure every candidate is evaluated fairly and consistently.",
    accent: "rgba(59,130,246,",
  },
];



export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <main className="ds-page relative flex flex-col w-full min-h-screen overflow-x-hidden">
      {/* ── background layers ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <ParticleField />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 hidden lg:block">
        <OrbitalRings />
      </div>

      {/* radial glow blobs */}
      <div
        className="pointer-events-none absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.5) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-[-150px] w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(ellipse, rgba(139,92,246,0.6) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* ══════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════ */}
      <PageTransition>
        <section className="relative z-10 pt-16 md:pt-20 pb-12">
          <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
            {/* Badge */}
            <Badge className="mb-5 sm:mb-6 animate-fade-in-up">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Powered by Advanced AI
            </Badge>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-0 animate-float animate-fade-in-up delay-100">
              <span className="block text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.25)]">
                AI Tutor
              </span>
              <span
                className="block ds-gradient-text animate-shimmer"
                style={{ backgroundSize: "200% auto" }}
              >
                Screener
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-xl md:text-2xl text-slate-400 font-light leading-relaxed max-w-2xl mt-4 mb-0 animate-fade-in-up delay-200">
              Evaluate teaching skills with{" "}
              <span className="text-indigo-300 font-medium">
                intelligent AI interviews
              </span>{" "}
              — precise, unbiased, and built for the future of education.
            </p>

            {/* Stats */}
            <div className="hidden sm:flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 mb-0 text-sm text-slate-500 animate-fade-in-up delay-300">
              {[
                { value: "10,000+", label: "educators screened", color: "text-indigo-400" },
                { value: "98%", label: "accuracy rate", color: "text-violet-400" },
                { value: "5 min", label: "avg. assessment", color: "text-blue-400" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="hidden sm:block w-px h-4 bg-slate-700 mr-4 sm:mr-2" />
                  )}
                  <span className={`${stat.color} font-semibold`}>{stat.value}</span>{" "}
                  {stat.label}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 mb-0 w-full sm:w-auto animate-fade-in-up delay-400">
              {/* Primary – glowing button */}
              <Link
                href="/chat"
                className="ds-btn-primary group relative w-full sm:w-auto overflow-hidden"
                style={{
                  boxShadow:
                    "0 0 20px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)",
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <svg
                  className="w-5 h-5 relative z-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                  />
                </svg>
                <span className="relative z-10">Start Interview</span>
              </Link>

              {/* Secondary outline button */}
              <Link
                href="/dashboard"
                className="ds-btn-secondary group w-full sm:w-auto"
              >
                <svg
                  className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
                View Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FEATURE CARDS SECTION
            ══════════════════════════════════════════════ */}
        <section className="relative z-10 py-12 md:py-14">
          <div className="max-w-5xl mx-auto px-6">
            {/* Section heading */}
            <div className="text-center mb-8 md:mb-10 animate-fade-in-up">
              <p className="text-sm uppercase tracking-widest text-indigo-400 font-semibold mb-3">
                Why Choose Us
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Built for{" "}
                <span className="ds-gradient-text">Modern Hiring</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">
                Three pillars that make our AI screening the most trusted
                evaluation platform for educators.
              </p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
              {features.map((feature, i) => {
                const isHovered = hoveredCard === i;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredCard(i)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="relative p-6 sm:p-8 rounded-2xl cursor-default transition-all duration-300 animate-fade-in-up"
                    style={{
                      animationDelay: `${200 + i * 120}ms`,
                      background: isHovered
                        ? `linear-gradient(135deg, ${feature.accent}0.1) 0%, rgba(2,8,23,0.85) 100%)`
                        : "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: isHovered
                        ? `1px solid ${feature.accent}0.35)`
                        : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: isHovered
                        ? `0 0 40px ${feature.accent}0.15), 0 20px 40px rgba(0,0,0,0.35)`
                        : "0 4px 24px rgba(0,0,0,0.2)",
                      transform: isHovered
                        ? "translateY(-6px) scale(1.03)"
                        : "translateY(0) scale(1)",
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="inline-flex p-3 rounded-xl mb-4 transition-all duration-300"
                      style={{
                        background: `${feature.accent}0.12)`,
                        color: isHovered ? "#fff" : `${feature.accent}0.9)`,
                        boxShadow: isHovered
                          ? `0 0 20px ${feature.accent}0.45)`
                          : "none",
                      }}
                    >
                      {feature.icon}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Top glow line on hover */}
                    {isHovered && (
                      <div
                        className="absolute top-0 left-6 right-6 h-px rounded-full"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${feature.accent}0.6), transparent)`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            HOW IT WORKS – 3-STEP STRIP
            ══════════════════════════════════════════════ */}
        <section className="relative z-10 py-12 md:py-14">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-8 md:mb-10">
              <p className="text-sm uppercase tracking-widest text-violet-400 font-semibold mb-3">
                Simple Process
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                How It{" "}
                <span className="ds-gradient-text">Works</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Start the Interview",
                  desc: "Click start and our AI begins a structured conversation to evaluate your teaching style.",
                  color: "text-indigo-400",
                  border: "border-indigo-500/20",
                  glow: "rgba(99,102,241,0.08)",
                },
                {
                  step: "02",
                  title: "Speak Naturally",
                  desc: "Answer 8 scenario-based questions using your microphone — just like a real interview.",
                  color: "text-violet-400",
                  border: "border-violet-500/20",
                  glow: "rgba(139,92,246,0.08)",
                },
                {
                  step: "03",
                  title: "Get Your Report",
                  desc: "Receive a detailed scorecard with strengths, weaknesses, and evidence-based feedback.",
                  color: "text-blue-400",
                  border: "border-blue-500/20",
                  glow: "rgba(59,130,246,0.08)",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`relative p-6 sm:p-8 rounded-2xl border ${item.border} bg-white/[0.03] backdrop-blur-md text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                  style={{ boxShadow: `0 0 30px ${item.glow}` }}
                >
                  <span
                    className={`text-4xl font-black ${item.color} opacity-30 absolute top-4 right-5`}
                  >
                    {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-white mt-6 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FINAL CTA
            ══════════════════════════════════════════════ */}
        <section className="relative z-10 py-12 md:py-14">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5">
              Ready to Find Your{" "}
              <span className="ds-gradient-text">Best Tutors?</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-6 text-base sm:text-lg">
              Start a free AI-powered interview in under 5 minutes — no
              sign-up required.
            </p>
            <Link
              href="/chat"
              className="ds-btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
              style={{
                boxShadow:
                  "0 0 30px rgba(99,102,241,0.45), 0 0 80px rgba(99,102,241,0.15)",
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                />
              </svg>
              Start Interview Now
            </Link>
          </div>
        </section>

        {/* spacer so content doesn't collide with bottom fade */}
        <div className="h-8 md:h-12" />
      </PageTransition>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-32"
        style={{
          background: "linear-gradient(to top, #020817, transparent)",
        }}
      />
    </main>
  );
}
