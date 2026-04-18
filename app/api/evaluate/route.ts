import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Message {
  role: "ai" | "user";
  text: string;
}

interface EvaluateBody {
  conversation: Message[];
}

interface EvaluationResult {
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

/* ------------------------------------------------------------------ */
/*  Interview flow reference (for follow-up detection)                 */
/* ------------------------------------------------------------------ */
const FOLLOW_UP_TEXTS = [
  "Could you be a bit more specific? For example, would you start with a question, a real-world example, or a visual? I'd love to hear the exact words you'd use.",
  "That's a start, but could you simplify it further? Pretend the student is 10 years old \u2014 how would you explain it using everyday language?",
  "Could you make the example more concrete? I'd love to hear the exact analogy or story you'd tell the student.",
  "I'd like to hear more about your emotional approach. What exact words would you use to keep their confidence up while correcting the mistake?",
  "Can you give me a specific thing you'd say or do in the first minute to break the ice? Something that would make them smile or open up.",
  "That's still a bit complex. Can you strip it down even further? Think of explaining it to a kid who's never seen a textbook.",
  "Could you give a specific question you'd literally ask them in the session, rather than a general strategy?",
  "Can you walk me through what you'd actually say to smoothly transition to more advanced material?",
  "That makes sense. But what would you literally say? Give me the exact words you'd use to redirect them.",
  "Nice thought — can you be more specific about what you'd actually say? A closing sentence or a quick challenge you'd leave them with?",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function clamp(n: number): number {
  return Math.round(Math.max(3, Math.min(10, n)) * 10) / 10;
}

/**
 * Evaluate using OpenAI when API key is available.
 */
async function evaluateWithOpenAI(
  conversation: Message[],
  apiKey: string,
): Promise<EvaluationResult> {
  const systemPrompt = `You are an expert teaching evaluator. Analyze the following interview conversation between an AI interviewer and a teaching candidate.

Evaluate the candidate on five dimensions (each scored 1-10):
1. **Clarity** — How clearly do they explain concepts? Do they use good examples?
2. **Patience** — How well do they handle confusion, frustration, and repeated mistakes?
3. **Simplification** — Can they break down complex ideas for younger/struggling learners?
4. **Warmth** — Do they create a welcoming, encouraging atmosphere? Can they build rapport?
5. **Fluency** — How smoothly do they adapt to unexpected situations and transition between topics?

Also provide:
- An overall score (average of the five, 1-10)
- 3-5 specific strengths observed (one sentence each)
- 3-5 specific areas for improvement (one sentence each)
- 2-5 direct quotes from the candidate's responses that are evidence of their teaching ability (good or bad)

For each quote, assign:
- a short tag (e.g. "Strong analogy", "Needs precision", "Good encouragement")
- an accent color: one of "indigo", "violet", "emerald", "amber", or "cyan"

Respond with valid JSON ONLY (no markdown fences):
{
  "overall": number,
  "clarity": number,
  "patience": number,
  "simplification": number,
  "warmth": number,
  "fluency": number,
  "strengths": ["string", ...],
  "weaknesses": ["string", ...],
  "evidenceQuotes": [{ "text": "quoted text", "tag": "tag", "accent": "color" }, ...]
}`;

  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: `Here is the full interview conversation:\n\n${conversation
        .map(
          (m) =>
            `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.text}`,
        )
        .join("\n\n")}`,
    },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: chatMessages,
      max_tokens: 800,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  let raw = data.choices?.[0]?.message?.content?.trim() ?? "";
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  return JSON.parse(raw) as EvaluationResult;
}

/**
 * Fallback heuristic evaluation (no API key).
 */
