"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MailBodyEditor } from "./MailBodyEditor";
import {
  saveDraft,
  sendPreview,
  sendCampaign,
  getRecipientCountAction,
} from "../actions";
import type { AudiencePayload } from "@/app/data/admin/get-mail-recipients";
import { toast } from "sonner";

const AUDIENCE_OPTIONS = [
  { value: "Subscribers", label: "Subscribers" },
  { value: "AllStudents", label: "All students" },
  { value: "CourseStudents", label: "Students of a course" },
  { value: "AllTeachers", label: "All teachers" },
  { value: "CategoryStudents", label: "Students in category" },
  { value: "LevelStudents", label: "Students by level" },
  { value: "Manual", label: "Manual (specific emails)" },
] as const;

function parseManualEmails(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );
}

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"] as const;

type Course = { id: string; title: string };
type ComposeFormProps = {
  campaignId?: string;
  initialSubject: string;
  initialBodyJson: string;
  initialAudienceType: string;
  initialAudiencePayload?: AudiencePayload | null;
  courses: Course[];
  categories: string[];
  isSent?: boolean;
  /** Recipients already sent to; > 0 without isSent means a partial send that can be retried. */
  sentCount?: number;
};

export function ComposeForm({
  campaignId,
  initialSubject,
  initialBodyJson,
  initialAudienceType,
  initialAudiencePayload,
  courses,
  categories,
  isSent,
  sentCount = 0,
}: ComposeFormProps) {
  const router = useRouter();
  const isPartiallySent = !isSent && sentCount > 0;
  // Content and audience are locked once anyone has received the campaign.
  const isLocked = !!isSent || isPartiallySent;
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(initialSubject);
  const [bodyJson, setBodyJson] = useState(initialBodyJson);
  const [audienceType, setAudienceType] = useState(initialAudienceType);
  const [courseId, setCourseId] = useState(initialAudiencePayload?.courseId ?? "");
  const [category, setCategory] = useState(initialAudiencePayload?.category ?? "");
  const [level, setLevel] = useState(initialAudiencePayload?.level ?? "");
  const [manualEmailsText, setManualEmailsText] = useState(
    Array.isArray(initialAudiencePayload?.emails)
      ? initialAudiencePayload.emails.join("\n")
      : ""
  );
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const manualEmails = parseManualEmails(manualEmailsText);

  const payload: AudiencePayload | undefined =
    audienceType === "CourseStudents" && courseId
      ? { courseId }
      : audienceType === "CategoryStudents" && category
        ? { category }
        : audienceType === "LevelStudents" && level
          ? { level }
          : audienceType === "Manual" && manualEmails.length > 0
            ? { emails: manualEmails }
            : undefined;

  const canResolveAudience =
    audienceType === "Subscribers" ||
    audienceType === "AllStudents" ||
    audienceType === "AllTeachers" ||
    (audienceType === "CourseStudents" && courseId) ||
    (audienceType === "CategoryStudents" && category) ||
    (audienceType === "LevelStudents" && level) ||
    (audienceType === "Manual" && manualEmails.length > 0);

  useEffect(() => {
    if (!canResolveAudience || isSent) return;
    getRecipientCountAction(audienceType, payload).then(setRecipientCount);
    // payload is derived from courseId, category, level
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceType, courseId, category, level, manualEmailsText, canResolveAudience, isSent]);

  const loadRecipientCount = () => {
    if (!canResolveAudience) {
      setRecipientCount(null);
      return;
    }
    startTransition(async () => {
      const count = await getRecipientCountAction(audienceType, payload);
      setRecipientCount(count);
    });
  };

  const handleSaveDraft = () => {
    startTransition(async () => {
      const result = await saveDraft({
        campaignId,
        subject,
        bodyJson,
        audienceType,
        audiencePayload: payload,
      });
      if (result.ok) {
        toast.success("Draft saved.");
        if (!campaignId) router.replace(`/admin/mail/compose/${result.campaignId}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handlePreview = () => {
    startTransition(async () => {
      const result = await sendPreview({ subject, bodyJson });
      if (result.ok) toast.success("Preview sent to your email.");
      else toast.error(result.error);
    });
  };

  const handleSend = () => {
    if (recipientCount === 0) {
      toast.error("No recipients match this audience.");
      return;
    }
    if (recipientCount == null) {
      toast.info("Loading recipient count…");
      return;
    }
    setSendDialogOpen(true);
  };

  const confirmSend = () => {
    startTransition(async () => {
      setSendDialogOpen(false);
      let id = campaignId;
      if (!id) {
        const draft = await saveDraft({
          subject,
          bodyJson,
          audienceType,
          audiencePayload: payload,
        });
        if (!draft.ok) {
          toast.error(draft.error);
          return;
        }
        id = draft.campaignId;
      }
      const result = await sendCampaign({
        campaignId: id,
        subject,
        bodyJson,
        audienceType,
        audiencePayload: payload,
      });
      if (result.ok) {
        toast.success(`Campaign sent to ${result.sent} recipients.`);
        router.push("/admin/mail");
      } else {
        toast.error(result.error);
        if (result.partial != null) {
          toast.info(`Partial send: ${result.partial} emails sent.`);
        }
        // Stay on this campaign so a retry targets it (not a new draft) and
        // the page reflects any partial progress.
        if (!campaignId) router.replace(`/admin/mail/compose/${id}`);
        else router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audience</CardTitle>
          <CardDescription>Choose who will receive this campaign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={audienceType}
              onValueChange={(v) => {
                setAudienceType(v);
                setRecipientCount(null);
              }}
              disabled={isLocked}
            >
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {audienceType === "CourseStudents" && (
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId} disabled={isLocked}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {audienceType === "CategoryStudents" && (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isLocked}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {audienceType === "LevelStudents" && (
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel} disabled={isLocked}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {audienceType === "Manual" && (
            <div className="space-y-2">
              <Label>Email addresses</Label>
              <Textarea
                value={manualEmailsText}
                onChange={(e) => setManualEmailsText(e.target.value)}
                placeholder={"One per line or comma-separated\ne.g. user@example.com, other@site.com"}
                disabled={isLocked}
                className="min-h-[120px] font-mono text-sm"
                maxLength={10000}
              />
              <p className="text-xs text-muted-foreground">
                {manualEmails.length} valid email{manualEmails.length !== 1 ? "s" : ""} will receive this campaign.
              </p>
            </div>
          )}
          {canResolveAudience && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadRecipientCount}
                disabled={isPending}
              >
                {recipientCount != null ? "Refresh count" : "Get recipient count"}
              </Button>
              {recipientCount != null && (
                <span className="text-sm text-muted-foreground">
                  This will be sent to <strong>{recipientCount}</strong> recipients.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject</CardTitle>
          <CardDescription>Email subject line.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
            disabled={isLocked}
            className="max-w-xl"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Body</CardTitle>
          <CardDescription>Rich text content. Use the toolbar to format.</CardDescription>
        </CardHeader>
        <CardContent>
          <MailBodyEditor
            key={campaignId ?? "new"}
            value={bodyJson}
            onChange={setBodyJson}
            readOnly={isLocked}
          />
        </CardContent>
      </Card>

      {isPartiallySent && (
        <p className="text-sm text-muted-foreground">
          This campaign was partially sent ({sentCount} recipient{sentCount === 1 ? "" : "s"} received
          it). Sending again delivers the same email only to recipients who have not received it yet.
        </p>
      )}

      {!isSent && (
        <div className="flex flex-wrap gap-2">
          {!isPartiallySent && (
            <Button onClick={handleSaveDraft} disabled={isPending}>
              Save draft
            </Button>
          )}
          <Button variant="outline" onClick={handlePreview} disabled={isPending}>
            Send preview
          </Button>
          <Button
            variant="default"
            onClick={handleSend}
            disabled={
              isPending ||
              !subject.trim() ||
              !bodyJson.trim() ||
              !canResolveAudience ||
              recipientCount === null ||
              recipientCount === 0
            }
          >
            {isPartiallySent ? "Send to remaining recipients" : "Send campaign"}
          </Button>
        </div>
      )}

      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send campaign</AlertDialogTitle>
            <AlertDialogDescription>
              {isPartiallySent
                ? `Send to the recipients who have not received this campaign yet (${sentCount} already sent)? This cannot be undone.`
                : `Send to ${recipientCount ?? "..."} recipients? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSend} disabled={isPending}>
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
