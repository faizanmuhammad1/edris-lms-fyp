"use client";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CertificatePrintButton() {
  return (
    <Button type="button" size="lg" onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden="true" />
      Print / Save as PDF
    </Button>
  );
}

export function BackToCourseButton({ slug }: { slug: string }) {
  return (
    <Button variant="outline" size="lg" asChild className="print:hidden">
      <Link href={`/dashboard/${slug}`}>
        <ArrowLeft aria-hidden="true" />
        Back to course
      </Link>
    </Button>
  );
}
