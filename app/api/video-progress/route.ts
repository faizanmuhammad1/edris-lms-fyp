import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const body = await req.json();

    const { lessonId, lastWatchedPosition, watchedDuration, videoDuration, watchPercentage } = body;

    if (!lessonId || typeof lastWatchedPosition !== "number") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId,
        },
      },
      update: {
        lastWatchedPosition,
        watchedDuration: watchedDuration ?? 0,
        videoDuration: videoDuration ?? 0,
        watchPercentage: watchPercentage ?? 0,
      },
      create: {
        lessonId,
        userId: session.id,
        lastWatchedPosition,
        watchedDuration: watchedDuration ?? 0,
        videoDuration: videoDuration ?? 0,
        watchPercentage: watchPercentage ?? 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Video progress API error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
