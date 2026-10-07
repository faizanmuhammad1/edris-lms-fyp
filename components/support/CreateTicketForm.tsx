"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupportTicket } from "@/app/data/support/create-ticket";
import { ticketPriorityOptions } from "@/app/data/support/schemas";
import { toast } from "sonner";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
}

interface CreateTicketFormProps {
  role: "student" | "teacher" | "admin";
  backHref: string;
  courses?: Course[];
  categoryOptions: readonly { value: string; label: string }[];
  /** Show the "Back to tickets" link above the form (default true). Hide it when the page header has one. */
  showBackLink?: boolean;
  /** Show the card title/description (default true). Hide it when the page already has a PageHeader. */
  showHeader?: boolean;
}

// Mirrors createTicketSchema (app/data/support/schemas.ts), which the server enforces.
const SUBJECT_MIN = 3;
const SUBJECT_MAX = 100;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 5000;

type FieldErrors = Partial<Record<"subject" | "category" | "description", string>>;

function validate(subject: string, category: string, description: string): FieldErrors {
  const errors: FieldErrors = {};
  const s = subject.trim();
  const d = description.trim();
  if (s.length < SUBJECT_MIN) errors.subject = `Subject must be at least ${SUBJECT_MIN} characters.`;
  else if (s.length > SUBJECT_MAX) errors.subject = `Subject must be ${SUBJECT_MAX} characters or fewer.`;
  if (!category) errors.category = "Choose a category.";
  if (d.length < DESCRIPTION_MIN) errors.description = `Description must be at least ${DESCRIPTION_MIN} characters.`;
  else if (d.length > DESCRIPTION_MAX) errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
  return errors;
}

export function CreateTicketForm({
  role,
  backHref,
  courses = [],
  categoryOptions,
  showBackLink = true,
  showHeader = true,
}: CreateTicketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const id = useId();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [courseId, setCourseId] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const showCourseSelector =
    courses.length > 0 && (category === "CourseRelated" || category === "AssignmentGrading");

  // Errors appear after the first submit attempt and then update as the user types.
  const liveErrors: FieldErrors = submitted ? validate(subject, category, description) : {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const nextErrors = validate(subject, category, description);
    setSubmitted(true);
    if (Object.keys(nextErrors).length > 0) {
      const firstField = (["subject", "category", "description"] as const).find((f) => nextErrors[f]);
      if (firstField) document.getElementById(`${id}-${firstField}`)?.focus();
      return;
    }

    startTransition(async () => {
      try {
        const result = await createSupportTicket({
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
          courseId: showCourseSelector && courseId ? courseId : null,
        });

        if (result.success) {
          toast.success(`Ticket ${result.ticketNumber} created. We'll get back to you soon.`);
          router.push(backHref);
        }
      } catch {
        // Server errors are not shown verbatim (production hides their details).
        toast.error("We couldn't create your ticket. Please check the form and try again.");
      }
    });
  };

  const errorId = (field: keyof FieldErrors) => `${id}-${field}-error`;
  const describedBy = (field: keyof FieldErrors, hintId?: string) =>
    [liveErrors[field] ? errorId(field) : null, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {showBackLink && (
        <div className="mb-4">
          <Link
            href={backHref}
            className="-ml-2 inline-flex min-h-10 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
            Back to tickets
          </Link>
        </div>
      )}

      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle>Create Support Ticket</CardTitle>
            <CardDescription>
              {role === "student"
                ? "Describe your issue and we'll route it to the right person to help you."
                : role === "teacher"
                  ? "Submit a ticket to the platform admin for assistance."
                  : "Create a ticket to track an issue or task."}
            </CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <p className="text-xs text-muted-foreground">
              Fields marked <span className="text-destructive">*</span> are required.
            </p>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor={`${id}-subject`}>
                Subject <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id={`${id}-subject`}
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isPending}
                maxLength={SUBJECT_MAX}
                required
                aria-invalid={!!liveErrors.subject || undefined}
                aria-describedby={describedBy("subject")}
                className="h-10"
              />
              {liveErrors.subject && (
                <p id={errorId("subject")} className="text-sm text-destructive">
                  {liveErrors.subject}
                </p>
              )}
            </div>

            {/* Category & Priority row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${id}-category`}>
                  Category <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} disabled={isPending}>
                  <SelectTrigger
                    id={`${id}-category`}
                    className="h-10 w-full data-[size=default]:h-10"
                    aria-invalid={!!liveErrors.category || undefined}
                    aria-describedby={describedBy("category")}
                    aria-required="true"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {liveErrors.category && (
                  <p id={errorId("category")} className="text-sm text-destructive">
                    {liveErrors.category}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${id}-priority`}>Priority</Label>
                <Select value={priority} onValueChange={setPriority} disabled={isPending}>
                  <SelectTrigger id={`${id}-priority`} className="h-10 w-full data-[size=default]:h-10">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketPriorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Course selector */}
            {showCourseSelector && (
              <div className="space-y-2">
                <Label htmlFor={`${id}-course`}>Related course</Label>
                <Select value={courseId} onValueChange={setCourseId} disabled={isPending}>
                  <SelectTrigger id={`${id}-course`} className="h-10 w-full data-[size=default]:h-10">
                    <SelectValue placeholder="Select a course (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Course questions are routed to the course instructor.
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor={`${id}-description`}>
                Description <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Textarea
                id={`${id}-description`}
                placeholder="Provide details about your issue. The more information you share, the faster we can help."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                rows={6}
                className="resize-y"
                maxLength={DESCRIPTION_MAX}
                required
                aria-invalid={!!liveErrors.description || undefined}
                aria-describedby={describedBy("description", `${id}-description-count`)}
              />
              <div className="flex items-start justify-between gap-3">
                {liveErrors.description ? (
                  <p id={errorId("description")} className="text-sm text-destructive">
                    {liveErrors.description}
                  </p>
                ) : (
                  <span />
                )}
                <p id={`${id}-description-count`} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {description.length}/{DESCRIPTION_MAX}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.push(backHref)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending} aria-busy={isPending} className={cn(isPending && "cursor-wait")}>
                {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                {isPending ? "Submitting…" : "Submit ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
