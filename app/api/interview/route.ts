import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Message {
  role: "ai" | "user";
  text: string;
}

interface RequestBody {
  message: string;
  history: Message[];
}

interface InterviewEvaluation {
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

interface InterviewResponse {
  question: string;
  done: boolean;
  questionNumber: number;
  totalQuestions: number;
  evaluation?: InterviewEvaluation;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
/** How many questions to actually ask (picked from the pool of 10) */
const NUM_QUESTIONS = 8;

/* ------------------------------------------------------------------ */
/*  Question pool (10 total — 8 will be randomly selected & shuffled)  */
/* ------------------------------------------------------------------ */
type QuestionStep = {
  question: string;
  followUp: string;
  trait: "clarity" | "patience" | "simplification" | "warmth" | "fluency";
  category: "subject" | "quality";
};

const QUESTION_POOL: QuestionStep[] = [
  /* ── Subject-specific questions (1-3) ── adapt to the topic they chose ── */
  {
    question:
      "Great topic! Walk me through how you'd open the first 2 minutes of this lesson. What would you say or show to hook the student's attention?",
    followUp:
      "Could you be a bit more specific? For example, would you start with a question, a real-world example, or a visual? I'd love to hear the exact words you'd use.",
    trait: "clarity",
    category: "subject",
  },
  {
    question:
      "Now imagine the student says: 'I don't get it — why do we do it this way?' How would you explain the core idea behind this topic in the simplest possible way?",
    followUp:
      "That's a start, but could you simplify it further? Pretend the student is 10 years old — how would you explain it using everyday language?",
    trait: "simplification",
    category: "subject",
  },
  {
    question:
      "How would you connect this topic to something the student already knows or cares about? Give me a specific analogy or real-world example you'd use.",
    followUp:
      "Could you make the example more concrete? I'd love to hear the exact analogy or story you'd tell the student.",
    trait: "clarity",
    category: "subject",
  },
  /* ── Teaching quality questions (4-10) ──────────────────────────────── */
  {
    question:
      "The student keeps making the same mistake over and over. They're getting frustrated and saying 'I'm just bad at this.' How do you handle it?",
    followUp:
      "I'd like to hear more about your emotional approach. What exact words would you use to keep their confidence up while correcting the mistake?",
    trait: "patience",
    category: "quality",
  },
  {
    question:
      "Imagine it's your first session with a very shy student who barely responds. How would you build rapport and make them feel comfortable?",
    followUp:
      "Can you give me a specific thing you'd say or do in the first minute to break the ice? Something that would make them smile or open up.",
    trait: "warmth",
    category: "quality",
  },
  {
    question:
      "Take one of the hardest concepts from your topic and explain it as if the student is 8 years old. Use simple words, no jargon.",
    followUp:
      "That's still a bit complex. Can you strip it down even further? Think of explaining it to a kid who's never seen a textbook.",
    trait: "simplification",
    category: "quality",
  },
  {
    question:
      "How would you check that the student actually understood the concept — not just memorized the steps? Give me a concrete question or activity you'd use.",
    followUp:
      "Could you give a specific question you'd literally ask them in the session, rather than a general strategy?",
    trait: "clarity",
    category: "quality",
  },
  {
    question:
      "You're mid-lesson and realize the student already knows what you're teaching. How do you adapt on the fly without making them feel like you wasted their time?",
    followUp:
      "Can you walk me through what you'd actually say to smoothly transition to more advanced material?",
    trait: "fluency",
    category: "quality",
  },
  {
    question:
      "The student keeps going off-topic — talking about their day, games, anything but the lesson. How do you gently bring them back without killing their energy?",
    followUp:
      "That makes sense. But what would you literally say? Give me the exact words you'd use to redirect them.",
    trait: "patience",
    category: "quality",
  },
  {
    question:
      "Last one! If you only had 30 seconds left in the session, how would you wrap up to make sure the student leaves feeling confident, excited, and wanting to come back?",
    followUp:
      "Nice thought — can you be more specific about what you'd actually say? A closing sentence or a quick challenge you'd leave them with?",
    trait: "warmth",
    category: "quality",
  },
];

const DONE_MESSAGE =
  "That wraps up our interview! 🎉 You've answered all the questions. Head over to the Dashboard to see your detailed performance analytics.";

/* ------------------------------------------------------------------ */
/*  Seeded shuffle — deterministic per session (topic-based seed)      */
/* ------------------------------------------------------------------ */

/** Simple string → 32-bit hash */
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Seeded pseudo-random number generator (mulberry32) */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick NUM_QUESTIONS from the pool, shuffled deterministically.
 * Guarantees at least 2 subject-specific and at least 5 quality questions.
 */
function getShuffledFlow(topic: string): QuestionStep[] {
  const seed = hashString(topic.toLowerCase().trim());
  const rng = seededRandom(seed);

  const subjectQs = QUESTION_POOL.filter((q) => q.category === "subject");
  const qualityQs = QUESTION_POOL.filter((q) => q.category === "quality");

  // Fisher-Yates shuffle using seeded RNG
  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const shuffledSubject = shuffle(subjectQs);
  const shuffledQuality = shuffle(qualityQs);

  // Pick 2-3 subject + rest quality to total NUM_QUESTIONS
  const subjectCount = Math.min(3, shuffledSubject.length, Math.max(2, Math.floor(rng() * 2) + 2));
  const qualityCount = NUM_QUESTIONS - subjectCount;

  const picked = [
    ...shuffledSubject.slice(0, subjectCount),
    ...shuffledQuality.slice(0, qualityCount),
  ];

  // Final shuffle of all picked questions
  return shuffle(picked);
}

/** Extract the topic (first user message) from history */
function extractTopic(history: Message[]): string | null {
  for (const msg of history) {
    if (msg.role === "user") return msg.text;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Detect if an answer is vague (too short or generic). */
function isVagueAnswer(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 25) return true;
  const vaguePatterns = [
    /^(i don'?t know|idk|not sure|maybe|i guess|i think so|yeah|yes|no|ok|okay)\.?$/i,
    /^(i would just|just|basically)[\s,]/i,
  ];
  return vaguePatterns.some((p) => p.test(trimmed));
}

/**
 * Walk through conversation history and determine which question
 * index we are on. Accounts for follow-ups not advancing the counter.
 *
 * Returns { questionIndex, lastAiWasFollowUp, topicReceived }
 */
function getInterviewProgress(history: Message[], flow: QuestionStep[]) {
  let questionIndex = 0;
  let topicReceived = false;
  let lastAiWasFollowUp = false;

  for (const msg of history) {
    if (msg.role === "user") {
      if (!topicReceived) {
        topicReceived = true; // first user msg = topic selection
        continue;
      }
      // This is an answer to an interview question
      if (lastAiWasFollowUp || !isVagueAnswer(msg.text)) {
        questionIndex++;
      }
      lastAiWasFollowUp = false;
    } else if (msg.role === "ai" && topicReceived && questionIndex < flow.length) {
      const step = flow[questionIndex];
      if (step) {
        lastAiWasFollowUp = msg.text === step.followUp;
      }
    }
  }

  return { questionIndex, lastAiWasFollowUp, topicReceived };
}

/**
 * Evaluate interview performance from conversation history.
 */
function evaluateInterview(
  history: Message[],
  finalMessage: string,
): InterviewEvaluation {
  const allMsgs = [...history, { role: "user" as const, text: finalMessage }];
  const userAnswers = allMsgs.filter((m) => m.role === "user").slice(1); // skip topic

  // Count follow-ups triggered (match against entire pool)
  let followUpsTriggered = 0;
  const allFollowUps = QUESTION_POOL.map((s) => s.followUp);
  for (const msg of history) {
    if (msg.role === "ai" && allFollowUps.includes(msg.text)) {
      followUpsTriggered++;
    }
  }

  // Average answer length
  const avgLen =
    userAnswers.reduce((s, m) => s + m.text.length, 0) /
    (userAnswers.length || 1);
  const longAnswers = userAnswers.filter((m) => m.text.length > 80).length;

  // Base score from answer detail level (scale 0-10)
  let base: number;
  if (avgLen > 200) base = 9;
  else if (avgLen > 140) base = 8;
  else if (avgLen > 100) base = 7;
  else if (avgLen > 60) base = 6;
  else base = 5;

  // Bonuses and penalties
  base = base + longAnswers * 0.3 - followUpsTriggered * 0.6;

  const clamp = (n: number) =>
    Math.round(Math.max(3, Math.min(10, n)) * 10) / 10;

  const clarity = clamp(base + 0.3);
  const patience = clamp(base - 0.2);
  const simplification = clamp(base + 0.1);
  const warmth = clamp(base + 0.2);
  const fluency = clamp(base - 0.1);
  const overall = clamp(
    (clarity + patience + simplification + warmth + fluency) / 5,
  );

  // Strengths
  const strengthPool: string[] = [];
  if (clarity >= 7)
    strengthPool.push(
      "Uses clear, relatable explanations to convey concepts.",
    );
  if (patience >= 7)
    strengthPool.push(
      "Maintains a calm and encouraging tone throughout.",
    );
  if (simplification >= 7)
    strengthPool.push(
      "Breaks complex problems into manageable steps.",
    );
  if (warmth >= 7)
    strengthPool.push(
      "Creates a warm, welcoming atmosphere that builds student trust.",
    );
  if (fluency >= 7)
    strengthPool.push(
      "Adapts smoothly to unexpected situations and transitions naturally.",
    );
  if (longAnswers >= 3)
    strengthPool.push("Provides detailed, thorough responses.");
  if (followUpsTriggered === 0)
    strengthPool.push("Consistently gave well-developed first answers.");
  if (avgLen > 120)
    strengthPool.push("Demonstrates depth of thought in responses.");
  if (strengthPool.length === 0)
    strengthPool.push("Showed willingness to engage with questions.");

  // Weaknesses
  const weaknessPool: string[] = [];
  if (clarity < 7)
    weaknessPool.push(
      "Could provide more structured explanations.",
    );
  if (patience < 7)
    weaknessPool.push(
      "Could show more patience with struggling students.",
    );
  if (simplification < 7)
    weaknessPool.push("Could simplify explanations further for younger learners.");
  if (warmth < 7)
    weaknessPool.push("Could be warmer and more encouraging in building student rapport.");
  if (fluency < 7)
    weaknessPool.push("Could improve adaptability when the lesson doesn't go as planned.");
  if (followUpsTriggered >= 2)
    weaknessPool.push("Initial answers tended to be brief — more detail would help.");
  if (avgLen < 80)
    weaknessPool.push("Responses could be more detailed and specific.");
  if (weaknessPool.length === 0)
    weaknessPool.push("Minor: could include more real-world examples.");

  // Evidence quotes — pick up to 5 user answers
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
    strengths: strengthPool.slice(0, 5),
    weaknesses: weaknessPool.slice(0, 5),
    evidenceQuotes,
  };
}

/* ------------------------------------------------------------------ */
/*  POST /api/interview                                                */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body — expected JSON." },
        { status: 400 },
      );
    }

