import "server-only";

import openai from "@/lib/openai";
import { prisma } from "@/lib/db";

export type QuizGenerateOptions = {
  quizType?: string;
  description?: string;
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  focusTopics?: string;
};

export type GeneratedQuestion = {
  question: string;
  options: { text: string; isCorrect: boolean }[];
};

const MAX_TRANSCRIPT_LENGTH = 60_000;

/**
 * Generate quiz questions from a lesson's transcript using OpenAI.
 * Call only from server actions that have verified teacher ownership.
 * No DB writes; returns in-memory question data only.
 */
export async function generateQuizQuestionsFromTranscript(
  lessonId: string,
  options: QuizGenerateOptions
): Promise<GeneratedQuestion[]> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      title: true,
      transcript: true,
      Chapter: {
        select: {
          title: true,
          Course: { select: { title: true } },
        },
      },
    },
  });

  if (!lesson?.transcript?.trim()) {
    throw new Error("No transcript available for this lesson");
  }

  const transcript =
    lesson.transcript.length > MAX_TRANSCRIPT_LENGTH
      ? lesson.transcript.slice(0, MAX_TRANSCRIPT_LENGTH) + "\n[...transcript truncated]"
      : lesson.transcript;

  const { numQuestions, difficulty, quizType, description, focusTopics } = options;
  const difficultyHint =
    difficulty === "easy"
      ? "Use straightforward recall and simple wording."
      : difficulty === "medium"
        ? "Mix recall with some application; moderate complexity."
        : "Include application, analysis, or trickier wording where appropriate.";

  const focusParts: string[] = [];
  if (quizType) focusParts.push(`Quiz type/focus: ${quizType}`);
  if (description) focusParts.push(`Additional context: ${description}`);
  if (focusTopics?.trim()) focusParts.push(`Focus topics: ${focusTopics.trim()}`);
  const focusBlock =
    focusParts.length > 0
      ? `\n\nAdditional instructions:\n${focusParts.join("\n")}`
      : "";

  const instructions = `You are an expert educator creating multiple-choice quiz questions from a lecture transcript.

Your task: Generate exactly ${numQuestions} multiple-choice questions that assess understanding of the transcript content.
Difficulty: ${difficulty}. ${difficultyHint}
${focusBlock}

Rules:
- Each question must have between 2 and 5 options, with exactly ONE correct answer.
- Questions must be answerable from the transcript only. Do not make up external facts.
- Output ONLY valid JSON, no markdown or explanation. Use this exact structure:
[{"question":"<question text>","options":[{"text":"<option text>","isCorrect":true/false},...]},...]
- "isCorrect" must be true for exactly one option per question.`;

  const userContent = `Course: ${lesson.Chapter.Course.title}
Chapter: ${lesson.Chapter.title}
Lesson: ${lesson.title}

Transcript:
${transcript}`;

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_output_tokens: Math.min(4096, 400 + numQuestions * 350),
    instructions,
    input: [{ role: "user", content: userContent }],
  });

  const raw = response.output_text?.trim();
  if (!raw) {
    throw new Error("No response from quiz generator");
  }

  // Strip possible markdown code fence
  let jsonStr = raw;
  const codeMatch = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (codeMatch) {
    jsonStr = codeMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Invalid JSON from quiz generator");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Quiz generator did not return an array");
  }

  const questions: GeneratedQuestion[] = [];
  for (let i = 0; i < Math.min(parsed.length, numQuestions); i++) {
    const item = parsed[i];
    if (!item || typeof item !== "object" || !("question" in item) || !("options" in item)) {
      continue;
    }
    const question = String((item as { question?: unknown }).question ?? "").trim();
    const opts = (item as { options?: unknown }).options;
    if (!question || !Array.isArray(opts) || opts.length < 2) {
      continue;
    }
    const options = opts
      .map((o: unknown) => {
        if (!o || typeof o !== "object" || !("text" in o)) return null;
        const text = String((o as { text?: unknown }).text ?? "").trim();
        const rawCorrect = (o as { isCorrect?: unknown }).isCorrect;
        const isCorrect = rawCorrect === true || rawCorrect === "true";
        if (!text) return null;
        return { text, isCorrect };
      })
      .filter((o): o is { text: string; isCorrect: boolean } => o !== null);

    const correctCount = options.filter((o) => o.isCorrect).length;
    // Drop malformed questions instead of guessing an answer key: a question
    // with zero or multiple correct options (or < 2 options) can't be graded reliably.
    if (options.length < 2 || correctCount !== 1) {
      continue;
    }
    questions.push({ question, options });
  }

  if (questions.length === 0) {
    throw new Error("No valid questions could be parsed from the generator");
  }

  return questions;
}
