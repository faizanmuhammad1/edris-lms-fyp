import type { Metadata } from "next";
import type { ReactNode } from "react";

// page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Verify a certificate",
  description:
    "Instantly check that an Edris LMS certificate is authentic by verifying its unique ID against the blockchain record.",
  alternates: { canonical: "/verification" },
};

export default function VerificationLayout({ children }: { children: ReactNode }) {
  return children;
}
