"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AmbientOrbs from "@/components/AmbientOrbs";
import PageTransition from "@/components/PageTransition";
import { Badge } from "@/components/ui";

/* ─── Types ────────────────────────────────────────────────── */
type Message = { role: "ai" | "user"; text: string };

interface Evaluation {
  overall: number;
  clarity: number;
  patience: number;
  simplification: number;
  warmth: number;
  fluency: number;
  strengths: string[];
  weaknesses: string[];
  evidenceQuotes: { text: string; tag: string; accent: string }[];
}

/* ─── Accent helpers ───────────────────────────────────────── */
const accentMap: Record<string, { badge: string; border: string; glow: string }> = {
  indigo: { badge: "bg-indigo-500/20 text-indigo-300", border: "border-indigo-500/30", glow: "shadow-indigo-500/10" },
  violet: { badge: "bg-violet-500/20 text-violet-300", border: "border-violet-500/30", glow: "shadow-violet-500/10" },
  emerald: { badge: "bg-emerald-500/20 text-emerald-300", border: "border-emerald-500/30", glow: "shadow-emerald-500/10" },
  amber: { badge: "bg-amber-500/20 text-amber-300", border: "border-amber-500/30", glow: "shadow-amber-500/10" },
  cyan: { badge: "bg-cyan-500/20 text-cyan-300", border: "border-cyan-500/30", glow: "shadow-cyan-500/10" },
};
function acc(key: string) { return accentMap[key] ?? accentMap.indigo; }

/* ─── Score ring (animated SVG) ────────────────────────────── */
function ScoreRing({ value, max = 10, size = 72, stroke = 5, color }: { value: number; max?: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        className="transition-all duration-[1.5s] ease-out"
      />
    </svg>
  );
}

/* ─── Section divider ──────────────────────────────────────── */
function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
      <span className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 via-white/5 to-transparent" />
      {label}
      <span className="h-px flex-1 bg-gradient-to-l from-violet-500/20 via-white/5 to-transparent" />
    </p>
  );
}

/* ─── Skeleton loader ──────────────────────────────────────── */
function ReportSkeleton() {
  return (
    <div className="ds-page p-3 sm:p-6">
      <AmbientOrbs />
      <div className="mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="h-20 w-20 animate-pulse rounded-full bg-white/5" />
        <div className="h-6 w-56 animate-pulse rounded-lg bg-white/5" />
        <div className="h-4 w-72 animate-pulse rounded bg-white/5" />
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/[0.03] border border-white/5" />
          ))}
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03] border border-white/5" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03] border border-white/5" />
        </div>
      </div>
    </div>
  );
}

/* ─── Score card colors (per trait) ────────────────────────── */
const traitColors: Record<string, { ring: string; gradient: string; icon: string }> = {
  Clarity:        { ring: "#818cf8", gradient: "from-indigo-500/20 to-indigo-600/5", icon: "" },
  Patience:       { ring: "#a78bfa", gradient: "from-violet-500/20 to-violet-600/5", icon: "" },
  Simplification: { ring: "#60a5fa", gradient: "from-blue-500/20 to-blue-600/5", icon: "" },
  Warmth:         { ring: "#f59e0b", gradient: "from-amber-500/20 to-amber-600/5", icon: "" },
  Fluency:        { ring: "#22d3ee", gradient: "from-cyan-500/20 to-cyan-600/5", icon: "" },
};

