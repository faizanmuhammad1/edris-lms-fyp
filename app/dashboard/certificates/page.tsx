import type { Metadata } from "next";
import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCertificates } from "@/app/data/user/get-certificates";
import { PageContainer } from "../_components/PageContainer";

export const metadata: Metadata = {
  title: "Certificates",
};

export default async function CertificatesPage() {
  const certificates = await getCertificates();

  return (
    <PageContainer>
      <PageHeader
        title="Certificates"
        description={
          certificates.length > 0
            ? `You've earned ${certificates.length} blockchain-verified certificate${certificates.length === 1 ? "" : "s"}.`
            : "Your blockchain-verified course certificates appear here."
        }
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete every lesson in a course (including its quizzes and assignments), then claim your certificate from the course page."
          buttonText="Go to my courses"
          href="/dashboard/courses"
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert) => (
            <li key={cert.certificateId}>
              <Card className="h-full gap-0 py-0">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Award className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h2 className="line-clamp-2 font-semibold leading-snug break-words" title={cert.courseTitle}>
                        {cert.courseTitle}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Issued{" "}
                        <time dateTime={cert.issuedOn}>
                          {new Date(cert.issuedOn).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </time>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs break-all text-muted-foreground">
                    <span className="font-medium">Certificate ID:</span>{" "}
                    <span className="font-mono">{cert.certificateId}</span>
                  </p>
                  <Link
                    href={`/dashboard/certificate/${cert.courseSlug}`}
                    className={buttonVariants({ variant: "outline", size: "lg", className: "mt-auto w-full" })}
                  >
                    View certificate
                    <span className="sr-only"> for {cert.courseTitle}</span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
