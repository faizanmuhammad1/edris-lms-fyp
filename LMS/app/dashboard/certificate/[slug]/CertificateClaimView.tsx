"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { claimCertificate } from "@/app/actions/claim-certificate";
import { CertificateTemplate } from "./CertificateTemplate";

const GREEN = "#1B4332";

interface CertificateClaimViewProps {
  slug: string;
  defaultName: string;
  courseTitle: string;
  courseHours: number;
  instructorName: string;
  issuedAtIso: string;
  day: string;
  month: string;
  year: number;
  networkLabel: string;
}

export function CertificateClaimView({
  slug,
  defaultName,
  courseTitle,
  courseHours,
  instructorName,
  issuedAtIso,
  day,
  month,
  year,
  networkLabel,
}: CertificateClaimViewProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [isPending, startTransition] = useTransition();

  const nameSlot = (
    <div className="recipient-editable">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isPending}
        placeholder="Enter your full name"
        className="recipient-input"
      />
    </div>
  );

  return (
    <>
      <div className="mx-auto mb-4 max-w-[900px] rounded-lg bg-white/80 px-5 py-3 text-center text-sm text-[#1b4332] shadow-sm print:hidden">
        Click on your name on the certificate to edit it, then press
        &ldquo;Issue Certificate&rdquo; below.
      </div>

      <CertificateTemplate
        userName={name || "Your Name"}
        courseTitle={courseTitle}
        courseHours={courseHours}
        instructorName={instructorName}
        certDisplayId="PENDING"
        uniqueId="00000000-0000-0000-0000-000000000000"
        issuedAt={new Date(issuedAtIso)}
        contractAddress={null}
        day={day}
        month={month}
        year={year}
        networkLabel={networkLabel}
        blockchainStatus="PREVIEW"
        txUrl={null}
        txHash={null}
        nameSlot={nameSlot}
      />

      <div className="mx-auto mt-6 flex max-w-[900px] items-center justify-center gap-4 print:hidden">
        <button
          type="button"
          disabled={isPending || name.trim().length < 2}
          onClick={() => {
            startTransition(async () => {
              const response = await claimCertificate(slug, name);
              if (response.status === "success") {
                toast.success(response.message);
                router.refresh();
                return;
              }
              toast.error(response.message);
            });
          }}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white shadow-md transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          style={{ backgroundColor: GREEN }}
        >
          {isPending ? "Issuing..." : "Issue Certificate"}
        </button>
      </div>

      <style>{`
        .recipient-editable { width: 100%; text-align: center; padding: 0.8cqw 0; }
        .recipient-input {
          font-family: var(--font-great-vibes), cursive;
          font-size: 6.2cqw;
          color: #0a140f;
          line-height: 1.3;
          text-align: center;
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          max-width: 64cqw;
          padding: 0;
          caret-color: var(--brand);
        }
        .recipient-input::placeholder { color: #0a140f; opacity: 0.3; }
        .recipient-input:focus { outline: none; }
      `}</style>
    </>
  );
}
