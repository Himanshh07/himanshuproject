"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals text character-by-character for a typing animation.
 * When `enabled` is false the full text is returned immediately.
 */
export function useTypingEffect(
  text: string,
  enabled: boolean,
  speed = 18,
): { displayedText: string; isComplete: boolean } {
  const [charIndex, setCharIndex] = useState(enabled ? 0 : text.length);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !text) {
      setCharIndex(text.length);
      return;
    }

    setCharIndex(0);

    timerRef.current = setInterval(() => {
      setCharIndex((prev) => {
        const next = prev + 1;
        if (next >= text.length) {
          clearInterval(timerRef.current);
        }
        return Math.min(next, text.length);
      });
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [text, enabled, speed]);

  return {
    displayedText: text.slice(0, charIndex),
    isComplete: charIndex >= text.length,
  };
}
