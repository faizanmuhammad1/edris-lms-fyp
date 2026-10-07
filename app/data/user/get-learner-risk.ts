import "server-only";

import { prisma } from "@/lib/db";
import { requireUser } from "./require-user";

export type RiskLevel = "low" | "medium" | "high";

export interface CourseRiskResult {
  courseId: string;
  courseTitle: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
}

interface CalculateRiskParams {
  courseId: string;
  courseTitle: string;
  userId: string;
  enrolledAt: Date;
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

async function calculateRiskForEnrollment({
  courseId,
  courseTitle,
  userId,
  enrolledAt,
}: CalculateRiskParams): Promise<CourseRiskResult> {
  let riskScore = 0;
  const reasons: string[] = [];

  const now = new Date();
  const daysSinceEnroll =
    (now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24);

  const [lessonProgress, quizAttempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: {
        userId,
        Lesson: {
          Chapter: {
            courseId,
          },
        },
      },
      select: {
        completed: true,
        watchPercentage: true,
        updatedAt: true,
      },
    }),
    prisma.quizAttempt.findMany({
      where: {
        userId,
        Quiz: {
          Lesson: {
            Chapter: {
              courseId,
            },
          },
        },
      },
      select: {
        score: true,
        isCompleted: true,
        submittedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  // Engagement: recent activity and watch progression
  if (lessonProgress.length === 0 && daysSinceEnroll > 3) {
    riskScore += 25;
    reasons.push(
      "No lesson activity recorded several days after enrollment (possible disengagement)."
    );
  } else if (lessonProgress.length > 0) {
    const latestUpdate = lessonProgress.reduce<Date | null>(
      (latest, lp) =>
        !latest || lp.updatedAt > latest ? lp.updatedAt : latest,
      null
    );

    if (latestUpdate) {
      const daysSinceActivity =
        (now.getTime() - latestUpdate.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceActivity >= 7) {
        riskScore += 20;
        reasons.push("No recent lesson activity in the last 7 days.");
      } else if (daysSinceActivity >= 3) {
        riskScore += 10;
        reasons.push("Limited activity in the last few days.");
      }
    }

    const avgWatch =
      lessonProgress.reduce(
        (sum, lp) => sum + lp.watchPercentage,
        0
      ) / lessonProgress.length;

    if (daysSinceEnroll >= 7 && avgWatch < 30) {
      riskScore += 15;
      reasons.push(
        "Low average watch progress across lessons after a week of enrollment."
      );
    }
  }

  // Assessment performance
  const completedAttempts = quizAttempts.filter(
    (a) => a.isCompleted && a.score != null
  );

  if (completedAttempts.length > 0) {
    const lastTwo = completedAttempts.slice(0, 2);
    const failingAttempts = lastTwo.filter(
      (a) => (a.score ?? 0) < 60
    );
    if (failingAttempts.length === lastTwo.length) {
      riskScore += 20;
      reasons.push(
        "Recent quiz attempts are consistently below the passing threshold."
      );
    } else if (failingAttempts.length > 0) {
      riskScore += 10;
      reasons.push("Some recent quiz attempts are below the passing threshold.");
    }
  }

  // Combination rule bump for clearly stalled learners
  if (riskScore >= 40 && daysSinceEnroll > 14) {
    riskScore += 10;
    reasons.push(
      "Elevated risk over a longer time window (over two weeks since enrollment)."
    );
  }

  // Clamp to 0–100
  riskScore = Math.max(0, Math.min(100, riskScore));

  return {
    courseId,
    courseTitle,
    riskScore,
    riskLevel: toRiskLevel(riskScore),
    reasons,
  };
}

export async function getLearnerRiskForCourse(
  courseId: string
): Promise<CourseRiskResult | null> {
  const user = await requireUser();

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      courseId,
      status: "Active",
    },
    select: {
      id: true,
      createdAt: true,
      Course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!enrollment) {
    return null;
  }

  return calculateRiskForEnrollment({
    courseId: enrollment.Course.id,
    courseTitle: enrollment.Course.title,
    userId: user.id,
    enrolledAt: enrollment.createdAt,
  });
}

export async function getLearnerRiskAcrossEnrollments(): Promise<
  CourseRiskResult[]
> {
  const user = await requireUser();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: user.id,
      status: "Active",
    },
    select: {
      id: true,
      createdAt: true,
      Course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (enrollments.length === 0) {
    return [];
  }

  const results = await Promise.all(
    enrollments.map((e) =>
      calculateRiskForEnrollment({
        courseId: e.Course.id,
        courseTitle: e.Course.title,
        userId: user.id,
        enrolledAt: e.createdAt,
      })
    )
  );

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

