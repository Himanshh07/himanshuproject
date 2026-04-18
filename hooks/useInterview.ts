"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "ai" | "user";

export type ChatMessage = {
  id: number;
  role: Role;
  text: string;
  /** True for newly added AI messages — triggers typing animation */
  isNew?: boolean;
};

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: "ai",
  text: "Hello! I'm your AI Tutor Screener. I'll ask you a few questions to evaluate your teaching approach. Tell me — what topic would you like to teach today?",
};

/** Artificial delay to make AI responses feel more natural */
const RESPONSE_DELAY_MS = 400;

/** Fetch timeout — abort if server hasn't responded */
const INTERVIEW_TIMEOUT_MS = 15_000;
const EVALUATE_TIMEOUT_MS = 30_000;

/** Classify error types for user-friendly messaging */
function classifyError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") return "__abort__";
  if (err instanceof TypeError && /fetch|network/i.test((err as Error).message)) {
    return "Network error — please check your internet connection and try again.";
  }
  if (err instanceof Error) {
    if (err.message.includes("timed out")) return "The server is taking too long. Please try again.";
    if (err.message.includes("502") || err.message.includes("503"))
      return "AI service is temporarily unavailable. Please try again in a moment.";
    if (err.message.includes("429"))
      return "Too many requests — please wait a moment before trying again.";
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

/** Fetch with a timeout */
function fetchWithTimeout(
  url: string,
  init: RequestInit & { signal?: AbortSignal },
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Chain the external signal (if provided) to also abort our controller
  if (init.signal) {
    init.signal.addEventListener("abort", () => controller.abort());
  }

  return fetch(url, { ...init, signal: controller.signal })
    .then((res) => { clearTimeout(timer); return res; })
    .catch((err) => {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === "AbortError" && !init.signal?.aborted) {
        throw new Error("Request timed out — the server took too long to respond.");
      }
      throw err;
    });
}

export function useInterview() {
  const router = useRouter();

  /* ── Core state ─────────────────────────────────────────── */
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [inputShake, setInputShake] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  /* ── Refs for stable callbacks ──────────────────────────── */
  const idRef = useRef(2);
  const abortRef = useRef<AbortController | null>(null);
  const msgsRef = useRef(messages);
  const inputRef = useRef(input);
  const thinkingRef = useRef(isThinking);
  const lastFailedTextRef = useRef<string | null>(null);

  // Keep refs in sync
  msgsRef.current = messages;
  inputRef.current = input;
  thinkingRef.current = isThinking;

  // Cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ── Actions ────────────────────────────────────────────── */
  const clearError = useCallback(() => setError(null), []);

  /** Mark a message as "seen" so the typing animation stops */
  const markMessageSeen = useCallback((id: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isNew: false } : m)),
    );
  }, []);

  /** Retry the last failed message */
  const retryLastMessage = useCallback(() => {
    if (lastFailedTextRef.current) {
      const text = lastFailedTextRef.current;
      lastFailedTextRef.current = null;
      // Remove the last user message (the failed one)
      setMessages((prev) => prev.slice(0, -1));
      // Re-decrement the id counter so the retry gets a fresh id
      idRef.current--;
      sendMessageInternal(text);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Trigger input shake for empty-submit feedback */
  const shakeInput = useCallback(() => {
    setInputShake(true);
    setTimeout(() => setInputShake(false), 600);
  }, []);

  const sendMessageInternal = useCallback(
    async (overrideText?: string) => {
      const trimmed = (overrideText ?? inputRef.current).trim();
      if (thinkingRef.current) return;
      if (!trimmed) {
        setInputShake(true);
        setTimeout(() => setInputShake(false), 600);
        return;
      }

      setError(null);
      setEvalError(null);
      lastFailedTextRef.current = null;
      setInput("");
      setIsThinking(true);

      // Snapshot messages BEFORE any state updates to avoid stale/duplicate refs
      const prevMessages = [...msgsRef.current];

      const userMsgId = idRef.current++;
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        text: trimmed,
      };

      // Deduplicated add
      setMessages((prev) =>
        prev.some((m) => m.id === userMsgId) ? prev : [...prev, userMsg],
      );

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetchWithTimeout(
          "/api/interview",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: trimmed,
              history: prevMessages.map((m) => ({ role: m.role, text: m.text })),
            }),
            signal: controller.signal,
          },
          INTERVIEW_TIMEOUT_MS,
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        const data = await res.json();

        // Natural delay before showing AI response
        await new Promise((r) => setTimeout(r, RESPONSE_DELAY_MS));

        const aiMsgId = idRef.current++;
        const aiMsg: ChatMessage = {
          id: aiMsgId,
          role: "ai",
          text: data.question,
          isNew: true,
        };

        // Deduplicated add
        setMessages((prev) =>
          prev.some((m) => m.id === aiMsgId) ? prev : [...prev, aiMsg],
        );
        setIsThinking(false);

        if (data.questionNumber) setQuestionNumber(data.questionNumber);
        if (data.totalQuestions) setTotalQuestions(data.totalQuestions);

        if (data.done) {
          setIsDone(true);
          setIsEvaluating(true);

          // Build full conversation from pre-send snapshot + new messages
          const allMessages = [
            ...prevMessages,
            { id: userMsgId, role: "user" as const, text: trimmed },
            { id: aiMsgId, role: "ai" as const, text: data.question },
          ];

          try {
            const evalRes = await fetchWithTimeout(
              "/api/evaluate",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  conversation: allMessages.map((m) => ({
                    role: m.role,
                    text: m.text,
                  })),
                }),
              },
              EVALUATE_TIMEOUT_MS,
            );
            if (evalRes.ok) {
              const evaluation = await evalRes.json();
              localStorage.setItem(
                "interviewEvaluation",
                JSON.stringify(evaluation),
              );
              localStorage.setItem(
                "interviewConversation",
                JSON.stringify(
                  allMessages.map((m) => ({ role: m.role, text: m.text })),
                ),
              );
              // Brief pause before navigating — let the user absorb completion
              setTimeout(() => router.push("/report"), 4000);
              return;
            }
            // Non-OK eval response — set eval error
            setEvalError("Evaluation didn't complete. You can view partial results or retry.");
          } catch (evalErr) {
            const evalMsg = classifyError(evalErr);
            setEvalError(
              evalMsg === "__abort__"
                ? "Evaluation was cancelled."
                : `Evaluation failed: ${evalMsg}`,
            );
          } finally {
            setIsEvaluating(false);
          }
        }
      } catch (err: unknown) {
        const msg = classifyError(err);
        if (msg === "__abort__") return;
        setError(msg);
        lastFailedTextRef.current = trimmed;
        setIsThinking(false);
      }
    },
    [router],
  );

  // Public sendMessage wraps the internal one
  const sendMessage = sendMessageInternal;

  return {
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
    shakeInput,
    markMessageSeen,
    canSend: input.trim().length > 0 && !isThinking && !isDone,
  };
}
