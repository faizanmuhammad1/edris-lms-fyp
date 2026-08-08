import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";

export type MailRecipientRow = {
  email: string;
  userId?: string;
  subscriberId?: string;
};

export type AudiencePayload = {
  courseId?: string;
  category?: string;
  level?: string;
  /** For Manual audience: list of email addresses */
  emails?: string[];
};

/** Resolve recipients for the given audience; dedupe by email. Excludes banned users and unsubscribed subscribers. */
export async function getRecipientsForAudience(
  audienceType: string,
  payload?: AudiencePayload
): Promise<MailRecipientRow[]> {
  await requireAdmin();

  let rows: MailRecipientRow[] = [];

  switch (audienceType) {
    case "Subscribers": {
      const subscribers = await prisma.subscriber.findMany({
        where: { status: "Confirmed" },
        select: { id: true, email: true },
      });
      rows = subscribers.map((s) => ({ email: s.email, subscriberId: s.id }));
      break;
    }

    case "AllStudents": {
      const enrollments = await prisma.enrollment.findMany({
        where: { status: "Active" },
        select: { userId: true, User: { select: { email: true, id: true, banned: true } } },
      });
      const byEmail = new Map<string, MailRecipientRow>();
      for (const e of enrollments) {
        if (e.User.banned) continue;
        if (!byEmail.has(e.User.email)) {
          byEmail.set(e.User.email, { email: e.User.email, userId: e.User.id });
        }
      }
      rows = Array.from(byEmail.values());
      break;
    }

    case "CourseStudents": {
      const courseId = payload?.courseId;
      if (!courseId) break;
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId, status: "Active" },
        select: { userId: true, User: { select: { email: true, id: true, banned: true } } },
      });
      const byEmail = new Map<string, MailRecipientRow>();
      for (const e of enrollments) {
        if (e.User.banned) continue;
        if (!byEmail.has(e.User.email)) {
          byEmail.set(e.User.email, { email: e.User.email, userId: e.User.id });
        }
      }
      rows = Array.from(byEmail.values());
      break;
    }

    case "AllTeachers": {
      const teachers = await prisma.user.findMany({
        where: {
          OR: [{ role: "teacher" }, { teacherStatus: "Approved" }],
          banned: { not: true },
        },
        select: { id: true, email: true },
      });
      rows = teachers.map((t) => ({ email: t.email, userId: t.id }));
      break;
    }

    case "CategoryStudents": {
      const category = payload?.category;
      if (!category) break;
      const courses = await prisma.course.findMany({
        where: { category },
        select: { id: true },
      });
      const courseIds = courses.map((c) => c.id);
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: { in: courseIds }, status: "Active" },
        select: { userId: true, User: { select: { email: true, id: true, banned: true } } },
      });
      const byEmail = new Map<string, MailRecipientRow>();
      for (const e of enrollments) {
        if (e.User.banned) continue;
        if (!byEmail.has(e.User.email)) {
          byEmail.set(e.User.email, { email: e.User.email, userId: e.User.id });
        }
      }
      rows = Array.from(byEmail.values());
      break;
    }

    case "LevelStudents": {
      const level = payload?.level;
      if (!level || !["Beginner", "Intermediate", "Advanced"].includes(level)) break;
      const courses = await prisma.course.findMany({
        where: { level: level as "Beginner" | "Intermediate" | "Advanced" },
        select: { id: true },
      });
      const courseIds = courses.map((c) => c.id);
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: { in: courseIds }, status: "Active" },
        select: { userId: true, User: { select: { email: true, id: true, banned: true } } },
      });
      const byEmail = new Map<string, MailRecipientRow>();
      for (const e of enrollments) {
        if (e.User.banned) continue;
        if (!byEmail.has(e.User.email)) {
          byEmail.set(e.User.email, { email: e.User.email, userId: e.User.id });
        }
      }
      rows = Array.from(byEmail.values());
      break;
    }

    case "Manual": {
      const rawEmails = payload?.emails ?? [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const unique = Array.from(
        new Set(
          rawEmails
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.length > 0 && emailRegex.test(e))
        )
      );
      if (unique.length === 0) break;
      const users = await prisma.user.findMany({
        where: { email: { in: unique }, banned: { not: true } },
        select: { id: true, email: true },
      });
      const subscribers = await prisma.subscriber.findMany({
        where: { email: { in: unique } },
        select: { id: true, email: true, status: true },
      });
      const userByEmail = new Map(users.map((u) => [u.email, u]));
      const subByEmail = new Map(subscribers.map((s) => [s.email, s]));
      rows = unique
        .filter((email) => {
          const sub = subByEmail.get(email);
          return !sub || sub.status !== "Unsubscribed";
        })
        .map((email) => {
          const user = userByEmail.get(email);
          const sub = subByEmail.get(email);
          return {
            email,
            userId: user?.id,
            subscriberId: sub?.status === "Confirmed" ? sub.id : undefined,
          };
        });
      break;
    }

    default:
      break;
  }

  const unsubscribedEmails = new Set(
    (await prisma.subscriber.findMany({ where: { status: "Unsubscribed" }, select: { email: true } })).map(
      (s) => s.email
    )
  );
  const filtered = rows.filter((r) => !unsubscribedEmails.has(r.email));
  return filtered;
}

/** Return only the count for the given audience (for compose UI). */
export async function getRecipientCount(
  audienceType: string,
  payload?: AudiencePayload
): Promise<number> {
  const recipients = await getRecipientsForAudience(audienceType, payload);
  return recipients.length;
}
