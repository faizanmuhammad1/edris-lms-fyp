import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { notFound } from "next/navigation";
import {
  CertificatePrintButton,
  BackToCourseButton,
} from "./CertificatePrintButton";
import { CertificateQRCode } from "./CertificateQRCode";
import { issueCertificate } from "@/app/actions/issue-certificate";
import { getCourseCompletionStatus } from "@/app/data/course/get-course-completion-status";
import {
  Playfair_Display,
  Great_Vibes,
  Cormorant_Garamond,
} from "next/font/google";

const GREEN = "#1B4332";
const GOLD = "#C5A048";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-playfair",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cormorant",
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
      blockchainStatus: true,
      txHash: true,
      blockNumber: true,
      network: true,
      contractAddress: true,
    },
  });

  const completionStatus = await getCourseCompletionStatus(course.id, user.id);

  if (!completionStatus.isEligible && !certificate) {
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

  if (!certificate && completionStatus.isEligible) {
    certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        courseId: course.id,
      },
      select: {
        id: true,
        uniqueId: true,
        issuedAt: true,
        blockchainStatus: true,
        txHash: true,
        blockNumber: true,
        network: true,
        contractAddress: true,
      },
    });
  }

  if (certificate && completionStatus.isEligible) {
    await issueCertificate(certificate.id, {
      uniqueId: certificate.uniqueId,
      studentName: user.name ?? "",
      courseName: course.title,
      issuedAt: certificate.issuedAt,
    });
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
    const previewMissing = data.completion.remainingLessonTitles.slice(0, 5);
    const extraCount = Math.max(
      data.completion.remainingLessonTitles.length - previewMissing.length,
      0
    );

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

          {previewMissing.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-700">Still missing:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {previewMissing.map((title) => (
                  <li key={title}>{title}</li>
                ))}
                {extraCount > 0 && <li>...and {extraCount} more lessons</li>}
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

  const issuedDate = new Date(data.certificate.issuedOn);
  const day = issuedDate.getDate().toString().padStart(2, "0");
  const month = (issuedDate.getMonth() + 1).toString().padStart(2, "0");
  const year = issuedDate.getFullYear();

  const blockchainStatus = data.certificate.blockchainStatus ?? "PENDING";
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
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
  const verifiedLabel =
    blockchainStatus === "ISSUED"
      ? "Blockchain Verified"
      : blockchainStatus === "FAILED"
        ? "Verification Pending"
        : "Blockchain Pending";

  return (
    <div
      className={`min-h-dvh w-full bg-gray-100 p-4 md:p-8 ${playfair.variable} ${greatVibes.variable} ${cormorant.variable}`}
    >
      {/* Screen-only chrome (hidden when printing) */}
      <div className="mx-auto mb-6 flex max-w-[1100px] items-center justify-between print:hidden">
        <BackToCourseButton slug={slug} />
        <CertificatePrintButton />
      </div>

      {/* Printable region only — used by globals.css print isolation */}
      <div className="certificate-print-root mx-auto max-w-[1100px] bg-white shadow-2xl print:shadow-none">
        <div
          className="certificate-card relative overflow-hidden bg-white print:shadow-none"
          style={{ aspectRatio: "1.414 / 1" }}
        >
          {/* Corner decorations */}
          <svg
            className="absolute left-0 top-0 h-[180px] w-[180px] md:h-[220px] md:w-[220px]"
            viewBox="0 0 220 220"
            fill="none"
            aria-hidden
          >
            <polygon points="0,0 220,0 0,220" fill={GREEN} />
            <polygon points="0,0 160,0 0,160" fill={GREEN} />
            <polygon points="30,0 170,0 30,140" fill={GOLD} opacity={0.75} />
          </svg>
          <svg
            className="absolute right-0 top-0 h-[180px] w-[180px] md:h-[220px] md:w-[220px]"
            viewBox="0 0 220 220"
            fill="none"
            aria-hidden
          >
            <polygon points="220,0 220,220 0,0" fill={GREEN} />
            <polygon points="220,0 220,160 60,0" fill={GREEN} />
            <polygon points="220,30 220,170 50,30" fill={GOLD} opacity={0.75} />
          </svg>
          <svg
            className="absolute bottom-0 right-0 h-[140px] w-[140px] md:h-[180px] md:w-[180px]"
            viewBox="0 0 180 180"
            fill="none"
            aria-hidden
          >
            <polygon points="180,180 180,0 0,180" fill={GREEN} />
            <polygon points="180,180 180,40 40,180" fill={GOLD} opacity={0.7} />
          </svg>
          <svg
            className="absolute bottom-0 left-0 h-[80px] w-[80px] md:h-[100px] md:w-[100px]"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden
          >
            <polygon points="0,100 0,30 70,100" fill={GREEN} opacity={0.5} />
          </svg>

          <div className="absolute left-[20px] top-[60px] grid grid-cols-5 gap-[6px] md:left-[30px] md:top-[80px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`tl-${i}`}
                className="h-[4px] w-[4px] rounded-full md:h-[5px] md:w-[5px]"
                style={{ backgroundColor: GOLD }}
              />
            ))}
          </div>
          <div className="absolute bottom-[60px] right-[20px] grid grid-cols-5 gap-[6px] md:bottom-[80px] md:right-[30px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`br-${i}`}
                className="h-[4px] w-[4px] rounded-full md:h-[5px] md:w-[5px]"
                style={{ backgroundColor: GOLD }}
              />
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-[16px] border-2 md:inset-[28px]"
            style={{ borderColor: `${GOLD}66` }}
          />

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-8 text-center md:px-16 md:py-12">
            {/* Brand row */}
            <div className="mb-3 flex items-center gap-3 md:mb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg md:h-12 md:w-12"
                style={{ backgroundColor: GREEN }}
              >
                <svg
                  viewBox="0 0 32 32"
                  className="h-7 w-7 text-white md:h-8 md:w-8"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M16 2L4 8v8c0 6.5 4.5 12.5 12 14 7.5-1.5 12-7.5 12-14V8L16 2z"
                    fill="currentColor"
                    opacity={0.15}
                  />
                  <path
                    d="M16 2L4 8v8c0 6.5 4.5 12.5 12 14 7.5-1.5 12-7.5 12-14V8L16 2z"
                    stroke="currentColor"
                    strokeWidth={1.2}
                  />
                  <path
                    d="M10 12h12v12H10V12zm4 4h4v4h-4v-4z"
                    stroke="currentColor"
                    strokeWidth={1}
                    fill="none"
                  />
                  <path
                    d="M14 10h4v2h-4v-2zm-2 2h2v2h-2v-2zm6 0h2v2h-2v-2z"
                    fill="currentColor"
                    opacity={0.9}
                  />
                </svg>
              </div>
              <span
                className="text-lg font-semibold uppercase tracking-[0.22em] md:text-xl"
                style={{ fontFamily: "var(--font-geist-sans), sans-serif", color: GREEN }}
              >
                EDRIS LMS
              </span>
            </div>

            <h1
              className="text-5xl font-black uppercase tracking-[0.06em] md:text-7xl lg:text-8xl"
              style={{
                fontFamily: "var(--font-playfair), serif",
                color: GREEN,
                letterSpacing: "0.06em",
              }}
            >
              Certificate
            </h1>

            {/* Gold bar — OF ACHIEVEMENT */}
            <div className="mt-3 mb-5 md:mb-7">
              <div
                className="inline-block min-w-[min(100%,280px)] px-8 py-2.5 md:px-12"
                style={{
                  background: `linear-gradient(90deg, ${GOLD} 0%, #e8c76a 50%, ${GOLD} 100%)`,
                }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.4em] text-white md:text-xs"
                  style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                >
                  Of Achievement
                </span>
              </div>
            </div>

            <p
              className="text-[10px] uppercase tracking-[0.22em] text-gray-500 md:text-xs"
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              This certificate is proudly presented to
            </p>

            <div className="my-2">
              <h2
                className="text-4xl md:text-6xl lg:text-7xl"
                style={{
                  fontFamily: "var(--font-great-vibes), cursive",
                  color: GREEN,
                }}
              >
                {data.user.name}
              </h2>
              <div
                className="mx-auto mt-2 h-0.5 w-48 md:w-72"
                style={{
                  backgroundImage: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                }}
              />
            </div>

            <p
              className="mt-2 text-sm text-gray-600 md:text-base"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              for successfully completing the course
            </p>
            <p
              className="mt-1 text-lg font-semibold italic md:text-xl"
              style={{ fontFamily: "var(--font-cormorant), serif", color: GREEN }}
            >
              {data.course.title}
            </p>
            <p
              className="mt-1 text-xs text-gray-500 md:text-sm"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              with distinction on the Edris LMS platform.
            </p>

            <div className="mt-auto w-full max-w-4xl pt-6 md:pt-8">
              <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-3 md:gap-4">
                {/* Left: ID + instructor */}
                <div className="flex flex-col items-center text-center">
                  <p
                    className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-500 md:text-[10px]"
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    Certificate ID: {certDisplayId}
                  </p>
                  <p
                    className="mt-3 text-2xl md:text-3xl"
                    style={{
                      fontFamily: "var(--font-great-vibes), cursive",
                      color: GREEN,
                    }}
                  >
                    {data.course.instructorName}
                  </p>
                  <div
                    className="mx-auto mt-1 h-px w-28 md:w-36"
                    style={{ backgroundColor: `${GREEN}40` }}
                  />
                  <p
                    className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-500 md:text-[10px]"
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    Course Instructor
                  </p>
                </div>

                {/* Center: QR */}
                <div className="flex flex-col items-center">
                  <p
                    className="mb-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-500 md:text-[9px]"
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    Blockchain Verified
                  </p>
                  <div
                    className="rounded-md border-2 bg-white p-1.5"
                    style={{ borderColor: `${GREEN}33` }}
                  >
                    <CertificateQRCode url={verificationUrl} size={88} />
                  </div>
                  <p
                    className="mt-1 text-[7px] font-semibold uppercase tracking-[0.15em] text-gray-400 md:text-[9px]"
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    Scan to Verify
                  </p>
                </div>

                {/* Right: network + date */}
                <div className="flex flex-col items-center text-center">
                  <p
                    className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-500 md:text-[10px]"
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    {networkLabel}
                  </p>
                  <p
                    className="mt-3 text-lg font-semibold tracking-wide md:text-xl"
                    style={{
                      fontFamily: "var(--font-geist-sans), sans-serif",
                      color: GREEN,
                    }}
                  >
                    {day} / {month} / {year}
                  </p>
                  <div
                    className="mx-auto mt-1 h-px w-28 md:w-36"
                    style={{ backgroundColor: `${GREEN}40` }}
                  />
                  <p
                    className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-500 md:text-[10px]"
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    Date of Issue
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[7px] font-medium uppercase tracking-[0.12em] text-gray-400 md:mt-5 md:text-[9px]">
                <span>Certificate ID: {certDisplayId}</span>
                <span style={{ color: GOLD }}>&bull;</span>
                <span>{verifiedLabel}</span>
                <span style={{ color: GOLD }}>&bull;</span>
                <span>{networkLabel}</span>
              </div>

              {blockchainStatus === "ISSUED" && txUrl && (
                <div className="mt-1 text-center">
                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[8px] underline underline-offset-2 md:text-[10px]"
                    style={{ color: GREEN }}
                  >
                    TX: {data.certificate.txHash!.slice(0, 16)}...
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="hidden px-4 py-2 text-center text-[10px] text-gray-400 print:block">
          Printed from EDRIS LMS &middot; Verify at {verificationUrl}
        </p>
      </div>
    </div>
  );
}
