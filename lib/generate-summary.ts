import "server-only";

import openai from "@/lib/openai";
import { prisma } from "@/lib/db";

/**
 * Generate an AI summary of a lesson's video transcript and save it to the DB.
 * Uses gpt-4o-mini for fast, cheap summarisation.
 *
 * Can be called from:
 * - The transcription webhook (auto-generate on completion)
 * - A manual API trigger (for re-generation)
 */
export async function generateLessonSummary(lessonId: string): Promise<string> {
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

  if (!lesson?.transcript) {
    throw new Error("No transcript available for this lesson");
  }

  // Truncate very long transcripts to stay well within context limits
  const transcript =
    lesson.transcript.length > 60_000
      ? lesson.transcript.slice(0, 60_000) + "\n[...transcript truncated]"
      : lesson.transcript;

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_output_tokens: 512,
    instructions: `You are a professional course content summarizer. Write a clear, concise summary of the lesson video content.

Rules:
- Write 3-5 sentences maximum
- Focus on the KEY topics and takeaways the student should remember
- Use simple, student-friendly language
- Do NOT start with "In this lesson..." or "This video..." — just jump straight into the content
- Do NOT use markdown formatting — output plain text only
- Write in third-person or address the student directly`,
    input: [
      {
        role: "user",
        content: `Summarize this lesson transcript.

Course: ${lesson.Chapter.Course.title}
Chapter: ${lesson.Chapter.title}
Lesson: ${lesson.title}

Transcript:
${transcript}`,
      },
    ],
  });

  const summary =
    response.output_text?.trim() || "Summary could not be generated.";

  // Save to database
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { videoSummary: summary },
  });

  return summary;
}
