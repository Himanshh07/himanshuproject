"use client";

import { useEffect, useState } from "react";
import CircularScore from "@/components/CircularScore";
import { Badge, SectionLabel } from "@/components/ui";
import AmbientOrbs from "@/components/AmbientOrbs";
import PageTransition from "@/components/PageTransition";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface StoredEvaluation {
  overall: number;
  clarity: number;
  patience: number;
  simplification: number;
  strengths: string[];
  weaknesses: string[];
  evidenceQuotes: { text: string; tag: string; accent: string }[];
}

/* ------------------------------------------------------------------ */
/*  Fallback mock data (shown when no interview has been completed)    */
/* ------------------------------------------------------------------ */

const defaultScores = [
  { label: "Clarity",    score: 9,  color: "#818cf8", glow: "rgba(129,140,248,0.18)" },
  { label: "Patience",   score: 7,  color: "#a78bfa", glow: "rgba(167,139,250,0.18)" },
  { label: "Fluency",    score: 8,  color: "#60a5fa", glow: "rgba(96,165,250,0.18)"  },
  { label: "Simplicity", score: 6,  color: "#c084fc", glow: "rgba(192,132,252,0.18)" },
];

const defaultStrengths = [
  "Uses clear, relatable analogies to explain abstract concepts.",
  "Maintains a calm and encouraging tone throughout the session.",
  "Breaks complex problems into manageable, sequential steps.",
  "Actively checks for student understanding before moving on.",
];

const defaultWeaknesses = [
  "Occasionally uses jargon without defining it first.",
  "Pacing could slow down during difficult topic transitions.",
  "Could provide more real-world examples for visual learners.",
  "Follow-up questions tend to be closed-ended rather than open.",
];

const defaultQuotes = [
  {
    text: "\u201cLet me put it this way \u2014 think of a variable like a box. Whatever you put inside is the value.\u201d",
    tag: "Strong analogy",
    accent: "indigo",
  },
  {
    text: "\u201cDoes that make sense so far? Great, let\u2019s keep going.\u201d",
    tag: "Comprehension check",
    accent: "violet",
  },
  {
    text: "\u201cSo basically, uh, the derivative is like, the slope thing.\u201d",
    tag: "Needs precision",
    accent: "amber",
  },
  {
    text: "\u201cYou\u2019re doing really well \u2014 this is a tricky topic and you\u2019re handling it.\u201d",
    tag: "Encouragement",
    accent: "emerald",
  },
];

/* ------------------------------------------------------------------ */
/*  Accent map helpers                                                 */
/* ------------------------------------------------------------------ */
const quoteAccentMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  indigo:  { border: "border-indigo-400/30", bg: "bg-indigo-400/10", text: "text-indigo-300", glow: "rgba(99,102,241,0.12)" },
  violet:  { border: "border-violet-400/30", bg: "bg-violet-400/10", text: "text-violet-300", glow: "rgba(139,92,246,0.12)" },
  amber:   { border: "border-amber-400/30",  bg: "bg-amber-400/10",  text: "text-amber-300",  glow: "rgba(245,158,11,0.12)" },
  emerald: { border: "border-emerald-400/30", bg: "bg-emerald-400/10", text: "text-emerald-300", glow: "rgba(52,211,153,0.12)" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [scores, setScores] = useState(defaultScores);
  const [strengths, setStrengths] = useState(defaultStrengths);
  const [weaknesses, setWeaknesses] = useState(defaultWeaknesses);
  const [quotes, setQuotes] = useState(defaultQuotes);
  const [fromInterview, setFromInterview] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("interviewEvaluation");
      if (!raw) return;
      const eval_: StoredEvaluation = JSON.parse(raw);

      setScores([
        { label: "Clarity",        score: eval_.clarity,        color: "#818cf8", glow: "rgba(129,140,248,0.18)" },
        { label: "Patience",       score: eval_.patience,       color: "#a78bfa", glow: "rgba(167,139,250,0.18)" },
        { label: "Overall",        score: eval_.overall,        color: "#60a5fa", glow: "rgba(96,165,250,0.18)"  },
        { label: "Simplification", score: eval_.simplification, color: "#c084fc", glow: "rgba(192,132,252,0.18)" },
      ]);

      if (eval_.strengths.length) setStrengths(eval_.strengths);
      if (eval_.weaknesses.length) setWeaknesses(eval_.weaknesses);
      if (eval_.evidenceQuotes.length) setQuotes(eval_.evidenceQuotes);
      setFromInterview(true);
    } catch {
      // If parsing fails, keep defaults
    }
  }, []);
  return (
    <main className="ds-page px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Ambient floating orbs */}
      <AmbientOrbs />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <PageTransition>
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 sm:space-y-10">
        {/* Page header */}
        <header className="text-center animate-fade-in-up">
          <Badge className="mb-3 animate-fade-in-up">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            {fromInterview ? "Your Results" : "Evaluation Complete"}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Performance{" "}
            <span className="bg-clip-text text-transparent ds-gradient-text">
              Analytics
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-400">
            AI-generated evaluation of teaching effectiveness across key competency areas.
          </p>
        </header>

        {/* ============================================================ */}
        {/*  1. SCORE CARDS                                               */}
        {/* ============================================================ */}
        <section>
          <SectionLabel label="Competency Scores" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
            {scores.map((s, i) => (
              <div key={s.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 120}ms` }}>
                <CircularScore
                  label={s.label}
                  score={s.score}
                  color={s.color}
                  glowColor={s.glow}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/*  2 & 3. STRENGTHS + WEAKNESSES                               */}
        {/* ============================================================ */}
        <section className="grid gap-3 sm:grid-cols-2 sm:gap-6">
          {/* Strengths */}
          <div
            className="rounded-2xl border border-emerald-400/20 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-xl hover-lift animate-fade-in-up delay-500"
            style={{ boxShadow: "0 0 30px rgba(52,211,153,0.1)" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <h2 className="text-base font-semibold text-emerald-200">Strengths</h2>
            </div>
            <ul className="space-y-3">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-300">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div
            className="rounded-2xl border border-orange-400/20 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-xl hover-lift animate-fade-in-up delay-600"
            style={{ boxShadow: "0 0 30px rgba(251,146,60,0.1)" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-400/15 text-orange-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </span>
              <h2 className="text-base font-semibold text-orange-200">Areas for Improvement</h2>
            </div>
            <ul className="space-y-3">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-300">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.7)]" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  4. EVIDENCE QUOTES                                           */}
        {/* ============================================================ */}
        <section>
          <SectionLabel label="Evidence Quotes" />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {quotes.map((q, i) => {
              const a = quoteAccentMap[q.accent] ?? quoteAccentMap.indigo;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border ${a.border} bg-white/[0.04] p-4 sm:p-5 backdrop-blur-xl hover-lift animate-fade-in-up`}
                  style={{ boxShadow: `0 0 24px ${a.glow}`, animationDelay: `${700 + i * 100}ms` }}
                >
                  <span
                    className={`mb-3 inline-block rounded-full ${a.bg} px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${a.text}`}
                  >
                    {q.tag}
                  </span>
                  <p className="text-sm italic leading-relaxed text-slate-300">{q.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Retake interview CTA */}
        {fromInterview && (
          <div className="flex justify-center animate-fade-in-up delay-800">
            <a
              href="/chat"
              onClick={() => localStorage.removeItem("interviewEvaluation")}
              className="ds-btn-secondary text-sm"
            >
              Retake Interview
            </a>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-6" />
      </div>
      </PageTransition>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny section label replaced by shared SectionLabel component       */
/* ------------------------------------------------------------------ */
