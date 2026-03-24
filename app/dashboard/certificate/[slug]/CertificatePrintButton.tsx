"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const green = "#1B4332";

export function CertificatePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:opacity-90 print:hidden"
      style={{ backgroundColor: green }}
    >
      <Printer className="h-4 w-4" />
      Print Certificate
    </button>
  );
}

export function BackToCourseButton({ slug }: { slug: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/${slug}`)}
      className="inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-black/[0.03] print:hidden"
      style={{ borderColor: `${green}40`, color: green }}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Course
    </button>
  );
}