function evaluateLocally(conversation: Message[]): EvaluationResult {
  const userAnswers = conversation
    .filter((m) => m.role === "user")
    .slice(1); // skip topic selection message

  // Count follow-ups triggered
  let followUpsTriggered = 0;
  for (const msg of conversation) {
    if (msg.role === "ai" && FOLLOW_UP_TEXTS.includes(msg.text)) {
      followUpsTriggered++;
    }
  }

  // Answer quality metrics
  const avgLen =
    userAnswers.reduce((s, m) => s + m.text.length, 0) /
    (userAnswers.length || 1);
  const longAnswers = userAnswers.filter((m) => m.text.length > 80).length;
  const veryLongAnswers = userAnswers.filter((m) => m.text.length > 150).length;

  // Base score from answer detail level
  let base: number;
  if (avgLen > 200) base = 9;
  else if (avgLen > 140) base = 8;
  else if (avgLen > 100) base = 7;
  else if (avgLen > 60) base = 6;
  else base = 5;

  // Bonuses / penalties
  base = base + longAnswers * 0.3 + veryLongAnswers * 0.2 - followUpsTriggered * 0.6;

  const clarity = clamp(base + 0.3);
  const patience = clamp(base - 0.2);
  const simplification = clamp(base + 0.1);
  const warmth = clamp(base + 0.2);
  const fluency = clamp(base - 0.1);
  const overall = clamp(
    (clarity + patience + simplification + warmth + fluency) / 5,
  );

  // --- Strengths ---
  const strengths: string[] = [];
  if (clarity >= 7) strengths.push("Uses clear, relatable explanations to convey concepts.");
  if (patience >= 7) strengths.push("Maintains a calm and encouraging tone throughout.");
  if (simplification >= 7) strengths.push("Breaks complex problems into manageable steps.");
  if (warmth >= 7) strengths.push("Creates a warm, welcoming atmosphere that builds student trust.");
  if (fluency >= 7) strengths.push("Adapts smoothly to unexpected situations and transitions naturally.");
  if (longAnswers >= 3) strengths.push("Provides detailed, thorough responses.");
  if (followUpsTriggered === 0) strengths.push("Consistently gave well-developed first answers.");
  if (avgLen > 120) strengths.push("Demonstrates depth of thought in responses.");
  if (strengths.length === 0) strengths.push("Showed willingness to engage with questions.");

  // --- Weaknesses ---
  const weaknesses: string[] = [];
  if (clarity < 7) weaknesses.push("Could provide more structured explanations.");
  if (patience < 7) weaknesses.push("Could show more patience with struggling students.");
  if (simplification < 7) weaknesses.push("Could simplify explanations further for younger learners.");
  if (warmth < 7) weaknesses.push("Could be warmer and more encouraging in building student rapport.");
  if (fluency < 7) weaknesses.push("Could improve adaptability when the lesson doesn't go as planned.");
  if (followUpsTriggered >= 2) weaknesses.push("Initial answers tended to be brief — more detail would help.");
  if (avgLen < 80) weaknesses.push("Responses could be more detailed and specific.");
  if (weaknesses.length === 0) weaknesses.push("Minor: could include more real-world examples.");

  // --- Evidence quotes ---
  const accentCycle = ["indigo", "violet", "emerald", "amber", "cyan"];
  const tagOptions = [
    "Teaching approach",
    "Explanation style",
    "Subject knowledge",
    "Student handling",
    "Warmth & rapport",
    "Simplification",
    "Clarity check",
    "Adaptability",
    "Patience",
    "Session wrap-up",
  ];
  const evidenceQuotes = userAnswers
    .filter((m) => m.text.length > 30)
    .slice(0, 5)
    .map((m, i) => ({
      text:
        m.text.length > 140
          ? `\u201c${m.text.slice(0, 137)}...\u201d`
          : `\u201c${m.text}\u201d`,
      tag: tagOptions[i] ?? "Response",
      accent: accentCycle[i % accentCycle.length],
    }));

  return {
    overall,
    clarity,
    patience,
    simplification,
    warmth,
    fluency,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    evidenceQuotes,
  };
}

/* ------------------------------------------------------------------ */
/*  POST /api/evaluate                                                 */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvaluateBody;
    const { conversation } = body;

    if (!Array.isArray(conversation) || conversation.length < 2) {
      return NextResponse.json(
        { error: "A conversation with at least 2 messages is required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    let evaluation: EvaluationResult;

    if (apiKey) {
      try {
        evaluation = await evaluateWithOpenAI(conversation, apiKey);
      } catch (err) {
        console.error("OpenAI evaluation failed, falling back to local:", err);
        evaluation = evaluateLocally(conversation);
      }
    } else {
      // Simulate processing time
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
      evaluation = evaluateLocally(conversation);
    }

    return NextResponse.json(evaluation);
  } catch (err) {
    console.error("/api/evaluate error:", err);
    return NextResponse.json(
      { error: "Evaluation failed." },
      { status: 500 },
    );
  }
}
