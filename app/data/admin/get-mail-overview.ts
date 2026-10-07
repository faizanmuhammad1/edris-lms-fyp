import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";

export async function getMailOverview() {
  await requireAdmin();

  const [subscriberCount, campaigns, draftCount, lastSentCampaign] = await Promise.all([
    prisma.subscriber.count({ where: { status: "Confirmed" } }),
    prisma.mailCampaign.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        subject: true,
        audienceType: true,
        audiencePayload: true,
        recipientCount: true,
        sentAt: true,
        createdAt: true,
      },
    }),
    prisma.mailCampaign.count({ where: { sentAt: null } }),
    prisma.mailCampaign.findFirst({
      where: { sentAt: { not: null } },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
  ]);

  return {
    subscriberCount,
    campaigns,
    draftCount,
    lastSentAt: lastSentCampaign?.sentAt ?? null,
  };
}
