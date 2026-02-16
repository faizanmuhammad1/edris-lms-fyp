import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json(
      { error: "lessonId query param is required" },
      { status: 400 }
    );
  }

  // Pagination params — cursor-based, newest-first then reversed client-side
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10),
    100
  );

  const [chat, lesson] = await Promise.all([
    prisma.tutorChat.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
      select: {
        introCompleted: true,
        studentIntro: true,
        messages: {
          orderBy: { createdAt: "desc" as const },
          take: limit + 1, // fetch one extra to detect if there are more
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          select: {
            id: true,
            role: true,
            content: true,
            timestamp: true,
            createdAt: true,
          },
        },
      },
    }),
    // Check course-level intro from enrollment
    prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        Chapter: {
          select: {
            Course: {
              select: {
                enrollment: {
                  where: { userId: session.user.id, status: "Active" },
                  select: { studentIntro: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const courseIntro =
    lesson?.Chapter?.Course?.enrollment?.[0]?.studentIntro ?? null;
  const effectiveIntroCompleted =
    !!courseIntro || (chat?.introCompleted ?? false);

  const rawMessages = chat?.messages ?? [];
  const hasMore = rawMessages.length > limit;
  const messages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
  // Reverse so oldest is first (we fetched newest-first for cursor pagination)
  messages.reverse();
  const nextCursor = hasMore ? messages[0]?.id : undefined;

  return NextResponse.json({
    messages,
    introCompleted: effectiveIntroCompleted,
    isNewChat: !chat,
    nextCursor,
    hasMore,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json(
      { error: "lessonId query param is required" },
      { status: 400 }
    );
  }

  try {
    await prisma.tutorChat.deleteMany({
      where: {
        userId: session.user.id,
        lessonId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    return NextResponse.json(
      { error: "Failed to clear chat history" },
      { status: 500 }
    );
  }
}
