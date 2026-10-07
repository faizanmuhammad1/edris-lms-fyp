import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";

/** Most recently updated campaigns loaded into the list (search/filter run client-side). */
export const MAIL_CAMPAIGN_LIST_LIMIT = 100;

export async function getMailOverview() {
  await requireAdmin();

  const [
    subscriberCount,
    campaigns,
    totalCampaigns,
    draftCount,
    partialCount,
    lastSentCampaign,
  ] = await Promise.all([
    prisma.subscriber.count({ where: { status: "Confirmed" } }),
    prisma.mailCampaign.findMany({
      take: MAIL_CAMPAIGN_LIST_LIMIT,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        subject: true,
        audienceType: true,
        audiencePayload: true,
        recipientCount: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.mailCampaign.count(),
    // Draft: nobody has received it. Partially sent: some batches were
    // delivered but the send did not finish (see sendCampaign).
    prisma.mailCampaign.count({ where: { sentAt: null, recipientCount: 0 } }),
    prisma.mailCampaign.count({ where: { sentAt: null, recipientCount: { gt: 0 } } }),
    prisma.mailCampaign.findFirst({
      where: { sentAt: { not: null } },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
  ]);

  // Titles for "Students of a course" audiences, so the list can say which course.
  const courseIds = Array.from(
    new Set(
      campaigns.flatMap((c) => {
        const payload = c.audiencePayload as { courseId?: unknown } | null;
        return c.audienceType === "CourseStudents" && typeof payload?.courseId === "string"
          ? [payload.courseId]
          : [];
      })
    )
  );
  const courses = courseIds.length
    ? await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true },
      })
    : [];

  return {
    subscriberCount,
    campaigns,
    totalCampaigns,
    draftCount,
    partialCount,
    lastSentAt: lastSentCampaign?.sentAt ?? null,
    courseTitles: Object.fromEntries(courses.map((c) => [c.id, c.title])) as Record<string, string>,
  };
}
