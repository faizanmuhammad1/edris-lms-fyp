import { requireUser } from "./require-user";
import { getEnrolledCourses } from "./get-enrolled-courses";

export interface CertificateItem {
  certificateId: string;
  courseTitle: string;
  courseSlug: string;
  issuedOn: string; // ISO string
}

// Mock certificate generator based on fully completed courses
export async function getCertificates(): Promise<CertificateItem[]> {
  await requireUser();
  const enrolled = await getEnrolledCourses();

  const certificates: CertificateItem[] = [];

  for (const item of enrolled) {
    const chapters = item.Course.chapter || [];
    const lessons = chapters.flatMap((c) => c.lessons || []);
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter((l) =>
      (l.lessonProgress || []).some((p) => p.completed)
    ).length;

    if (totalLessons > 0 && completedLessons === totalLessons) {
      const now = new Date();
      const certId = `CERT-${now.getFullYear()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

      certificates.push({
        certificateId: certId,
        courseTitle: item.Course.title,
        courseSlug: item.Course.slug,
        issuedOn: now.toISOString(),
      });
    }
  }

  // If there are no computed certificates (e.g., in a mock/demo state),
  // return a rich mock dataset to simulate issued certificates for UI testing.
  if (certificates.length === 0) {
    const now = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return d.toISOString();
    };

    const mock: CertificateItem[] = [
      {
        certificateId: "CERT-2025-ABC123",
        courseTitle: "Introduction to Next.js",
        courseSlug: "introduction-to-nextjs",
        issuedOn: daysAgo(5),
      },
      {
        certificateId: "CERT-2025-DEF456",
        courseTitle: "TypeScript Basics",
        courseSlug: "typescript-basics",
        issuedOn: daysAgo(12),
      },
      {
        certificateId: "CERT-2025-GHI789",
        courseTitle: "React State Management",
        courseSlug: "react-state-management",
        issuedOn: daysAgo(21),
      },
      {
        certificateId: "CERT-2025-JKL012",
        courseTitle: "Tailwind CSS Fundamentals",
        courseSlug: "tailwind-css-fundamentals",
        issuedOn: daysAgo(34),
      },
      {
        certificateId: "CERT-2025-MNO345",
        courseTitle: "Prisma with PostgreSQL",
        courseSlug: "prisma-with-postgresql",
        issuedOn: daysAgo(47),
      },
      {
        certificateId: "CERT-2025-PQR678",
        courseTitle: "Node.js APIs and Auth",
        courseSlug: "nodejs-apis-and-auth",
        issuedOn: daysAgo(63),
      },
    ];

    return mock;
  }

  return certificates;
}

export type CertificateType = Awaited<ReturnType<typeof getCertificates>>[0];
