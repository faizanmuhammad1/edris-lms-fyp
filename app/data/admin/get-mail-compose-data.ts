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
    },
  });
  return campaign;
}
