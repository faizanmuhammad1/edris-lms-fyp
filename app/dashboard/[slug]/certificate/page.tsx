import React from "react";

// Contract
// Inputs: params.slug (course slug)
// Output: Certificate UI populated with mock data derived from slug
// Error modes: None (purely presentational with fallback values)

function titleCase(input: string) {
  return input
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getMockData(slug: string) {
  const courseTitle = titleCase(slug || "mock-course");
  const issuedOn = new Date();
  const certId = `CERT-${issuedOn.getFullYear()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  return {
    platform: "Mentora LMS",
    user: {
      name: "John Doe",
    },
    course: {
      title: courseTitle || "Sample Course",
      hours: 12,
    },
    certificate: {
      id: certId,
      issuedOn: issuedOn.toISOString(),
    },
  } as const;
}

export default function CertificatePage({
  params,
}: {
  params: { slug: string };
}) {
  const data = getMockData(params?.slug);
  const issuedDate = new Date(data.certificate.issuedOn).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="min-h-[100dvh] w-full bg-slate-100 print:bg-white p-4 md:p-8">
      <div
        className="mx-auto max-w-5xl bg-white relative rounded-xl border shadow-sm print:shadow-none print:border-0 print:rounded-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Decorative frame */}
        <div className="m-3 md:m-6 border-4 border-slate-200 rounded-lg">
          {/* Inner content */}
          <div className="m-6 md:m-12 p-6 md:p-10 text-center">
            <div className="text-xs md:text-sm uppercase tracking-[0.25em] text-slate-500">
              Certificate of Completion
            </div>

            <h1 className="mt-2 text-2xl md:text-4xl font-serif font-semibold text-slate-900">
              {data.platform}
            </h1>

            <div className="mt-10 text-sm md:text-base text-slate-600">
              This certifies that
            </div>

            <div className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">
              {data.user.name}
            </div>

            <div className="mt-6 text-sm md:text-base text-slate-700">
              has successfully completed the course
            </div>

            <div className="mt-2 text-xl md:text-2xl font-semibold text-slate-900">
              {data.course.title}
            </div>

            <div className="mt-2 text-sm text-slate-500">
              Estimated learning time: {data.course.hours} hours
            </div>

            {/* Divider */}
            <div className="my-10 mx-auto h-px w-40 md:w-64 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left md:text-center">
              <div className="md:col-span-1">
                <div className="h-[1px] w-40 mx-auto bg-slate-300" />
                <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  Instructor
                </div>
                <div className="text-sm font-medium text-slate-800">
                  Jane Smith
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="h-[1px] w-40 mx-auto bg-slate-300" />
                <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  Issued On
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {issuedDate}
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="h-[1px] w-40 mx-auto bg-slate-300" />
                <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  Certificate ID
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {data.certificate.id}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer watermark */}
        <div className="absolute inset-x-0 bottom-4 md:bottom-6 text-center text-[10px] md:text-xs text-slate-400">
          Verify at mentora.example/verify/{data.certificate.id}
        </div>
      </div>

      {/* Print hint */}
      <div className="mx-auto max-w-5xl mt-4 hidden print:block text-center text-xs text-slate-500">
        Printed from Mentora LMS
      </div>
    </div>
  );
}
