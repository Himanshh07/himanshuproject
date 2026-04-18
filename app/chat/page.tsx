"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import type { MicState } from "@/components/MicButton";
import { Badge } from "@/components/ui";
import AmbientOrbs from "@/components/AmbientOrbs";
import PageTransition from "@/components/PageTransition";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useInterview, type ChatMessage } from "@/hooks/useInterview";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import { useTTS } from "@/hooks/useTTS";
import { highlightText } from "@/lib/highlightText";

/* ── Chat Bubble (per-message typing + highlighting) ─────── */

function ChatBubble({
  message,
  onTypingComplete,
  onTextUpdate,
}: {
  message: ChatMessage;
  onTypingComplete?: (id: number) => void;
  onTextUpdate?: () => void;
}) {
  const isAi = message.role === "ai";
  const shouldType = isAi && !!message.isNew;

  const { displayedText, isComplete } = useTypingEffect(
    message.text,
    shouldType,
    18,
  );

  // Notify parent when typing animation finishes
  useEffect(() => {
    if (isComplete && shouldType) {
      onTypingComplete?.(message.id);
    }
  }, [isComplete, shouldType, message.id, onTypingComplete]);

  // Keep chat scrolled while characters appear
  useEffect(() => {
    if (shouldType && !isComplete) {
      onTextUpdate?.();
    }
  }, [displayedText, shouldType, isComplete, onTextUpdate]);

  const textContent = shouldType ? displayedText : message.text;

  return (
    <div
      className={`flex ${
        isAi
          ? "justify-start animate-slide-in-left"
          : "justify-end animate-slide-in-right"
      }`}
    >
      <div
        className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-relaxed sm:max-w-[72%] sm:text-[15px] msg-bubble ${
          isAi
            ? "border border-indigo-300/20 bg-white/5 text-slate-100"
            : "text-white"
        }`}
        style={
          isAi
            ? {
                boxShadow:
                  "0 0 20px rgba(99,102,241,0.2), inset 0 0 20px rgba(255,255,255,0.02)",
                backdropFilter: "blur(12px)",
              }
            : {
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(139,92,246,0.95) 100%)",
                boxShadow: "0 0 24px rgba(99,102,241,0.45)",
              }
        }
      >
        {isAi ? highlightText(textContent) : textContent}
        {/* Blinking cursor during typing */}
        {shouldType && !isComplete && (
          <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-indigo-300 align-middle" />
        )}
      </div>
    </div>
  );
}

/* ── Chat Page ────────────────────────────────────────────── */

export default function ChatPage() {
  const {
    messages,
    input,
    setInput,
    isThinking,
    isDone,
    isEvaluating,
    questionNumber,
    totalQuestions,
    error,
    evalError,
    inputShake,
    isOnline,
    clearError,
    sendMessage,
    retryLastMessage,
    markMessageSeen,
  } = useInterview();

  const [micError, setMicError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingSendRef = useRef<string | null>(null);

  /* ── 5-second countdown before interview starts ────────── */
  const [countdown, setCountdown] = useState(5);
  const countdownDone = countdown <= 0;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Speech recognition (declared first so TTS can reference it)
  const {
    supported: speechSupported,
    listening: isListening,
    transcript,
    toggle: toggleListening,
    start: startListening,
  } = useSpeechRecognition({
    onInterim: (text) => setInput(text),
    onFinal: (text) => {
      setInput(text);
      setIsProcessing(true);
      pendingSendRef.current = text;
    },
    onError: (msg) => {
      setMicError(msg);
      setTimeout(() => setMicError(null), 8000);
    },
  });

  // Text-to-speech — auto-start mic when AI finishes speaking
  const handleTTSEnd = useCallback(() => {
    if (!isDone && speechSupported) {
      setTimeout(() => startListening(), 300);
    }
  }, [isDone, speechSupported, startListening]);

  const { speak, stop: stopTTS, isSpeaking } = useTTS(handleTTSEnd);
  const spokenIdsRef = useRef<Set<number>>(new Set());

  const micState: MicState =
    isThinking || isDone || isProcessing || isSpeaking ? "disabled" : isListening ? "recording" : "idle";

  // Speak the first AI message once countdown finishes
  useEffect(() => {
    if (!countdownDone) return;
    const first = messages[0];
    if (first?.role === "ai" && !spokenIdsRef.current.has(first.id)) {
      spokenIdsRef.current.add(first.id);
      speak(first.text);
    }
    // Only run when countdown finishes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownDone]);

  // Speak new AI messages automatically (skip the first — handled above)
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "ai" && last.isNew && !spokenIdsRef.current.has(last.id)) {
      spokenIdsRef.current.add(last.id);
      speak(last.text);
    }
  }, [messages, speak]);

  // Stop speech on unmount
  useEffect(() => () => stopTTS(), [stopTTS]);

  /* ── Smooth scroll to bottom ────────────────────────────── */
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  // Scroll on new messages / thinking state change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  // Auto-send from speech recognition (brief delay for "Processing..." UI)
  useEffect(() => {
    if (isProcessing && pendingSendRef.current && !isThinking && !isDone) {
      const text = pendingSendRef.current;
      pendingSendRef.current = null;
      const timer = setTimeout(() => {
        setIsProcessing(false);
        sendMessage(text);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, isThinking, isDone, sendMessage]);

  return (
    <main className="ds-page p-3 sm:p-6">
      <AmbientOrbs />

      {/* ── 5-second countdown overlay ───────────────────── */}
      {!countdownDone && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a1a]/95 backdrop-blur-xl">
          {/* Animated ring behind the number */}
          <div className="relative flex items-center justify-center">
            <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="rgba(99,102,241,0.15)"
                strokeWidth="6"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="url(#countdownGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - countdown / 5)}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="countdownGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-6xl font-bold tabular-nums text-white drop-shadow-[0_0_30px_rgba(129,140,248,0.6)]">
              {countdown}
            </span>
          </div>
          <h2 className="mt-8 text-xl font-semibold text-slate-100 sm:text-2xl">
            Get Ready
          </h2>
          <p className="mt-2 max-w-xs text-center text-sm text-slate-400 sm:text-base">
            Your AI interview is about to begin. Prepare yourself!
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
            Make sure your microphone is ready
          </div>
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/90 px-4 py-2 text-sm font-medium text-black backdrop-blur-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 0 1 0 12.728M5.636 18.364a9 9 0 0 1 0-12.728m2.121 2.121a5.5 5.5 0 0 1 7.778 0m-7.778 0L12 12m0 0 4.243-4.243" />
          </svg>
          You’re offline — reconnect to continue the interview
        </div>
      )}

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
        <section className="relative mx-auto flex h-[calc(100dvh-1.5rem)] sm:h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_70px_rgba(79,70,229,0.25)] backdrop-blur-2xl animate-scale-in">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-100">
                Neural Chat
              </h1>
              <p className="text-sm text-slate-400">
                Futuristic AI assistant interface
              </p>
            </div>
            <div className="flex items-center gap-3">
              {questionNumber > 0 && !isDone && (
                <span className="text-xs text-slate-400 tabular-nums">
                  Q{questionNumber}
                  <span className="text-slate-600">/</span>
                  {totalQuestions}
                </span>
              )}
              <Badge>{isDone ? "✓ Complete" : "Live Session"}</Badge>
            </div>
          </header>

          {/* Scrollable chat area */}
          <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:space-y-5 sm:px-6 sm:py-5">
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onTypingComplete={markMessageSeen}
                onTextUpdate={scrollToBottom}
              />
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex justify-start animate-slide-in-left">
                <div
                  className="rounded-3xl border border-indigo-300/20 bg-white/5 px-4 py-3"
                  style={{
                    boxShadow: "0 0 20px rgba(99,102,241,0.2)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <p className="mb-2 text-xs tracking-wide text-indigo-300">
                    Thinking...
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300" />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-violet-300"
                      style={{ animationDelay: "140ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-300"
                      style={{ animationDelay: "280ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex justify-start animate-slide-in-left">
                <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300 backdrop-blur-xl">
                  <p className="mb-1 font-medium">Failed to get response</p>
                  <p className="text-xs text-red-400/80">{error}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={retryLastMessage}
                      className="text-xs font-medium text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-xs text-red-300 underline underline-offset-2 hover:text-red-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll sentinel */}
            <div ref={bottomRef} />
          </div>

          {/* Footer input bar */}
          <footer className="border-t border-white/10 px-3 py-3 sm:px-6 sm:py-4 pb-safe">
            {/* Evaluating spinner */}
            {isEvaluating && (
              <div className="flex flex-col items-center gap-3 py-4 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  <p className="text-sm text-slate-300">
                    Analyzing your responses...
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Generating your evaluation report
                </p>
              </div>
            )}

            {/* Evaluation error */}
            {evalError && !isEvaluating && (
              <div className="flex flex-col items-center gap-3 py-3 animate-fade-in-up">
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-300 backdrop-blur-xl">
                  <p className="mb-1 font-medium">Evaluation Issue</p>
                  <p className="text-xs text-amber-400/80">{evalError}</p>
                </div>
                <a href="/report" className="ds-btn-primary text-sm">
                  View Report Anyway
                </a>
              </div>
            )}

            {/* Interview complete banner (fallback if auto-redirect didn't fire) */}
            {isDone && !isEvaluating && !evalError && (
              <div className="flex flex-col items-center gap-3 py-2 animate-fade-in-up">
                <p className="text-sm text-slate-400">
                  Interview complete — see your evaluation
                </p>
                <a href="/report" className="ds-btn-primary text-sm">
                  <svg
                    className="h-4 w-4"
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
                  View Report
                </a>
              </div>
            )}

            {/* Active input area (hidden when done) */}
            {!isDone && (
              <>
                {/* AI speaking indicator */}
                {isSpeaking && !isListening && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-indigo-300 animate-fade-in-up">
                    <span className="relative inline-flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400" />
                    </span>
                    <span className="tracking-wide">AI is speaking...</span>
                    <button
                      type="button"
                      onClick={stopTTS}
                      className="ml-1 text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300"
                    >
                      Skip
                    </button>
                  </div>
                )}

                {/* Listening indicator */}
                {isListening && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-cyan-300 animate-fade-in-up">
                    <span className="relative inline-flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-80" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    </span>
                    <span className="tracking-wide">
                      {transcript || "Listening..."}
                    </span>
                    {!transcript && (
                      <>
                        <span className="h-1 w-5 animate-pulse rounded bg-cyan-300/70" />
                        <span
                          className="h-1 w-8 animate-pulse rounded bg-indigo-300/70"
                          style={{ animationDelay: "120ms" }}
                        />
                        <span
                          className="h-1 w-4 animate-pulse rounded bg-violet-300/70"
                          style={{ animationDelay: "240ms" }}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* Processing indicator (after speech ends, before send) */}
                {isProcessing && !isListening && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-violet-300 animate-fade-in-up">
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                    <span className="tracking-wide">Processing...</span>
                  </div>
                )}

                {/* Mic error */}
                {micError && !isListening && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-amber-300/80 animate-fade-in-up">
                    <svg
                      className="h-3.5 w-3.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                      />
                    </svg>
                    {micError}
                  </div>
                )}

                {/* Voice-first prompt when idle */}
                {!isListening && !isProcessing && !isSpeaking && !isThinking && (
                  <p className="mb-2 text-center text-xs text-slate-500">
                    Tap the mic to speak your answer
                  </p>
                )}

                <div className={`flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-xl transition-transform ${inputShake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
                  {/* Glowing mic button — sole input method */}
                  <MicButton
                    state={micState}
                    onClick={() => {
                      if (!speechSupported) {
                        setMicError(
                          "Speech recognition is not supported in this browser. Try Chrome or Edge.",
                        );
                        setTimeout(() => setMicError(null), 4000);
                        return;
                      }
                      stopTTS(); // stop AI speech when user starts talking
                      toggleListening();
                    }}
                  />
                </div>
              </>
            )}
          </footer>
        </section>
      </PageTransition>
    </main>
  );
}
