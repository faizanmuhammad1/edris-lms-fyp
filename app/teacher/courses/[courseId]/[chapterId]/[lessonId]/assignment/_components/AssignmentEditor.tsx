"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignmentSchema, type AssignmentSchemaType } from "@/lib/zodSchemas";
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
        ? new Date(assignment.dueDate).toISOString().slice(0, 16)
        : undefined,
      maxScore: assignment?.maxScore ?? undefined,
      allowFile: assignment?.allowFile ?? true,
      allowText: assignment?.allowText ?? false,
    },
  });

  const dueDate = useWatch({
    control: form.control,
    name: "dueDate",
  });

  function onSubmit(values: AssignmentSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        createOrUpdateAssignment(lessonId, values)
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
                        form.setValue("dueDate", tomorrow.toISOString().slice(0, 16));
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
          submissions={assignment.submissions}
        />
      )}
    </div>
  );
}
