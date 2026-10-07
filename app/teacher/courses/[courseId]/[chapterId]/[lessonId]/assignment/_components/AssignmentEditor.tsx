"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignmentSchema, ALLOWED_FILE_TYPE_OPTIONS, type AssignmentSchemaType } from "@/lib/zodSchemas";
import { createOrUpdateAssignment } from "../actions";
import { TeacherAssignmentType } from "@/app/data/teacher/get-teacher-assignment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SubmissionsList } from "./SubmissionsList";

/** Format a Date as a `datetime-local` input value in the browser's local timezone. */
function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

interface AssignmentEditorProps {
  lessonId: string;
  courseId: string;
  chapterId: string;
  initialData: TeacherAssignmentType;
}

export function AssignmentEditor({
  lessonId,
  initialData,
}: AssignmentEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const assignment = initialData.assignment;

  const form = useForm<AssignmentSchemaType>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment?.title ?? "Assignment",
      description: assignment?.description ?? undefined,
      dueDate: assignment?.dueDate
        ? toLocalDateTimeInputValue(new Date(assignment.dueDate))
        : undefined,
      maxScore: assignment?.maxScore ?? undefined,
      allowFile: assignment?.allowFile ?? true,
      allowText: assignment?.allowText ?? false,
      autoGradeEnabled: assignment?.autoGradeEnabled ?? false,
      allowedFileTypes: assignment?.allowedFileTypes ?? null,
      maxFileSizeBytes: assignment?.maxFileSizeBytes ?? undefined,
      maxTextLength: assignment?.maxTextLength ?? undefined,
    },
  });

  const allowFile = useWatch({
    control: form.control,
    name: "allowFile",
  });

  const dueDate = useWatch({
    control: form.control,
    name: "dueDate",
  });

  function onSubmit(values: AssignmentSchemaType) {
    // datetime-local values have no timezone; interpret in the teacher's local
    // timezone and send an absolute ISO timestamp to the server.
    let dueDateIso: string | undefined;
    if (values.dueDate) {
      const parsed = new Date(values.dueDate);
      if (Number.isNaN(parsed.getTime())) {
        toast.error("Invalid due date");
        return;
      }
      dueDateIso = parsed.toISOString();
    }

    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        createOrUpdateAssignment(lessonId, { ...values, dueDate: dueDateIso })
      );
      if (error) {
        toast.error("Something went wrong");
        return;
      }
      if (result?.status === "success") {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Assignment</CardTitle>
          <CardDescription>
            Set the assignment for this lesson. Students will see the title and instructions and can submit a file and/or text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Assignment title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (optional)</FormLabel>
                    <FormControl>
                      <RichTextEditor field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="always-open"
                    checked={!dueDate}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        form.setValue("dueDate", undefined);
                      } else {
                        // Default to tomorrow if enabled
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        form.setValue("dueDate", toLocalDateTimeInputValue(tomorrow));
                      }
                    }}
                  />
                  <Label htmlFor="always-open">Always Open (No Due Date)</Label>
                </div>
              </div>

              {dueDate !== undefined && (
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max score (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 100"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="allowFile"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Require / allow file upload</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowText"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Require / allow text answer</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              {/* File type restrictions (only show when file upload is enabled) */}
              {allowFile && (
                <FormField
                  control={form.control}
                  name="allowedFileTypes"
                  render={({ field }) => {
                    const selected = field.value ? field.value.split(",") : [];
                    const isAllTypes = !field.value;

                    function toggleType(type: string) {
                      if (isAllTypes) {
                        // Switching from "all" to specific — select only this one
                        field.onChange(type);
                        return;
                      }
                      const current = new Set(selected);
                      if (current.has(type)) {
                        current.delete(type);
                      } else {
                        current.add(type);
                      }
                      // If all selected or none selected, revert to null (all types)
                      if (current.size === 0 || current.size === ALLOWED_FILE_TYPE_OPTIONS.length) {
                        field.onChange(null);
                      } else {
                        field.onChange(Array.from(current).join(","));
                      }
                    }

                    const TYPE_LABELS: Record<string, string> = {
                      pdf: "📄 PDF",
                      image: "🖼️ Images",
                      word: "📝 Word Docs",
                      text: "📃 Text Files",
                      zip: "📦 ZIP / Archives",
                    };

                    return (
                      <FormItem className="rounded-xl border p-4 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-medium">Allowed file types</FormLabel>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isAllTypes}
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? null : ALLOWED_FILE_TYPE_OPTIONS.join(","));
                              }}
                            />
                            <Label className="text-sm">All types</Label>
                          </div>
                        </div>
                        {!isAllTypes && (
                          <div className="flex flex-wrap gap-3">
                            {ALLOWED_FILE_TYPE_OPTIONS.map((type) => (
                              <label
                                key={type}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                                  selected.includes(type)
                                    ? "border-primary bg-primary/10 text-foreground"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.includes(type)}
                                  onChange={() => toggleType(type)}
                                  className="rounded border"
                                />
                                {TYPE_LABELS[type] ?? type}
                              </label>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {isAllTypes
                            ? "Students can upload any supported file type."
                            : `Students can only upload: ${selected.map(t => TYPE_LABELS[t] ?? t).join(", ")}`}
                        </p>
                      </FormItem>
                    );
                  }}
                />
              )}
              <FormField
                control={form.control}
                name="autoGradeEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Auto-grade with AI</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        When enabled, all submissions (text, images, PDFs, Word docs) are graded automatically by AI. Students receive instant feedback without manual action.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="maxFileSizeBytes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max file size (MB, optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Default 20"
                          {...field}
                          value={field.value != null ? Math.round(field.value / 1024 / 1024) : ""}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : undefined;
                            field.onChange(v != null ? v * 1024 * 1024 : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxTextLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max text length (chars, optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Default 30,000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save assignment
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

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