    const { message, history } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Please type a message before sending." },
        { status: 400 },
      );
    }

    // Guard against excessively long messages
    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 5000 characters." },
        { status: 400 },
      );
    }

    if (!Array.isArray(history)) {
      return NextResponse.json(
        { error: "History must be an array." },
        { status: 400 },
      );
    }

    // Guard against excessively long history (possible abuse)
    if (history.length > 50) {
      return NextResponse.json(
        { error: "Conversation history is too long." },
        { status: 400 },
      );
    }

    // -----------------------------------------------------------
    //  OpenAI path (when OPENAI_API_KEY is set)
    // -----------------------------------------------------------
    const apiKey = process.env.OPENAI_API_KEY;

    // Derive the shuffled question flow from the topic
    const topic = extractTopic(history) ?? message;
    const flow = getShuffledFlow(topic);

    if (apiKey) {
      const { questionIndex, lastAiWasFollowUp, topicReceived } =
        getInterviewProgress(history, flow);

      // Determine current progress after this message
      let currentQ = questionIndex;
      if (topicReceived) {
        if (lastAiWasFollowUp || !isVagueAnswer(message)) {
          currentQ++;
        }
      }
      const isDone = currentQ >= NUM_QUESTIONS;

      const systemPrompt = `You are a friendly, expert AI interviewer evaluating a candidate's teaching ability.

RULES:
- You are conducting a structured ${NUM_QUESTIONS}-question interview.
- The candidate has completed ${currentQ} of ${NUM_QUESTIONS} questions so far.
- Some questions should be SUBJECT-SPECIFIC — relate directly to the topic the candidate chose to teach.
- Other questions should assess TEACHING QUALITIES: clarity, warmth, simplicity, patience, and fluency (adaptability).
- Each question must test one of: clarity, warmth, simplicity, patience, or fluency.
- Generate ONE question at a time based on their previous answer.
- If their answer is vague, too short, or generic, ask a specific follow-up before moving to the next question.
- Keep tone warm, encouraging, and conversational — like a supportive colleague, not an examiner.
- Keep your response to 2-3 sentences maximum.
${isDone ? "- The interview is now COMPLETE. Thank them warmly, summarize one strength you noticed, and tell them to check the Dashboard for full results. Do NOT ask another question." : "- Ask the next question now."}

You MUST respond with valid JSON only (no markdown, no code fences):
{ "question": "your response text here", "done": ${isDone} }`;

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map((m) => ({
          role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
          content: m.text,
        })),
        { role: "user" as const, content: message },
      ];

      const openaiRes = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: chatMessages,
            max_tokens: 300,
            temperature: 0.7,
          }),
        },
      );

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        console.error("OpenAI API error:", openaiRes.status, errText);
        if (openaiRes.status === 429) {
          return NextResponse.json(
            { error: "Too many requests — please wait a moment and try again." },
            { status: 429 },
          );
        }
        return NextResponse.json(
          { error: "AI service temporarily unavailable. Please try again." },
          { status: 502 },
        );
      }

      const data = await openaiRes.json();
      let rawContent = data.choices?.[0]?.message?.content?.trim() ?? "";
      rawContent = rawContent
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

      const evaluation = isDone
        ? evaluateInterview(history, message)
        : undefined;

      try {
        const parsed = JSON.parse(rawContent);
        return NextResponse.json({
          question: parsed.question,
          done: !!parsed.done,
          questionNumber: Math.min(currentQ + 1, NUM_QUESTIONS),
          totalQuestions: NUM_QUESTIONS,
          evaluation,
        } satisfies InterviewResponse);
      } catch {
        return NextResponse.json({
          question: rawContent,
          done: isDone,
          questionNumber: Math.min(currentQ + 1, NUM_QUESTIONS),
          totalQuestions: NUM_QUESTIONS,
          evaluation,
        } satisfies InterviewResponse);
      }
    }

    // -----------------------------------------------------------
    //  Fallback: structured simulated interview (no API key)
    // -----------------------------------------------------------
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));

    const { questionIndex, lastAiWasFollowUp, topicReceived } =
      getInterviewProgress(history, flow);

    // First message is the topic — respond with Q1 (from shuffled flow)
    if (!topicReceived) {
      return NextResponse.json({
        question: flow[0].question,
        done: false,
        questionNumber: 1,
        totalQuestions: NUM_QUESTIONS,
      } satisfies InterviewResponse);
    }

    // Advance if appropriate
    let currentQ = questionIndex;
    const currentIsVague = isVagueAnswer(message);

    if (lastAiWasFollowUp || !currentIsVague) {
      currentQ++;
    }

    // Interview complete — return evaluation
    if (currentQ >= NUM_QUESTIONS) {
      const evaluation = evaluateInterview(history, message);
      return NextResponse.json({
        question: DONE_MESSAGE,
        done: true,
        questionNumber: NUM_QUESTIONS,
        totalQuestions: NUM_QUESTIONS,
        evaluation,
      } satisfies InterviewResponse);
    }

    // Ask follow-up or next question
    const step = flow[currentQ];
    const respondWithFollowUp = currentIsVague && !lastAiWasFollowUp;

    return NextResponse.json({
      question: respondWithFollowUp ? step.followUp : step.question,
      done: false,
      questionNumber: currentQ + 1,
      totalQuestions: NUM_QUESTIONS,
    } satisfies InterviewResponse);
  } catch (err) {
    console.error("/api/interview error:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 },
    );
  }
}
