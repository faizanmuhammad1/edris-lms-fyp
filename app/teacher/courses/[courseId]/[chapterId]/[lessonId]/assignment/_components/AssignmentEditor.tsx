"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assignmentSchema, ALLOWED_FILE_TYPE_OPTIONS, type AssignmentSchemaType } from "@/lib/zodSchemas";
import type { TeacherAssignmentType } from "@/app/data/teacher/get-teacher-assignment";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { createOrUpdateAssignment } from "../actions";
import { SubmissionsList } from "./SubmissionsList";

const BYTES_PER_MB = 1024 * 1024;

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  image: "Images",
  word: "Word documents",
  text: "Text files",
  zip: "ZIP archives",
};

/** Friendlier messages for the shared assignment schema's numeric fields. */
const assignmentErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.path[0]) {
    case "maxScore":
      if (issue.code === "too_small") return { message: "Max points can't be negative" };
      if (issue.code === "too_big") return { message: "Max points can be at most 10,000" };
      return { message: "Max points must be a whole number" };
    case "maxFileSizeBytes":
      if (issue.code === "too_small") return { message: "Max file size can't be negative" };
      if (issue.code === "too_big") return { message: "Max file size can be at most 100 MB" };
      return { message: "Enter the max file size in whole megabytes" };
    case "maxTextLength":
      if (issue.code === "too_small") return { message: "Max text length can't be negative" };
      if (issue.code === "too_big") return { message: "Max text length can be at most 100,000 characters" };
      return { message: "Max text length must be a whole number" };
    default:
      return { message: ctx.defaultError };
  }
};

/** Format a Date as a `datetime-local` input value in the browser's local timezone. */
function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** Parses a number input: empty -> undefined, otherwise the raw number (validated by the schema). */
function parseNumberInput(value: string, valueAsNumber: number): number | undefined {
  return value === "" || Number.isNaN(valueAsNumber) ? undefined : valueAsNumber;
}

interface AssignmentEditorProps {
  lessonId: string;
  courseId: string;
  chapterId: string;
  initialData: TeacherAssignmentType;
}

