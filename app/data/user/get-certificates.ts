import { requireUser } from "./require-user";
import { prisma } from "@/lib/db";

export interface CertificateItem {
  certificateId: string;
  courseTitle: string;
  courseSlug: string;
  issuedOn: string; // ISO string
}

// Fetches real certificates from database
export async function getCertificates(): Promise<CertificateItem[]> {
  const user = await requireUser();

  // Fetch actual certificates from database
  const dbCertificates = await prisma.certificate.findMany({
    where: {
      userId: user.id,
    },
    include: {
      Course: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  // Map database certificates to CertificateItem interface
  const certificates: CertificateItem[] = dbCertificates.map((cert) => ({
    certificateId: cert.id,
    courseTitle: cert.Course.title,
    courseSlug: cert.Course.slug,
    issuedOn: cert.issuedAt.toISOString(),
  }));

  return certificates;
}

export type CertificateType = Awaited<ReturnType<typeof getCertificates>>[0];
