"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight TTS hook using the browser SpeechSynthesis API.
 * - Cancels any in-progress speech before starting a new one.
 * - Picks a natural-sounding English voice when available.
 * - Exposes `isSpeaking` and fires `onEnd` when speech finishes.
 */
export function useTTS(onEnd?: () => void) {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const onEndRef = useRef(onEnd);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Keep callback ref fresh
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  /* Pick the best available English voice once voices are loaded */
  useEffect(() => {
    if (!supported) return;

    const pickVoice = () => {
      const voices = speechSynthesis.getVoices();
      const natural = voices.find(
        (v) => v.lang.startsWith("en") && /natural|neural/i.test(v.name),
      );
      const english = voices.find((v) => v.lang.startsWith("en") && !v.localService);
      const fallback = voices.find((v) => v.lang.startsWith("en"));
      voiceRef.current = natural ?? english ?? fallback ?? null;
    };

    pickVoice();
    speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => speechSynthesis.removeEventListener("voiceschanged", pickVoice);
  }, [supported]);

  /** Speak the given text. Cancels any previous utterance first. */
  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEndRef.current?.();
      };
      utterance.onerror = (e) => {
        // "interrupted" fires when cancel() is called — not a real error
        if ((e as SpeechSynthesisErrorEvent).error === "interrupted") return;
        setIsSpeaking(false);
      };
      // Chrome bug: cancel() + immediate speak() silently kills the new utterance.
      // A small delay fixes it reliably.
      setTimeout(() => speechSynthesis.speak(utterance), 60);
    },
    [supported],
  );

  /** Stop any in-progress speech immediately. */
  const stop = useCallback(() => {
    if (supported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [supported]);

  return { speak, stop, supported, isSpeaking };
}