export function AssignmentEditor({ lessonId, initialData }: AssignmentEditorProps) {
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const assignment = initialData.assignment;

  const form = useForm<AssignmentSchemaType>({
    resolver: zodResolver(assignmentSchema, { errorMap: assignmentErrorMap, path: [], async: false }),
    defaultValues: {
      title: assignment?.title ?? "Assignment",
      description: assignment?.description ?? undefined,
      dueDate: assignment?.dueDate ? toLocalDateTimeInputValue(new Date(assignment.dueDate)) : undefined,
      maxScore: assignment?.maxScore ?? undefined,
      allowFile: assignment?.allowFile ?? true,
      allowText: assignment?.allowText ?? false,
      autoGradeEnabled: assignment?.autoGradeEnabled ?? false,
      allowedFileTypes: assignment?.allowedFileTypes ?? null,
      maxFileSizeBytes: assignment?.maxFileSizeBytes ?? undefined,
      maxTextLength: assignment?.maxTextLength ?? undefined,
    },
  });

  const allowFile = useWatch({ control: form.control, name: "allowFile" });
  const allowText = useWatch({ control: form.control, name: "allowText" });
  const dueDate = useWatch({ control: form.control, name: "dueDate" });
  const hasDueDate = dueDate !== undefined;
  const submissionTypeError = form.formState.errors.allowFile?.message;

  function onSubmit(values: AssignmentSchemaType) {
    // datetime-local values have no timezone; interpret in the teacher's local
    // timezone and send an absolute ISO timestamp to the server.
    let dueDateIso: string | undefined;
    if (values.dueDate !== undefined) {
      const parsed = values.dueDate ? new Date(values.dueDate) : null;
      if (!parsed || Number.isNaN(parsed.getTime())) {
        form.setError("dueDate", {
          message: "Choose a due date and time, or turn off “Set a due date”.",
        });
        form.setFocus("dueDate");
        return;
      }
      dueDateIso = parsed.toISOString();
    }

    startTransition(async () => {
      try {
        const result = await createOrUpdateAssignment(lessonId, { ...values, dueDate: dueDateIso });
        if (result.status === "success") {
          toast.success(assignment ? "Assignment saved" : "Assignment created");
          form.reset(values);
          router.refresh();
        } else {
          form.setError("root", { message: result.message });
          toast.error(result.message);
        }
      } catch {
        const message = "Couldn't save the assignment. Please try again.";
        form.setError("root", { message });
        toast.error(message);
      }
    });
  }

  function onInvalid() {
    toast.error("Please fix the highlighted fields.");
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <div className="space-y-6">
      <section aria-labelledby={`${id}-heading`} className="min-w-0">
        <Card className="min-w-0">
          <CardHeader>
            <h2 id={`${id}-heading`} className="text-lg font-semibold leading-none">
              Assignment details
            </h2>
            <CardDescription>
              Students see the title and instructions on the lesson page and can submit a file, text, or both.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8" noValidate>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Build a to-do list app" className="h-10" disabled={pending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Instructions</FormLabel>
                      <FormDescription>
                        Explain what students should hand in. Required when AI auto-grading is on.
                      </FormDescription>
                      <FormControl>
                        <div role="group" aria-label="Assignment instructions" className="min-w-0">
                          <RichTextEditor field={field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor={`${id}-has-due`}>Set a due date</Label>
                        <p className="text-sm text-muted-foreground" id={`${id}-has-due-help`}>
                          {hasDueDate
                            ? "Students see the deadline; late submissions are marked late."
                            : "Always open, no deadline."}
                        </p>
                      </div>
                      <Switch
                        id={`${id}-has-due`}
                        aria-describedby={`${id}-has-due-help`}
                        checked={hasDueDate}
                        disabled={pending}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Default to the same time tomorrow
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            form.setValue("dueDate", toLocalDateTimeInputValue(tomorrow), { shouldDirty: true });
                          } else {
                            form.setValue("dueDate", undefined, { shouldDirty: true });
                            form.clearErrors("dueDate");
                          }
                        }}
                      />
                    </div>
                    {hasDueDate && (
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due date and time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                className="h-10"
                                disabled={pending}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormDescription>Uses your device&apos;s local time.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max points (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={10000}
                            step={1}
                            placeholder="e.g. 100"
                            className="h-10"
                            disabled={pending}
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(parseNumberInput(e.target.value, e.target.valueAsNumber))}
                          />
                        </FormControl>
                        <FormDescription>Whole number. Leave empty to grade without a points limit.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <fieldset className="space-y-3" aria-describedby={submissionTypeError ? `${id}-types-error` : undefined}>
                  <legend className="text-sm font-medium">What can students submit?</legend>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <FormField
                      control={form.control}
                      name="allowFile"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 rounded-lg border px-3 py-2.5">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                              disabled={pending}
                              className="size-5"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">File upload</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="allowText"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 rounded-lg border px-3 py-2.5">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                              disabled={pending}
                              className="size-5"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">Text answer</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  {submissionTypeError ? (
                    <p id={`${id}-types-error`} className="text-sm text-destructive" role="alert">
                      {submissionTypeError}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Choose at least one.</p>
                  )}
                </fieldset>

                {allowFile && (
                  <FormField
                    control={form.control}
                    name="allowedFileTypes"
                    render={({ field }) => {
                      const selected = field.value ? field.value.split(",") : [];
                      const isAllTypes = !field.value;

                      function toggleType(type: string, checked: boolean) {
                        const current = new Set(isAllTypes ? [] : selected);
                        if (checked) current.add(type);
                        else current.delete(type);
                        // If all selected or none selected, revert to null (all types)
                        if (current.size === 0 || current.size === ALLOWED_FILE_TYPE_OPTIONS.length) {
                          field.onChange(null);
                        } else {
                          field.onChange(Array.from(current).join(","));
                        }
                      }

                      return (
                        <FormItem className="gap-3 rounded-xl border p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 space-y-0.5">
                              <Label htmlFor={`${id}-all-types`} className="text-base">
                                Accept all file types
                              </Label>
                              <p className="text-sm text-muted-foreground" id={`${id}-types-help`}>
                                {isAllTypes
                                  ? "Students can upload any supported file type."
                                  : `Students can only upload: ${selected.map((t) => FILE_TYPE_LABELS[t] ?? t).join(", ")}.`}
                              </p>
                            </div>
                            <Switch
                              id={`${id}-all-types`}
                              aria-describedby={`${id}-types-help`}
                              checked={isAllTypes}
                              disabled={pending}
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? null : ALLOWED_FILE_TYPE_OPTIONS.join(","));
                              }}
                              className="shrink-0"
                            />
                          </div>
                          {!isAllTypes && (
                            <fieldset className="space-y-2">
                              <legend className="sr-only">Allowed file types</legend>
                              <div className="flex flex-wrap gap-2">
                                {ALLOWED_FILE_TYPE_OPTIONS.map((type) => {
                                  const checkboxId = `${id}-type-${type}`;
                                  const checked = selected.includes(type);
                                  return (
                                    <div
                                      key={type}
                                      className={cn(
                                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                                        checked ? "border-primary bg-primary/10" : "bg-background"
                                      )}
                                    >
                                      <Checkbox
                                        id={checkboxId}
                                        checked={checked}
                                        onCheckedChange={(value) => toggleType(type, value === true)}
                                        disabled={pending}
                                      />
                                      <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
                                        {FILE_TYPE_LABELS[type] ?? type}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </fieldset>
                          )}
                        </FormItem>
                      );
                    }}
                  />
                )}

                {(allowFile || allowText) && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {allowFile && (
                      <FormField
                        control={form.control}
                        name="maxFileSizeBytes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max file size in MB (optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={100}
                                step={1}
                                placeholder="Default 20"
                                className="h-10"
                                disabled={pending}
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                value={field.value != null ? field.value / BYTES_PER_MB : ""}
                                onChange={(e) => {
                                  const mb = parseNumberInput(e.target.value, e.target.valueAsNumber);
                                  field.onChange(mb != null ? mb * BYTES_PER_MB : undefined);
                                }}
                              />
                            </FormControl>
                            <FormDescription>Up to 100 MB. Leave empty for the 20 MB default.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {allowText && (
                      <FormField
                        control={form.control}
                        name="maxTextLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max text length in characters (optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={100000}
                                step={1}
                                placeholder="Default 30,000"
                                className="h-10"
                                disabled={pending}
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(parseNumberInput(e.target.value, e.target.valueAsNumber))
                                }
                              />
                            </FormControl>
                            <FormDescription>Leave empty for the 30,000 character default.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="autoGradeEnabled"
                  render={({ field }) => (
                    <FormItem className="gap-3 rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <FormLabel className="text-base">Auto-grade with AI</FormLabel>
                          <FormDescription>
                            New submissions (text, images, PDFs and Word documents) are graded by AI as soon as
                            they arrive, so students get instant feedback. You can still review and change any
                            grade.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            disabled={pending}
                            className="mt-0.5 shrink-0"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {rootError && (
                  <p
                    className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {rootError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                  {form.formState.isDirty && !pending && (
                    <p className="text-sm text-muted-foreground sm:mr-auto">You have unsaved changes.</p>
                  )}
                  <Button type="submit" className="h-10 w-full sm:w-auto" disabled={pending} aria-busy={pending}>
                    {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {pending ? "Saving…" : assignment ? "Save assignment" : "Create assignment"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      {assignment && (
        <SubmissionsList
          assignmentId={assignment.id}
          maxScore={assignment.maxScore}
          autoGradeEnabled={assignment.autoGradeEnabled ?? false}
          submissions={assignment.submissions}
        />
      )}
    </div>
  );
}
