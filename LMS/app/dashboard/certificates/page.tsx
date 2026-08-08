import { EmptyState } from "@/components/general/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

import { getCertificates } from "@/app/data/user/get-certificates";

export default async function CertificatesPage() {
  const certificates = await getCertificates();

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Certificates</h1>
        <p className="text-muted-foreground">
          Here you can see all the certificates you have earned
        </p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Complete your courses to earn certificates."
          buttonText="Browse Courses"
          href="/courses"
        />
      ) : (
        <>
          <section className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Total Certificates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-3xl font-bold">{certificates.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Certificates earned so far
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <Card key={cert.certificateId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {cert.courseTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      Issued {new Date(cert.issuedOn).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {cert.certificateId}
                    </p>
                    <Link
                      href={`/dashboard/${cert.courseSlug}/certificate`}
                      className="inline-flex mt-3 text-sm font-medium text-primary hover:underline"
                    >
                      View certificate
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