/* ═══════════════════════════════════════════════════════════ */
/*  Report Page                                                */
/* ═══════════════════════════════════════════════════════════ */
export default function ReportPage() {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isReEvaluating, setIsReEvaluating] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  /* Load data from localStorage */
  useEffect(() => {
    const evalRaw = localStorage.getItem("interviewEvaluation");
    const convRaw = localStorage.getItem("interviewConversation");
    if (evalRaw) setEvaluation(JSON.parse(evalRaw));
    if (convRaw) setConversation(JSON.parse(convRaw));
  }, []);

  /* Re-evaluate handler */
  const handleReEvaluate = async () => {
    if (conversation.length < 2) return;
    setIsReEvaluating(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
        localStorage.setItem("interviewEvaluation", JSON.stringify(data));
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setIsReEvaluating(false);
    }
  };

  if (!evaluation) return <ReportSkeleton />;

  const scores = [
    { label: "Clarity", value: evaluation.clarity },
    { label: "Patience", value: evaluation.patience },
    { label: "Simplification", value: evaluation.simplification },
    { label: "Warmth", value: evaluation.warmth ?? evaluation.overall },
    { label: "Fluency", value: evaluation.fluency ?? evaluation.overall },
  ];

  const overallGrade =
    evaluation.overall >= 8
      ? { label: "Excellent", color: "text-emerald-400", bg: "from-emerald-500/20", ring: "#34d399" }
      : evaluation.overall >= 6
        ? { label: "Good", color: "text-blue-400", bg: "from-blue-500/20", ring: "#60a5fa" }
        : evaluation.overall >= 4
          ? { label: "Fair", color: "text-amber-400", bg: "from-amber-500/20", ring: "#fbbf24" }
          : { label: "Needs Work", color: "text-red-400", bg: "from-red-500/20", ring: "#f87171" };

  return (
    <main className="ds-page p-3 sm:p-6">
      <AmbientOrbs />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      <PageTransition>
        <div className="relative mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">

          {/* ====== Hero Header ====== */}
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-2xl sm:p-10 animate-fade-in-up"
            style={{ boxShadow: "0 0 80px rgba(79,70,229,0.15), inset 0 1px 0 rgba(255,255,255,0.05)" }}
          >
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

            <Badge>Evaluation Complete</Badge>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Performance <span className="ds-gradient-text">Report</span>
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400 sm:text-base">
              Here&apos;s your detailed analysis from the AI tutor screening interview.
            </p>

            {/* ── Overall Score Ring ── */}
            <div className="mt-6 flex flex-col items-center gap-1 animate-scale-in">
              <div className="relative">
                <ScoreRing value={evaluation.overall} size={100} stroke={6} color={overallGrade.ring} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold tabular-nums ${overallGrade.color}`}>
                    {evaluation.overall}
                  </span>
                  <span className="text-[10px] text-slate-500">/10</span>
                </div>
              </div>
              <span className={`mt-1 text-sm font-semibold ${overallGrade.color}`}>{overallGrade.label}</span>
              <p className="text-xs text-slate-600">
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </header>

          {/* ====== Trait Score Cards ====== */}
          <section className="animate-fade-in-up delay-100">
            <SectionLabel label="Skill Breakdown" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
              {scores.map((s, idx) => {
                const tc = traitColors[s.label] ?? traitColors.Clarity;
                return (
                  <div
                    key={s.label}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 sm:p-5"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {/* Subtle gradient bg */}
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tc.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />

                    <div className="relative">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 sm:text-sm">{s.label}</span>
                        <span className="text-base sm:text-lg">{tc.icon}</span>
                      </div>

                      {/* Ring + score */}
                      <div className="flex items-center gap-3">
                        <ScoreRing value={s.value} size={48} stroke={4} color={tc.ring} />
                        <div>
                          <p className="text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl">
                            {s.value}
                          </p>
                          <p className="text-[10px] text-slate-600 sm:text-xs">/10</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all duration-[1.5s] ease-out"
                          style={{ width: `${(s.value / 10) * 100}%`, backgroundColor: tc.ring }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ====== Strengths & Weaknesses ====== */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in-up delay-200">
            {/* Strengths */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-[60px]" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-sm">✓</span>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Strengths</h3>
                </div>
                <ul className="space-y-2.5">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/15 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/5 blur-[60px]" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-sm">→</span>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">Areas for Improvement</h3>
                </div>
                <ul className="space-y-2.5">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ====== Evidence Quotes ====== */}
          {evaluation.evidenceQuotes.length > 0 && (
            <section className="animate-fade-in-up delay-300">
              <SectionLabel label="Evidence from Your Responses" />
              <div className="grid gap-3 sm:grid-cols-2">
                {evaluation.evidenceQuotes.map((q, i) => (
                  <div
                    key={i}
                    className={`group relative overflow-hidden rounded-2xl border ${acc(q.accent).border} bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${acc(q.accent).glow} sm:p-5`}
                  >
                    <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/[0.02] blur-[40px] transition-opacity group-hover:opacity-100 opacity-0" />
                    <span className={`mb-2.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${acc(q.accent).badge}`}>
                      {q.tag}
                    </span>
                    <p className="text-sm italic leading-relaxed text-slate-300/90">{q.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ====== Conversation Transcript (collapsible) ====== */}
          {conversation.length > 0 && (
            <section className="animate-fade-in-up delay-400">
              <button
                type="button"
                onClick={() => setShowTranscript((v) => !v)}
                className="group mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-400 backdrop-blur-xl transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-slate-300"
              >
                <svg
                  className={`h-4 w-4 transition-transform duration-300 ${showTranscript ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                {showTranscript ? "Hide Transcript" : "Show Interview Transcript"}
              </button>

              {showTranscript && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl animate-fade-in-up">
                  <div className="border-b border-white/5 px-5 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Full Conversation</p>
                  </div>
                  <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4 sm:p-5">
                    {conversation.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all sm:max-w-[75%] ${
                            msg.role === "ai"
                              ? "border border-indigo-300/15 bg-white/5 text-slate-300"
                              : "bg-gradient-to-br from-blue-500/90 to-violet-500/90 text-white shadow-lg shadow-indigo-500/10"
                          }`}
                        >
                          <span className={`mb-1 block text-[10px] font-semibold uppercase tracking-widest ${msg.role === "ai" ? "text-indigo-400/60" : "text-white/60"}`}>
                            {msg.role === "ai" ? "Interviewer" : "You"}
                          </span>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ====== Action buttons ====== */}
          <section className="flex flex-wrap items-center justify-center gap-3 pb-6 animate-fade-in-up delay-500 sm:gap-4">
            <a href="/dashboard" className="ds-btn-primary text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
              </svg>
              View Dashboard
            </a>
            <a href="/chat" className="ds-btn-secondary text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              Retake Interview
            </a>
            {conversation.length > 0 && (
              <button
                type="button"
                onClick={handleReEvaluate}
                disabled={isReEvaluating}
                className="ds-btn-secondary text-sm"
              >
                {isReEvaluating ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                    Re-evaluating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                    Re-evaluate
                  </>
                )}
              </button>
            )}
            <a href="/" className="ds-btn-secondary text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Back to Home
            </a>
          </section>
        </div>
      </PageTransition>
    </main>
  );
}
