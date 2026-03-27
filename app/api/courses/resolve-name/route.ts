import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeCourseName } from "@/lib/course-name";

function isMissingNormalizedNameColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybe = error as { code?: string; message?: string };
  if (maybe.code !== "P2022") return false;

  return (maybe.message ?? "").includes("normalizedName");
}

function jsonWithCors(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("marker") ?? "";
    const marker = normalizeCourseName(raw);

    if (!marker) {
      return jsonWithCors({ error: "marker query parameter is required" }, 400);
    }

    let supportsNormalizedColumn = true;
    let direct: { id: string; title: string; normalizedName: string | null } | null = null;

    try {
      direct = await prisma.course.findFirst({
        where: { normalizedName: marker },
        select: { id: true, title: true, normalizedName: true },
      });
    } catch (error) {
      if (!isMissingNormalizedNameColumnError(error)) {
        throw error;
      }
      supportsNormalizedColumn = false;
    }

    if (direct) {
      return jsonWithCors({
        id: direct.id,
        title: direct.title,
        normalizedName: direct.normalizedName ?? normalizeCourseName(direct.title),
      });
    }

    const legacyCourses = supportsNormalizedColumn
      ? await prisma.course.findMany({
          where: {
            OR: [{ normalizedName: null }, { normalizedName: "" }],
          },
          select: { id: true, title: true, normalizedName: true },
        })
      : await prisma.course.findMany({
          select: { id: true, title: true },
        });

    const fallback = legacyCourses.find(
      (course) => normalizeCourseName(course.title) === marker
    );

    if (!fallback) {
      return jsonWithCors({ error: "Course not found" }, 404);
    }

    const backfilled = normalizeCourseName(fallback.title);

    if (supportsNormalizedColumn) {
      await prisma.course
        .update({
          where: { id: fallback.id },
          data: { normalizedName: backfilled },
        })
        .catch(() => {
          // Non-blocking: still return resolved title if update fails.
        });
    }

    return jsonWithCors({
      id: fallback.id,
      title: fallback.title,
      normalizedName: backfilled,
    });
  } catch (error) {
    console.error("Failed to resolve course name:", error);
    return jsonWithCors({ error: "Failed to resolve course name" }, 500);
  }
}
