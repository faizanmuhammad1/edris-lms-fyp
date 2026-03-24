import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { notFound } from "next/navigation";
import {
  CertificatePrintButton,
  BackToCourseButton,
} from "./CertificatePrintButton";
import { CertificateClaimView } from "./CertificateClaimView";
import { getCourseCompletionStatus } from "@/app/data/course/get-course-completion-status";
import { Great_Vibes, Cinzel, EB_Garamond, Montserrat } from "next/font/google";
import { CertificateTemplate } from "./CertificateTemplate";
import { getServerBaseUrl } from "@/lib/base-url";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

async function getCertificateData(slug: string) {
  const user = await requireUser();

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

  const certificate = await prisma.certificate.findUnique({
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
      recipientName: true,
      blockchainStatus: true,
      txHash: true,
      blockNumber: true,
      network: true,
      contractAddress: true,
    },
  });

  const completionStatus = await getCourseCompletionStatus(course.id, user.id);

  const isIssuedOnChain =
    certificate?.blockchainStatus === "ISSUED";

  if (!completionStatus.isEligible && !isIssuedOnChain) {
    return {
      kind: "locked" as const,
      platform: "EDRIS LMS",
      course: {
        slug,
        title: course.title,
      },
      completion: completionStatus,
    };
  }

  if (!isIssuedOnChain && completionStatus.isEligible) {
    return {
      kind: "eligible" as const,
      platform: "EDRIS LMS",
      user: {
        name: user.name,
      },
      course: {
        slug,
        title: course.title,
        hours: course.duration,
        instructorName: course.user.name,
      },
    };
  }

  return {
    kind: "ready" as const,
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
      recipientName: certificate!.recipientName,
      blockchainStatus: certificate!.blockchainStatus,
      txHash: certificate!.txHash,
      blockNumber: certificate!.blockNumber,
      network: certificate!.network,
      contractAddress: certificate!.contractAddress,
    },
  };
}

function formatCertId(uniqueId: string, issuedAt: string) {
  const year = new Date(issuedAt).getFullYear();
  const short = uniqueId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `EDR-${year}-${short}`;
}

function networkDisplayName(
  network: string | null | undefined
): string {
  if (!network) return "Polygon Amoy Network";
  const n = network.toLowerCase();
  if (n.includes("amoy") || n.includes("polygon")) {
    return "Polygon Amoy Network";
  }
  return network;
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

  if (data.kind === "locked") {
    const previewLessonMissing = data.completion.remainingLessonTitles.slice(0, 5);
    const previewQuizMissing = data.completion.remainingQuizTitles.slice(0, 5);
    const previewAssignmentMissing =
      data.completion.remainingAssignmentTitles.slice(0, 5);

    return (
      <div className="min-h-dvh w-full bg-gray-100 p-4 md:p-8">
        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-start">
          <BackToCourseButton slug={slug} />
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border border-[#1B4332]/20 bg-white p-8 shadow-sm md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4332]/70">
            Certificate Locked
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#1B4332] md:text-4xl">
            Complete all course requirements to unlock your certificate
          </h1>

          <p className="mt-3 text-base text-gray-600">
            Progress: {data.completion.completedLessons}/{data.completion.totalLessons} lessons
            completed.
          </p>
          <p className="mt-1 text-base font-medium text-[#1B4332]">
            Remaining: {data.completion.remainingLessons} lesson
            {data.completion.remainingLessons === 1 ? "" : "s"}
          </p>

          {previewLessonMissing.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-700">
                Incomplete lessons:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {previewLessonMissing.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          )}

          {previewQuizMissing.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-700">
                Quizzes not passed yet:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {previewQuizMissing.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          )}

          {previewAssignmentMissing.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-700">
                Assignments not submitted yet:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {previewAssignmentMissing.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <BackToCourseButton slug={slug} />
          </div>
        </div>
      </div>
    );
  }

  if (data.kind === "eligible") {
    const now = new Date();
    const previewDay = now.getDate().toString().padStart(2, "0");
    const previewMonth = (now.getMonth() + 1).toString().padStart(2, "0");
    const previewYear = now.getFullYear();

    return (
      <div
        className={`min-h-dvh w-full bg-background p-4 md:p-8 ${cinzel.variable} ${greatVibes.variable} ${garamond.variable} ${montserrat.variable}`}
      >
        <div className="mx-auto mb-6 flex max-w-[900px] items-center justify-start print:hidden">
          <BackToCourseButton slug={slug} />
        </div>

        <CertificateClaimView
          slug={slug}
          defaultName={data.user.name ?? ""}
          courseTitle={data.course.title}
          courseHours={data.course.hours}
          instructorName={data.course.instructorName}
          day={previewDay}
          month={previewMonth}
          year={previewYear}
          networkLabel="Polygon Amoy Network"
        />
      </div>
    );
  }

  const issuedDate = new Date(data.certificate.issuedOn);
  const day = issuedDate.getDate().toString().padStart(2, "0");
  const month = (issuedDate.getMonth() + 1).toString().padStart(2, "0");
  const year = issuedDate.getFullYear();

  const blockchainStatus = data.certificate.blockchainStatus ?? "PENDING";
  const appUrl = getServerBaseUrl();
  const verificationUrl = `${appUrl}/verification?cid=${data.certificate.id}`;
  const certDisplayId = formatCertId(
    data.certificate.id,
    data.certificate.issuedOn
  );
  const explorerBase =
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? "https://amoy.polygonscan.com";
  const txUrl = data.certificate.txHash
    ? `${explorerBase}/tx/${data.certificate.txHash}`
    : null;

  const networkLabel = networkDisplayName(data.certificate.network);

  return (
    <div
      className={`min-h-dvh w-full bg-background p-4 md:p-8 ${cinzel.variable} ${greatVibes.variable} ${garamond.variable} ${montserrat.variable}`}
    >
      {/* Screen-only chrome (hidden when printing) */}
      <div className="mx-auto mb-6 flex max-w-[900px] items-center justify-between print:hidden">
        <BackToCourseButton slug={slug} />
        <CertificatePrintButton />
      </div>

      <CertificateTemplate
        userName={data.certificate.recipientName || data.user.name || "Learner"}
        courseTitle={data.course.title}
        courseHours={data.course.hours}
        instructorName={data.course.instructorName}
        verificationUrl={verificationUrl}
        certDisplayId={certDisplayId}
        day={day}
        month={month}
        year={year}
        networkLabel={networkLabel}
        blockchainStatus={blockchainStatus}
        txUrl={txUrl}
        txHash={data.certificate.txHash}
      />

      <p className="hidden px-4 py-2 text-center text-[10px] text-gray-400 print:block">
        Printed from EDRIS LMS &middot; Verify at {verificationUrl}
      </p>
    </div>
  );
}
