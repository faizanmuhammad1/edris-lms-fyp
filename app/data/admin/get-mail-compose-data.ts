import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";

export async function getMailComposeData() {
  await requireAdmin();

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where: { status: "Published" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.course.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  return {
    courses,
    categories: categories.map((c) => c.category),
  };
}

export async function getMailCampaignById(campaignId: string) {
  await requireAdmin();

  const campaign = await prisma.mailCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      subject: true,
      bodyJson: true,
      bodyHtml: true,
      audienceType: true,
      audiencePayload: true,
      recipientCount: true,
      sentAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!campaign) return null;

  // Title of the targeted course (it may since have been unpublished, so it is
  // not necessarily in getMailComposeData's course list).
  const payload = campaign.audiencePayload as { courseId?: unknown } | null;
  const audienceCourse =
    campaign.audienceType === "CourseStudents" && typeof payload?.courseId === "string"
      ? await prisma.course.findUnique({
          where: { id: payload.courseId },
          select: { id: true, title: true },
        })
      : null;

  return { ...campaign, audienceCourse };
}
