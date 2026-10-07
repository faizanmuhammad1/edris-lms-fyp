"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Award, Loader2 } from "lucide-react";
import { claimCertificate } from "@/app/actions/claim-certificate";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CertificateTemplate } from "./CertificateTemplate";

const NAME_MIN = 2;
const NAME_MAX = 100;

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

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN) return "Enter your full name (at least 2 characters).";
  if (trimmed.length > NAME_MAX) return `Your name must be ${NAME_MAX} characters or fewer.`;
  return null;
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
  const [touched, setTouched] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();

  const error = validateName(name);
  const showError = touched && !!error;

  async function handleIssue(): Promise<boolean> {
    setIssuing(true);
    try {
      const response = await claimCertificate(slug, name.trim());
      if (response.status === "success") {
        toast.success(response.message);
        router.refresh();
        return true;
      }
      toast.error(response.message);
      return false;
    } catch {
      toast.error("We couldn't issue your certificate. Please check your connection and try again.");
      return false;
    } finally {
      setIssuing(false);
    }
  }

  const nameSlot = (
    <div className="recipient-editable">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => setTouched(true)}
        disabled={issuing}
        maxLength={NAME_MAX}
        placeholder="Enter your full name"
        aria-label="Name on certificate (preview)"
        className="recipient-input"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <CertificateTemplate
        userName={name.trim() || "Your Name"}
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

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Issue your certificate</h2>
          </CardTitle>
          <CardDescription>
            Your name is permanently recorded on the blockchain and can&apos;t be changed after issuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="flex flex-col gap-4 sm:flex-row sm:items-start"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="w-full space-y-2 sm:max-w-md">
              <Label htmlFor={inputId}>Name on certificate</Label>
              <Input
                id={inputId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                disabled={issuing}
                maxLength={NAME_MAX}
                autoComplete="name"
                aria-invalid={showError || undefined}
                aria-describedby={showError ? errorId : hintId}
                className="h-10"
              />
              {showError ? (
                <p id={errorId} className="text-sm text-destructive">
                  {error}
                </p>
              ) : (
                <p id={hintId} className="text-xs text-muted-foreground">
                  You can also edit the name directly on the certificate preview.
                </p>
              )}
            </div>

            <ConfirmDialog
              title="Issue your certificate?"
              description={
                <>
                  Your certificate for <strong>{courseTitle}</strong> will be issued to{" "}
                  <strong>{name.trim() || "—"}</strong> and recorded on the blockchain. This can take up to a
                  minute, and the name can&apos;t be changed afterwards.
                </>
              }
              confirmLabel="Issue certificate"
              onConfirm={handleIssue}
              trigger={
                <Button
                  type="button"
                  size="lg"
                  className="w-full sm:mt-[1.375rem] sm:w-auto"
                  disabled={issuing || !!error}
                  onClick={() => setTouched(true)}
                >
                  {issuing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Award aria-hidden="true" />}
                  {issuing ? "Issuing…" : "Issue certificate"}
                </Button>
              }
            />
          </form>
          <p className="sr-only" role="status" aria-live="polite">
            {issuing ? "Issuing your certificate. This can take up to a minute." : ""}
          </p>
        </CardContent>
      </Card>

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
          border-radius: 0.5cqw;
          outline: none;
          width: 100%;
          max-width: 64cqw;
          padding: 0;
          caret-color: var(--brand);
        }
        .recipient-input::placeholder { color: #0a140f; opacity: 0.3; }
        .recipient-input:hover { background: rgba(74, 109, 86, 0.06); }
        .recipient-input:focus-visible { box-shadow: 0 0 0 2px var(--brand); }
      `}</style>
    </div>
  );
}
