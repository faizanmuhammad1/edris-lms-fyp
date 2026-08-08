import "server-only";

import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";
import {
  type CourseRiskResult,
  type RiskLevel,
} from "../user/get-learner-risk";

export interface AtRiskEnrollment extends CourseRiskResult {
  enrollmentId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string;
}

export async function getAtRiskLearnersForTeacher(options?: {
  minRiskLevel?: RiskLevel;
  limit?: number;
}): Promise<AtRiskEnrollment[]> {
  const session = await requireTeacher();
  const teacherId = session.user.id;

  const minRiskLevel = options?.minRiskLevel ?? "medium";
  const limit = options?.limit ?? 50;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      Course: {
        userId: teacherId,
      },
      status: "Active",
    },
    select: {
      id: true,
      createdAt: true,
      userId: true,
      Course: {
        select: {
          id: true,
          title: true,
        },
      },
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 300,
  });

  const now = new Date();

  const results: AtRiskEnrollment[] = [];

  for (const enrollment of enrollments) {
    const { id: enrollmentId, createdAt, userId, Course, User } = enrollment;

    let riskScore = 0;
    const reasons: string[] = [];

    const daysSinceEnroll =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    const [lessonProgress, quizAttempts] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: {
          userId,
          Lesson: {
            Chapter: {
              courseId: Course.id,
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
                courseId: Course.id,
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
        reasons.push(
          "Some recent quiz attempts are below the passing threshold."
        );
      }
    }

    if (riskScore >= 40 && daysSinceEnroll > 14) {
      riskScore += 10;
      reasons.push(
        "Elevated risk over a longer time window (over two weeks since enrollment)."
      );
    }

    riskScore = Math.max(0, Math.min(100, riskScore));

    const riskLevel: RiskLevel =
      riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

    if (
      (minRiskLevel === "high" && riskLevel === "high") ||
      (minRiskLevel === "medium" &&
        (riskLevel === "medium" || riskLevel === "high")) ||
      minRiskLevel === "low"
    ) {
      results.push({
        enrollmentId,
        courseId: Course.id,
        courseTitle: Course.title,
        studentId: userId,
        studentName: User.name,
        studentEmail: User.email,
        riskScore,
        riskLevel,
        reasons,
      });
    }
  }

  return results
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
}

