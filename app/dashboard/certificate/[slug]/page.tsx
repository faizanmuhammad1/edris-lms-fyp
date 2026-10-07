import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Great_Vibes, Cinzel, EB_Garamond, Montserrat } from "next/font/google";
import { CheckCircle2, ExternalLink, Lock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { getCourseCompletionStatus } from "@/app/data/course/get-course-completion-status";
import { verificationPortalUrl } from "@/lib/verification-portal-url";
import { PageHeader } from "@/components/general/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PageContainer } from "../../_components/PageContainer";
import { CertificatePrintButton, BackToCourseButton } from "./CertificatePrintButton";
import { CertificateClaimView } from "./CertificateClaimView";
import { CertificateTemplate } from "./CertificateTemplate";

// The claim action waits for a blockchain confirmation.
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Certificate",
};

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

const certificateFonts = `${cinzel.variable} ${greatVibes.variable} ${garamond.variable} ${montserrat.variable}`;

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
      courseName: true,
      pdfUrl: true,
      blockchainStatus: true,
      txHash: true,
      blockNumber: true,
      network: true,
      contractAddress: true,
    },
  });

  const completionStatus = await getCourseCompletionStatus(course.id, user.id);

  const isIssuedOnChain = certificate?.blockchainStatus === "ISSUED";

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
      title: certificate!.courseName ?? course.title,
      hours: course.duration,
      instructorName: course.user.name,
    },
    certificate: {
      id: certificate!.uniqueId,
      issuedOn: certificate!.issuedAt.toISOString(),
      recipientName: certificate!.recipientName,
      pdfUrl: certificate!.pdfUrl,
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

function networkDisplayName(network: string | null | undefined): string {
  if (!network) return "Polygon Amoy Network";
  const n = network.toLowerCase();
  if (n.includes("amoy") || n.includes("polygon")) {
    return "Polygon Amoy Network";
  }
  return network;
}

function RequirementList({ title, items, total }: { title: string; items: string[]; total: number }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm break-words text-muted-foreground">
        {items.map((item, i) => (
          <li key={`${i}-${item}`}>{item}</li>
        ))}
      </ul>
      {total > items.length && (
        <p className="mt-2 text-xs text-muted-foreground">and {total - items.length} more</p>
      )}
    </div>
  );
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
    const { completion } = data;
    const percentage =
      completion.totalLessons > 0
        ? Math.round((completion.completedLessons / completion.totalLessons) * 100)
        : 0;

    return (
      <PageContainer width="narrow">
        <PageHeader
          backHref={`/dashboard/${slug}`}
          backLabel="Back to course"
          title="Certificate locked"
          description={
            <>
              Complete every requirement in <span className="font-medium text-foreground">{data.course.title}</span> to
              unlock your certificate.
            </>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Your progress</h2>
            </CardTitle>
            <CardDescription>
              {completion.completedLessons} of {completion.totalLessons} lessons completed ·{" "}
              {completion.remainingLessons} remaining
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Course completion</span>
                <span className="font-medium tabular-nums">{percentage}%</span>
              </div>
              <Progress value={percentage} aria-label="Course completion" />
            </div>

            <RequirementList
              title="Lessons to complete"
              items={completion.remainingLessonTitles.slice(0, 5)}
              total={completion.remainingLessonTitles.length}
            />
            <RequirementList
              title="Quizzes to pass"
              items={completion.remainingQuizTitles.slice(0, 5)}
              total={completion.remainingQuizTitles.length}
            />
            <RequirementList
              title="Assignments to submit"
              items={completion.remainingAssignmentTitles.slice(0, 5)}
              total={completion.remainingAssignmentTitles.length}
            />

            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href={`/dashboard/${slug}`}>Continue the course</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (data.kind === "eligible") {
    const now = new Date();
    const previewIssuedAtIso = now.toISOString();
    const previewDay = now.getDate().toString().padStart(2, "0");
    const previewMonth = (now.getMonth() + 1).toString().padStart(2, "0");
    const previewYear = now.getFullYear();

    return (
      <PageContainer width="medium" className={certificateFonts}>
        <PageHeader
          className="print:hidden"
          title="Claim your certificate"
          description={
            <>
              Congratulations on completing <span className="font-medium text-foreground">{data.course.title}</span>!
              Check the name below, then issue your blockchain-verified certificate.
            </>
          }
          actions={<BackToCourseButton slug={slug} />}
        />

        <CertificateClaimView
          slug={slug}
          defaultName={data.user.name ?? ""}
          courseTitle={data.course.title}
          courseHours={data.course.hours}
          instructorName={data.course.instructorName}
          issuedAtIso={previewIssuedAtIso}
          day={previewDay}
          month={previewMonth}
          year={previewYear}
          networkLabel="Polygon Amoy Network"
        />
      </PageContainer>
    );
  }

  const issuedDate = new Date(data.certificate.issuedOn);
  const day = issuedDate.getDate().toString().padStart(2, "0");
  const month = (issuedDate.getMonth() + 1).toString().padStart(2, "0");
  const year = issuedDate.getFullYear();

  const blockchainStatus = data.certificate.blockchainStatus ?? "PENDING";
  const verifyAtUrl = verificationPortalUrl();
  const certDisplayId = formatCertId(data.certificate.id, data.certificate.issuedOn);
  const explorerBase = process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? "https://amoy.polygonscan.com";
  const txUrl = data.certificate.txHash ? `${explorerBase}/tx/${data.certificate.txHash}` : null;

  const networkLabel = networkDisplayName(data.certificate.network);

  return (
    <PageContainer width="medium" className={certificateFonts}>
      {/* Screen-only chrome (hidden when printing) */}
      <PageHeader
        className="print:hidden"
        title="Your certificate"
        description={data.course.title}
        actions={
          <>
            <BackToCourseButton slug={slug} />
            <CertificatePrintButton />
          </>
        }
      />

      <CertificateTemplate
        userName={data.certificate.recipientName || data.user.name || "Learner"}
        courseTitle={data.course.title}
        courseHours={data.course.hours}
        instructorName={data.course.instructorName}
        certDisplayId={certDisplayId}
        uniqueId={data.certificate.id}
        issuedAt={issuedDate}
        contractAddress={data.certificate.contractAddress}
        day={day}
        month={month}
        year={year}
        networkLabel={networkLabel}
        blockchainStatus={blockchainStatus}
        txUrl={txUrl}
        txHash={data.certificate.txHash}
      />

      <p className="text-center text-sm text-muted-foreground sm:hidden print:hidden">
        Tip: rotate your phone or use <span className="font-medium">Print / Save as PDF</span> for a
        full-size copy.
      </p>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Verification details</h2>
          </CardTitle>
          <CardDescription>
            Share these details so anyone can confirm your certificate is genuine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-muted-foreground">Certificate ID</dt>
              <dd className="font-mono break-all">{data.certificate.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Issued</dt>
              <dd>
                <time dateTime={data.certificate.issuedOn}>
                  {issuedDate.toLocaleDateString(undefined, { dateStyle: "long" })}
                </time>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Network</dt>
              <dd>{networkLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium",
                  blockchainStatus === "ISSUED" && "text-primary"
                )}
              >
                {blockchainStatus === "ISSUED" && <CheckCircle2 className="size-4" aria-hidden="true" />}
                {blockchainStatus === "ISSUED" ? "Recorded on-chain" : blockchainStatus}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="lg" asChild>
              <a href={verifyAtUrl} target="_blank" rel="noopener noreferrer">
                Open verification portal
                <ExternalLink aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
            {txUrl && (
              <Button variant="ghost" size="lg" asChild>
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                  <ExternalLink aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="hidden px-4 py-2 text-center text-[10px] text-gray-400 print:block">
        Printed from EDRIS LMS &middot; Verify at {verifyAtUrl}
      </p>
    </PageContainer>
  );
}
