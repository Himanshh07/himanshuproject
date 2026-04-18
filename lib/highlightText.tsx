import { type ReactNode } from "react";

/**
 * Highlights meaningful patterns in AI response text:
 * - Numbers & percentages → cyan
 * - Quoted text → violet italic
 */
export function highlightText(text: string): ReactNode {
  if (!text) return null;

  // Split by numbers/percentages and "quoted strings" — capturing group keeps matches
  const parts = text.split(/(\d+%?|"[^"]*")/g);

  return parts.map((part, i) => {
    if (/^\d+%?$/.test(part)) {
      return (
        <span key={i} className="text-cyan-300 font-medium">
          {part}
        </span>
      );
    }
    if (/^"[^"]*"$/.test(part)) {
      return (
        <span key={i} className="text-violet-300/80 italic">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
