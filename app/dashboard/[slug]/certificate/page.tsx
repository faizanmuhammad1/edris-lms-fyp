import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Link from "next/link";

async function getCertificateData(slug: string) {
  const user = await requireUser();

  // Find the course by slug
  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      duration: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!course) {
    return null;
  }

  // Find or create certificate for this user and course
  let certificate = await prisma.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: course.id,
      },
    },
    select: {
      id: true,
      uniqueId: true,
      issuedAt: true,
    },
  });

  // Check if user has completed all lessons
  const chapters = await prisma.chapter.findMany({
    where: { courseId: course.id },
    select: {
      lessons: {
        select: {
          id: true,
          lessonProgress: {
            where: { userId: user.id, completed: true },
            select: { id: true },
          },
        },
      },
    },
  });

  const allLessons = chapters.flatMap((ch) => ch.lessons);
  const completedLessons = allLessons.filter(
    (lesson) => lesson.lessonProgress.length > 0
  );

  const isFullyCompleted =
    allLessons.length > 0 && completedLessons.length === allLessons.length;

  // If not completed, don't show certificate
  if (!isFullyCompleted && !certificate) {
    return null;
  }

  // Create certificate if doesn't exist but is completed
  if (!certificate && isFullyCompleted) {
    certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        courseId: course.id,
      },
      select: {
        id: true,
        uniqueId: true,
        issuedAt: true,
      },
    });
  }

  return {
    platform: "EDRIS LMS",
    user: {
      name: user.name,
    },
    course: {
      title: course.title,
      hours: course.duration,
      instructorName: course.user.name,
    },
    certificate: {
      id: certificate!.uniqueId,
      issuedOn: certificate!.issuedAt.toISOString(),
    },
  };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCertificateData(slug);

  if (!data) {
    return notFound();
  }

  const issuedDate = new Date(data.certificate.issuedOn).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 print:bg-white p-4 md:p-8">
      {/* Action buttons - hide on print */}
      <div className="mx-auto max-w-5xl mb-6 flex justify-end gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print Certificate
        </Button>
        <Link href={`/dashboard/${slug}`}>
          <Button variant="ghost">Back to Course</Button>
        </Link>
      </div>

      <div
        className="mx-auto max-w-5xl bg-white dark:bg-slate-900 relative rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl print:shadow-none print:border-0 print:rounded-none overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Gold accent border at top */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

        {/* Decorative frame */}
        <div className="m-4 md:m-8 border-4 border-slate-200 dark:border-slate-700 rounded-xl">
          {/* Inner content */}
          <div className="m-6 md:m-12 p-6 md:p-10 text-center">
            {/* Award ribbon icon */}
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>

            <div className="text-xs md:text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 font-medium">
              Certificate of Completion
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {data.platform}
            </h1>

            <div className="mt-10 text-sm md:text-base text-slate-600 dark:text-slate-400">
              This is to certify that
            </div>

            <div className="mt-3 text-3xl md:text-4xl font-bold text-primary bg-clip-text">
              {data.user.name}
            </div>

            <div className="mt-8 text-sm md:text-base text-slate-600 dark:text-slate-400">
              has successfully completed the course
            </div>

            <div className="mt-3 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {data.course.title}
            </div>

            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Course Duration: {data.course.hours} hours
            </div>

            {/* Decorative divider */}
            <div className="my-10 mx-auto h-px w-48 md:w-80 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="h-px w-32 mx-auto bg-slate-300 dark:bg-slate-600" />
                <div className="mt-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  Instructor
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {data.course.instructorName}
                </div>
              </div>

              <div>
                <div className="h-px w-32 mx-auto bg-slate-300 dark:bg-slate-600" />
                <div className="mt-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  Issued On
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {issuedDate}
                </div>
              </div>

              <div>
                <div className="h-px w-32 mx-auto bg-slate-300 dark:bg-slate-600" />
                <div className="mt-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  Certificate ID
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {data.certificate.id.slice(0, 18)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer verification */}
        <div className="pb-6 text-center text-[10px] md:text-xs text-slate-400 dark:text-slate-500">
          Verify this certificate at{" "}
          <span className="font-mono text-primary">
            edris.edu/verify/{data.certificate.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Print hint */}
      <div className="mx-auto max-w-5xl mt-4 hidden print:block text-center text-xs text-slate-500">
        Printed from EDRIS LMS
      </div>
    </div>
  );
}
