"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  MailCheck,
  RotateCw,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { formatNumber, pluralize } from "@/app/admin/_lib/format";
import type { AudiencePayload } from "@/app/data/admin/get-mail-recipients";
import {
  getRecipientCountAction,
  getUnsentRecipientCountAction,
  saveDraft,
  sendCampaign,
  sendPreview,
} from "../actions";
import {
  AUDIENCE_OPTIONS,
  LEVEL_OPTIONS,
  describeAudience,
  hasBodyContent,
  parseManualEmails,
  type CampaignStatus,
} from "../_lib/campaign";
import { CampaignPreviewDialog } from "./CampaignPreviewDialog";
import { MailBodyEditor } from "./MailBodyEditor";

/** Keep in sync with SUBJECT_MAX_LENGTH in ../actions.ts. */
const SUBJECT_MAX_LENGTH = 255;
const MANUAL_EMAILS_MAX_LENGTH = 10000;
const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

const IDS = {
  subject: "campaign-subject",
  subjectError: "campaign-subject-error",
  bodyLabel: "campaign-body-label",
  bodyError: "campaign-body-error",
  audienceHeading: "campaign-audience-heading",
  audienceHelp: "campaign-audience-help",
  audienceError: "campaign-audience-error",
  course: "campaign-audience-course",
  category: "campaign-audience-category",
  level: "campaign-audience-level",
  manual: "campaign-audience-emails",
  manualHelp: "campaign-audience-emails-help",
  sendHeading: "campaign-send-heading",
} as const;

type Course = { id: string; title: string };
type Pending = "save" | "test" | "check" | "send" | null;
type ValidationMode = "draft" | "send" | "test";
type FieldErrors = { subject?: string; body?: string; audience?: string };
type CountResult =
  | { key: string; status: "ready"; count: number }
  | { key: string; status: "error"; message: string };
type CountState = { status: "idle" } | { status: "loading" } | CountResult;

type ComposeFormProps = {
  campaignId?: string;
  status?: CampaignStatus;
  initialSubject: string;
  initialBodyJson: string;
  /** Stored HTML, shown when an older campaign has no editor JSON. */
  initialBodyHtml?: string;
  initialAudienceType: string;
  initialAudiencePayload?: AudiencePayload;
  /** Course the campaign targets, even if it is no longer published. */
  audienceCourse?: Course | null;
  courses: Course[];
  categories: string[];
  /** Recipients who have already received the campaign. */
  sentCount?: number;
  sentAtLabel?: string | null;
  /** For partially sent campaigns: recipients a retry would still reach. */
  unsentCount?: number | null;
};

function buildPayload(
  audienceType: string,
  values: { courseId: string; category: string; level: string; emails: string[] }
): AudiencePayload | undefined {
  if (audienceType === "CourseStudents" && values.courseId) return { courseId: values.courseId };
  if (audienceType === "CategoryStudents" && values.category) return { category: values.category };
  if (audienceType === "LevelStudents" && values.level) return { level: values.level };
  if (audienceType === "Manual" && values.emails.length > 0) return { emails: values.emails };
  return undefined;
}

function invalidEmailsMessage(invalid: string[]): string {
  const shown = invalid.slice(0, 3).map((e) => `"${e}"`).join(", ");
  const more = invalid.length > 3 ? ` and ${formatNumber(invalid.length - 3)} more` : "";
  return `Fix or remove ${invalid.length === 1 ? "this entry, which isn't" : "these entries, which aren't"} a valid email address: ${shown}${more}.`;
}

function ActionButton({
  pending,
  icon: Icon,
  children,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean; icon: ComponentType<{ className?: string }> }) {
  return (
    <Button aria-busy={pending || undefined} {...props}>
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Icon aria-hidden="true" />}
      {children}
    </Button>
  );
}

