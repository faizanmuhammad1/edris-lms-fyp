import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import openai from "@/lib/openai";
import aj, { slidingWindow } from "@/lib/arcjet";
import {
  buildTutorSystemPrompt,
  parseWhisperSegments,
} from "@/lib/tutor-context";

export const runtime = "nodejs";

const tutorRateLimit = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: "1m", max: 20 })
);

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = session.user.id;
  const userName = session.user.name || "Student";

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const decision = await tutorRateLimit.protect(req, {
    fingerprint: userId,
  });
  if (decision.isDenied()) {
    return new Response(
      JSON.stringify({
        error: "Too many messages. Please wait a moment before trying again.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let lessonId: string;
  let message: string;
  let videoTimestamp: number;
  let isIntroResponse = false;

  try {
    const body = await req.json();
    lessonId = body.lessonId;
    message = body.message;
    videoTimestamp =
      typeof body.videoTimestamp === "number" ? body.videoTimestamp : 0;
    isIntroResponse = body.isIntroResponse === true;

    if (!lessonId || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: "lessonId and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Fetch lesson + tutorChat in parallel ─────────────────────────────────
  const [lesson, existingChat] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        transcript: true,
        transcriptionSegments: true,
        Chapter: {
          select: {
            title: true,
            Course: {
              select: {
                id: true,
                title: true,
              enrollment: {
                where: { userId, status: "Active" },
                select: { id: true, studentIntro: true },
                take: 1,
              },
              },
            },
          },
        },
      },
    }),
    prisma.tutorChat.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: {
        id: true,
        openaiResponseId: true,
        introCompleted: true,
        studentIntro: true,
        messages: {
          orderBy: { createdAt: "asc" as const },
          select: { role: true, content: true },
        },
      },
    }),
  ]);

  if (!lesson) {
    return new Response(JSON.stringify({ error: "Lesson not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const enrollment = lesson.Chapter.Course.enrollment[0];
  if (!enrollment) {
    return new Response(JSON.stringify({ error: "Not enrolled" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Parse segments (strip Whisper metadata, filter silence) ──────────────
  const segments = parseWhisperSegments(lesson.transcriptionSegments);

  // ── Get or create TutorChat ───────────────────────────────────────────────
  const isFirstInteraction = !existingChat;

  let tutorChat = existingChat;
  if (!tutorChat) {
    tutorChat = await prisma.tutorChat.create({
      data: { userId, lessonId },
      select: {
        id: true,
        openaiResponseId: true,
        introCompleted: true,
        studentIntro: true,
        messages: {
          orderBy: { createdAt: "asc" as const },
          select: { role: true, content: true },
        },
      },
    });
  }

  // ── Resolve student intro (course-level > chat-level) ──────────────────
  // Use enrollment-level intro if available, falling back to per-chat intro
  const courseIntro = enrollment.studentIntro;
  const effectiveIntro = courseIntro || tutorChat.studentIntro;
  const effectiveIntroCompleted =
    !!courseIntro || tutorChat.introCompleted;

  // If this is an intro response, save to both chat and enrollment
  if (isIntroResponse && !effectiveIntroCompleted) {
    tutorChat.introCompleted = true;
    tutorChat.studentIntro = message.trim();
  }

  // ── Build system prompt ───────────────────────────────────────────────────
  const systemPrompt = buildTutorSystemPrompt(
    {
      lessonId,
      lessonTitle: lesson.title,
      courseName: lesson.Chapter.Course.title,
      chapterName: lesson.Chapter.title,
    },
    segments,
    videoTimestamp,
    {
      isFirstInteraction: isFirstInteraction && !effectiveIntroCompleted,
      introCompleted: isIntroResponse ? true : effectiveIntroCompleted,
      studentIntro: isIntroResponse ? message.trim() : effectiveIntro,
      studentName: userName,
    }
  );

  // ── Save user message (+ intro if applicable) in one transaction ─────────
  await prisma.$transaction([
    prisma.tutorMessage.create({
      data: {
        chatId: tutorChat.id,
        role: "user",
        content: message.trim(),
        timestamp: videoTimestamp,
      },
    }),
    ...(isIntroResponse && !effectiveIntroCompleted
      ? [
          prisma.tutorChat.update({
            where: { id: tutorChat.id },
            data: {
              studentIntro: message.trim(),
              introCompleted: true,
            },
          }),
          // Also save to enrollment so future lessons in this course remember
          prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { studentIntro: message.trim() },
          }),
        ]
      : []),
  ]);

  // ── Build input for OpenAI ────────────────────────────────────────────────
  const hasPreviousResponse = !!tutorChat.openaiResponseId;

  let input: Array<{ role: "user" | "assistant"; content: string }>;

  if (hasPreviousResponse) {
    input = [{ role: "user", content: message.trim() }];
  } else {
    input = [
      ...tutorChat.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message.trim() },
    ];
  }

  // ── Stream from OpenAI Responses API ──────────────────────────────────────
  const chatId = tutorChat.id;
  let previousResponseId = tutorChat.openaiResponseId;

  const encoder = new TextEncoder();

  /**
   * Call OpenAI with streaming. If previous_response_id is stale (expired
   * after 30 days), automatically retry without it.
   */
  async function createOpenAIStream(usePreviousId: boolean) {
    return openai.responses.create({
      model: "gpt-4o-mini",
      instructions: systemPrompt,
      input,
      stream: true,
      store: true,
      temperature: 0.7,
      max_output_tokens: 1024,
      ...(usePreviousId && previousResponseId
        ? { previous_response_id: previousResponseId }
        : {}),
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      let newResponseId: string | null = null;

      try {
        let responseStream;
        try {
          responseStream = await createOpenAIStream(hasPreviousResponse);
        } catch (retryErr) {
          // If previous_response_id is expired/invalid, retry without it
          const errMsg =
            retryErr instanceof Error ? retryErr.message : String(retryErr);
          if (hasPreviousResponse && errMsg.includes("previous_response")) {
            console.warn(
              "Stale previous_response_id — retrying without chain:",
              errMsg
            );
            // Clear the stale ID in background
            prisma.tutorChat
              .update({
                where: { id: chatId },
                data: { openaiResponseId: null },
              })
              .catch(() => {});

            // Rebuild input with full history for the fallback
            input = [
              ...(tutorChat?.messages ?? []).map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
              { role: "user", content: message.trim() },
            ];
            previousResponseId = null;
            responseStream = await createOpenAIStream(false);
          } else {
            throw retryErr;
          }
        }

        for await (const event of responseStream) {
          if (event.type === "response.output_text.delta") {
            const delta = event.delta;
            fullResponse += delta;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`
              )
            );
          } else if (event.type === "response.completed") {
            newResponseId = event.response.id;
          }
        }

        // Send done event with metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", introCompleted: isIntroResponse ? true : effectiveIntroCompleted })}\n\n`
          )
        );

        // ── Persist assistant message + response ID ───────────────────────
        await prisma.$transaction([
          prisma.tutorMessage.create({
            data: {
              chatId,
              role: "assistant",
              content: fullResponse,
              timestamp: videoTimestamp,
            },
          }),
          prisma.tutorChat.update({
            where: { id: chatId },
            data: { openaiResponseId: newResponseId },
          }),
        ]);
      } catch (err) {
        console.error("OpenAI streaming error:", err);
        const errorMsg =
          err instanceof Error ? err.message : "AI tutor error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: errorMsg })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