function Callout({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "success" | "warning";
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="note"
      className={
        tone === "success"
          ? "flex gap-3 rounded-xl border border-emerald-600/25 bg-emerald-500/10 p-4 text-sm"
          : "flex gap-3 rounded-xl border border-amber-600/30 bg-amber-500/10 p-4 text-sm"
      }
    >
      <Icon
        className={
          tone === "success"
            ? "mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400"
            : "mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
        }
        aria-hidden="true"
      />
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{title}</p>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

export function ComposeForm({
  campaignId,
  status = "draft",
  initialSubject,
  initialBodyJson,
  initialBodyHtml,
  initialAudienceType,
  initialAudiencePayload,
  audienceCourse,
  courses,
  categories,
  sentCount = 0,
  sentAtLabel,
  unsentCount,
}: ComposeFormProps) {
  const router = useRouter();
  const isSent = status === "sent";
  const isPartiallySent = status === "partial";
  // Content and audience are locked once anyone has received the campaign.
  const isLocked = status !== "draft";

  const [subject, setSubject] = useState(initialSubject);
  const [bodyJson, setBodyJson] = useState(initialBodyJson);
  const [audienceType, setAudienceType] = useState(initialAudienceType);
  const [courseId, setCourseId] = useState(initialAudiencePayload?.courseId ?? "");
  const [category, setCategory] = useState(initialAudiencePayload?.category ?? "");
  const [level, setLevel] = useState(initialAudiencePayload?.level ?? "");
  const [manualEmailsText, setManualEmailsText] = useState(
    initialAudiencePayload?.emails?.join("\n") ?? ""
  );

  const [pending, setPending] = useState<Pending>(null);
  const [isNavigating, startNavigation] = useTransition();
  const busy = pending !== null || isNavigating;
  const [validationMode, setValidationMode] = useState<ValidationMode | null>(null);
  const [countResult, setCountResult] = useState<CountResult | null>(null);
  const [countAttempt, setCountAttempt] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);

  const subjectRef = useRef<HTMLInputElement>(null);

  const courseOptions = useMemo(
    () =>
      audienceCourse && !courses.some((c) => c.id === audienceCourse.id)
        ? [...courses, { id: audienceCourse.id, title: `${audienceCourse.title} (unpublished)` }]
        : courses,
    [courses, audienceCourse]
  );
  const courseTitle = courseOptions.find((c) => c.id === courseId)?.title ?? audienceCourse?.title ?? null;

  const manual = useMemo(() => parseManualEmails(manualEmailsText), [manualEmailsText]);
  const manualKey = manual.valid.join(",");
  const payload = buildPayload(audienceType, { courseId, category, level, emails: manual.valid });
  const audienceSummary = describeAudience(audienceType, payload, courseTitle);
  const bodyHasContent = hasBodyContent(bodyJson);

  const audienceComplete =
    audienceType === "Subscribers" ||
    audienceType === "AllStudents" ||
    audienceType === "AllTeachers" ||
    (audienceType === "CourseStudents" && !!courseId) ||
    (audienceType === "CategoryStudents" && !!category) ||
    (audienceType === "LevelStudents" && !!level) ||
    (audienceType === "Manual" && manualKey.length > 0);

  // Live recipient count for drafts. The count is "loading" whenever the latest
  // result belongs to a different audience selection.
  const countKey = JSON.stringify([audienceType, courseId, category, level, manualKey, countAttempt]);
  const countState: CountState = !audienceComplete
    ? { status: "idle" }
    : countResult?.key === countKey
      ? countResult
      : { status: "loading" };

  useEffect(() => {
    if (isLocked || !audienceComplete) return;
    let cancelled = false;
    // Debounced so typing manual addresses doesn't fire a request per keystroke.
    const timer = setTimeout(() => {
      const emails = manualKey ? manualKey.split(",") : [];
      getRecipientCountAction(audienceType, buildPayload(audienceType, { courseId, category, level, emails }))
        .then((result) => {
          if (cancelled) return;
          setCountResult(
            result.status === "success"
              ? { key: countKey, status: "ready", count: result.count }
              : { key: countKey, status: "error", message: result.message }
          );
        })
        .catch(() => {
          if (!cancelled) setCountResult({ key: countKey, status: "error", message: NETWORK_ERROR });
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isLocked, audienceComplete, countKey, audienceType, courseId, category, level, manualKey]);

  function validate(mode: ValidationMode): FieldErrors {
    const errors: FieldErrors = {};
    if (!subject.trim()) errors.subject = "Enter a subject line.";
    if (mode !== "draft" && !bodyHasContent) {
      errors.body = mode === "test" ? "Write the message before sending a test." : "Write the message before sending.";
    }
    if (mode === "test" || isLocked) return errors;

    if (audienceType === "Manual") {
      if (manual.invalid.length > 0) errors.audience = invalidEmailsMessage(manual.invalid);
      else if (mode === "send" && manual.valid.length === 0) errors.audience = "Enter at least one email address.";
    } else if (mode === "send") {
      if (audienceType === "CourseStudents" && !courseId) errors.audience = "Choose a course.";
      if (audienceType === "CategoryStudents" && !category) errors.audience = "Choose a category.";
      if (audienceType === "LevelStudents" && !level) errors.audience = "Choose a level.";
    }
    return errors;
  }

  const errors: FieldErrors = validationMode ? validate(validationMode) : {};

  function audienceControlId(): string | null {
    switch (audienceType) {
      case "CourseStudents":
        return IDS.course;
      case "CategoryStudents":
        return IDS.category;
      case "LevelStudents":
        return IDS.level;
      case "Manual":
        return IDS.manual;
      default:
        return null;
    }
  }

  /** Validates for `mode`; focuses the first invalid field and returns false if any. */
  function checkValid(mode: ValidationMode): boolean {
    setValidationMode(mode);
    const found = validate(mode);
    if (found.subject) {
      subjectRef.current?.focus();
    } else if (found.body) {
      document.querySelector<HTMLElement>(`[aria-labelledby="${IDS.bodyLabel}"]`)?.focus();
    } else if (found.audience) {
      const id = audienceControlId();
      if (id) document.getElementById(id)?.focus();
    }
    return !found.subject && !found.body && !found.audience;
  }

  const handleSaveDraft = async () => {
    if (!checkValid("draft")) return;
    setPending("save");
    try {
      const result = await saveDraft({ campaignId, subject, bodyJson, audienceType, audiencePayload: payload });
      if (result.status === "success") {
        toast.success(result.message);
        setValidationMode(null);
        if (!campaignId) startNavigation(() => router.replace(`/admin/mail/compose/${result.campaignId}`));
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(NETWORK_ERROR);
    } finally {
      setPending(null);
    }
  };

  const handleSendTest = async () => {
    if (!checkValid("test")) return;
    setPending("test");
    try {
      const result = await sendPreview({ subject, bodyJson });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error(NETWORK_ERROR);
    } finally {
      setPending(null);
    }
  };

  /** Fetches the up-to-date recipient count, then asks for confirmation. */
  const handleSendClick = async () => {
    if (!isPartiallySent && !checkValid("send")) return;
    setPending("check");
    try {
      const result =
        isPartiallySent && campaignId
          ? await getUnsentRecipientCountAction(campaignId)
          : await getRecipientCountAction(audienceType, payload);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      if (!isPartiallySent) setCountResult({ key: countKey, status: "ready", count: result.count });
      if (result.count === 0 && !isPartiallySent) {
        toast.error("No one matches this audience yet, so there is nobody to send to.");
        return;
      }
      setConfirmCount(result.count);
      setConfirmOpen(true);
    } catch {
      toast.error(NETWORK_ERROR);
    } finally {
      setPending(null);
    }
  };

  const confirmSend = async (): Promise<boolean> => {
    setPending("send");
    try {
      let id = campaignId;
      if (!id) {
        const draft = await saveDraft({ subject, bodyJson, audienceType, audiencePayload: payload });
        if (draft.status === "error") {
          toast.error(draft.message);
          return true;
        }
        id = draft.campaignId;
      }
      const result = await sendCampaign({ campaignId: id, subject, bodyJson, audienceType, audiencePayload: payload });
      if (result.status === "success") {
        toast.success(result.message);
        startNavigation(() => router.push("/admin/mail"));
        return true;
      }
      if (result.partial) {
        toast.warning(result.message, { duration: 15000 });
      } else {
        toast.error(result.message);
      }
      // Stay on this campaign so a retry targets it (not a new draft) and the
      // page reflects any partial progress.
      const target = id;
      startNavigation(() => {
        if (!campaignId) router.replace(`/admin/mail/compose/${target}`);
        else router.refresh();
      });
      return true;
    } catch {
      toast.error(
        "Lost contact with the server while sending. Reload the campaign to see how many recipients received it before retrying."
      );
      startNavigation(() => router.refresh());
      return true;
    } finally {
      setPending(null);
    }
  };

  const confirmTitle = isPartiallySent
    ? confirmCount === 0
      ? "Mark campaign as sent?"
      : "Send to unsent recipients?"
    : "Send campaign?";
  const confirmLabel =
    confirmCount === 0 ? "Mark as sent" : `Send to ${pluralize(confirmCount, "recipient")}`;
  const subjectForDialog = subject.trim() || "(No subject)";
  const confirmDescription = isPartiallySent ? (
    confirmCount === 0 ? (
      <p>
        Everyone in this campaign&apos;s audience has already received it. Confirming marks it as fully sent.
      </p>
    ) : (
      <>
        <p>
          Send &ldquo;{subjectForDialog}&rdquo; to the <strong>{pluralize(confirmCount, "recipient")}</strong> who
          haven&apos;t received it yet? The {pluralize(sentCount, "person", "people")} who already received it will be
          skipped. This can&apos;t be undone.
        </p>
        <p className="mt-2">Large sends go out in batches and can take a few minutes. Keep this tab open.</p>
      </>
    )
  ) : (
    <>
      <p>
        Send &ldquo;{subjectForDialog}&rdquo; to <strong>{pluralize(confirmCount, "recipient")}</strong> (
        {audienceSummary})? This can&apos;t be undone.
      </p>
      <p className="mt-2">Large sends go out in batches and can take a few minutes. Keep this tab open.</p>
    </>
  );

  const showPreviewButton = (
    <ActionButton
      type="button"
      variant="outline"
      icon={Eye}
      pending={false}
      onClick={() => setPreviewOpen(true)}
      disabled={busy}
      className="w-full"
    >
      Preview
    </ActionButton>
  );

  const testButton = (
    <ActionButton
      type="button"
      variant="outline"
      icon={MailCheck}
      pending={pending === "test"}
      onClick={handleSendTest}
      disabled={busy}
      className="w-full"
    >
      {pending === "test" ? "Sending test…" : "Send test email"}
    </ActionButton>
  );

  return (
    <div className="space-y-6">
      {isSent && (
        <Callout tone="success" icon={CheckCircle2} title="This campaign has been sent">
          {sentAtLabel ? `Sent on ${sentAtLabel} ` : "Sent "}to {pluralize(sentCount, "recipient")}. Sent campaigns
          are read-only.
        </Callout>
      )}
      {isPartiallySent && (
        <Callout tone="warning" icon={AlertTriangle} title="This campaign was only partially sent">
          {`${pluralize(sentCount, "recipient")} received it before sending stopped`}
          {typeof unsentCount === "number" && unsentCount > 0
            ? `; ${pluralize(unsentCount, "recipient")} still ${unsentCount === 1 ? "hasn't" : "haven't"} received it.`
            : "."}{" "}
          Retrying sends the same email only to people who haven&apos;t received it. The message and audience can no
          longer be changed.
        </Callout>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Message */}
        <Card className="min-w-0 gap-5">
          <CardHeader>
            <h2 className="leading-none font-semibold">Message</h2>
            <CardDescription>
              {isLocked ? "What recipients received." : "The subject line and body recipients will see."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLocked ? (
              <dl className="space-y-2">
                <dt className="text-sm leading-none font-medium">Subject</dt>
                <dd className="rounded-md border bg-muted/40 px-3 py-2 text-sm break-words">
                  {subject.trim() || "(No subject)"}
                </dd>
              </dl>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={IDS.subject}>Subject</Label>
                <Input
                  ref={subjectRef}
                  id={IDS.subject}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. New courses this month"
                  maxLength={SUBJECT_MAX_LENGTH}
                  autoComplete="off"
                  disabled={busy}
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? IDS.subjectError : undefined}
                  required
                />
                <FieldError id={IDS.subjectError} message={errors.subject} />
              </div>
            )}

            <div className="space-y-2">
              <p id={IDS.bodyLabel} className="text-sm leading-none font-medium">
                Body
              </p>
              <MailBodyEditor
                key={campaignId ?? "new"}
                value={bodyJson}
                onChange={setBodyJson}
                readOnly={isLocked}
                disabled={busy}
                fallbackHtml={initialBodyHtml}
                labelledBy={IDS.bodyLabel}
                describedBy={errors.body ? IDS.bodyError : undefined}
                invalid={!!errors.body}
              />
              <FieldError id={IDS.bodyError} message={errors.body} />
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          {/* Audience */}
          {isLocked ? null : (
            <Card className="gap-5">
              <CardHeader>
                <h2 id={IDS.audienceHeading} className="leading-none font-semibold">
                  Audience
                </h2>
                <CardDescription id={IDS.audienceHelp}>
                  Unsubscribed addresses and banned accounts are always skipped.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={audienceType}
                  onValueChange={setAudienceType}
                  disabled={busy}
                  aria-labelledby={IDS.audienceHeading}
                  aria-describedby={IDS.audienceHelp}
                  className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"
                >
                  {AUDIENCE_OPTIONS.map((option) => {
                    const id = `campaign-audience-${option.value}`;
                    return (
                      <label
                        key={option.value}
                        htmlFor={id}
                        className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                      >
                        <RadioGroupItem
                          id={id}
                          value={option.value}
                          className="mt-0.5"
                          aria-describedby={`${id}-description`}
                        />
                        <span className="grid min-w-0 gap-1">
                          <span className="text-sm leading-tight font-medium">{option.label}</span>
                          <span id={`${id}-description`} className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>

                {audienceType === "CourseStudents" && (
                  <div className="space-y-2">
                    <Label htmlFor={IDS.course}>Course</Label>
                    <Select value={courseId} onValueChange={setCourseId} disabled={busy || courseOptions.length === 0}>
                      <SelectTrigger
                        id={IDS.course}
                        className="w-full"
                        aria-invalid={!!errors.audience}
                        aria-describedby={errors.audience ? IDS.audienceError : undefined}
                      >
                        <SelectValue placeholder={courseOptions.length ? "Select a course" : "No published courses"} />
                      </SelectTrigger>
                      <SelectContent>
                        {courseOptions.map((c) => (
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
                    <Label htmlFor={IDS.category}>Category</Label>
                    <Select value={category} onValueChange={setCategory} disabled={busy || categories.length === 0}>
                      <SelectTrigger
                        id={IDS.category}
                        className="w-full"
                        aria-invalid={!!errors.audience}
                        aria-describedby={errors.audience ? IDS.audienceError : undefined}
                      >
                        <SelectValue placeholder={categories.length ? "Select a category" : "No categories yet"} />
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
                    <Label htmlFor={IDS.level}>Course level</Label>
                    <Select value={level} onValueChange={setLevel} disabled={busy}>
                      <SelectTrigger
                        id={IDS.level}
                        className="w-full"
                        aria-invalid={!!errors.audience}
                        aria-describedby={errors.audience ? IDS.audienceError : undefined}
                      >
                        <SelectValue placeholder="Select a level" />
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
                    <Label htmlFor={IDS.manual}>Email addresses</Label>
                    <Textarea
                      id={IDS.manual}
                      value={manualEmailsText}
                      onChange={(e) => setManualEmailsText(e.target.value)}
                      placeholder={"One per line, or separated by commas\nname@example.com, other@example.com"}
                      disabled={busy}
                      className="min-h-[120px] font-mono text-sm"
                      maxLength={MANUAL_EMAILS_MAX_LENGTH}
                      spellCheck={false}
                      aria-invalid={!!errors.audience}
                      aria-describedby={errors.audience ? `${IDS.manualHelp} ${IDS.audienceError}` : IDS.manualHelp}
                    />
                    <p id={IDS.manualHelp} className="text-xs text-muted-foreground" aria-live="polite">
                      {pluralize(manual.valid.length, "valid address", "valid addresses")}
                      {manual.invalid.length > 0 ? ` · ${pluralize(manual.invalid.length, "invalid entry", "invalid entries")}` : ""}
                    </p>
                  </div>
                )}

                <FieldError id={IDS.audienceError} message={errors.audience} />
              </CardContent>
            </Card>
          )}

          {/* Review and send / delivery */}
          <Card id="send" className="scroll-mt-20 gap-5">
            <CardHeader>
              <h2 id={IDS.sendHeading} className="leading-none font-semibold">
                {isLocked ? "Delivery" : "Review and send"}
              </h2>
              <CardDescription>
                {isLocked ? "Who this campaign went to." : "Check who will receive it before sending."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLocked ? (
                <dl className="grid gap-3 text-sm">
                  <div className="space-y-0.5">
                    <dt className="text-muted-foreground">Audience</dt>
                    <dd className="font-medium break-words">{audienceSummary}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Received it</dt>
                    <dd className="font-medium tabular-nums">{formatNumber(sentCount)}</dd>
                  </div>
                  {isPartiallySent && typeof unsentCount === "number" && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Not yet received</dt>
                      <dd className="font-medium tabular-nums">{formatNumber(unsentCount)}</dd>
                    </div>
                  )}
                  {isSent && sentAtLabel && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Sent</dt>
                      <dd className="text-right font-medium">{sentAtLabel}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <div className="rounded-lg border bg-muted/40 p-3" aria-live="polite">
                  <p className="text-xs text-muted-foreground">Estimated recipients</p>
                  {countState.status === "ready" && (
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {formatNumber(countState.count)}
                      <span className="sr-only"> {countState.count === 1 ? "recipient" : "recipients"}</span>
                    </p>
                  )}
                  {countState.status === "loading" && (
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Counting recipients…
                    </p>
                  )}
                  {countState.status === "idle" && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Finish choosing the audience to see how many people will receive this.
                    </p>
                  )}
                  {countState.status === "error" && (
                    <div className="mt-1 space-y-2">
                      <p className="text-sm text-destructive">{countState.message}</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => setCountAttempt((n) => n + 1)}>
                        <RotateCw aria-hidden="true" />
                        Try again
                      </Button>
                    </div>
                  )}
                  <p className="mt-1 text-sm break-words">{audienceSummary}</p>
                  {countState.status === "ready" && countState.count === 0 && (
                    <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                      No one matches this audience yet.
                    </p>
                  )}
                </div>
              )}

              {!isSent && (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <ActionButton
                    type="button"
                    icon={isPartiallySent ? RotateCw : Send}
                    pending={pending === "check" || pending === "send"}
                    onClick={handleSendClick}
                    disabled={busy}
                    className="w-full"
                  >
                    {pending === "check"
                      ? "Checking recipients…"
                      : pending === "send"
                        ? "Sending…"
                        : isPartiallySent
                          ? "Retry unsent recipients"
                          : "Send campaign"}
                  </ActionButton>
                  {!isPartiallySent && (
                    <ActionButton
                      type="button"
                      variant="outline"
                      icon={Save}
                      pending={pending === "save"}
                      onClick={handleSaveDraft}
                      disabled={busy}
                      className="w-full"
                    >
                      {pending === "save" ? "Saving…" : "Save draft"}
                    </ActionButton>
                  )}
                  {showPreviewButton}
                  {testButton}
                </div>
              )}
              {isSent && showPreviewButton}
              {!isSent && (
                <p className="text-xs text-muted-foreground">Test emails go only to your own inbox.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CampaignPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        campaignId={campaignId}
        subject={subject}
        bodyJson={bodyJson}
        audience={audienceSummary}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        onConfirm={confirmSend}
      />
    </div>
  );
}
