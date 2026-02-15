"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { FileText, Upload, Loader2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { submitAssignment } from "../actions";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AssignmentType {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  maxScore: number | null;
  allowFile: boolean;
  allowText: boolean;
  submissions: {
    id: string;
    fileKey: string | null;
    fileName: string | null;
    textAnswer: string | null;
    submittedAt: Date;
    status: string;
    score: number | null;
    feedback: string | null;
    gradedAt: Date | null;
  }[];
}

interface LessonAssignmentCardProps {
  assignment: AssignmentType;
  slug: string;
  lessonId: string;
}

export function LessonAssignmentCard({
  assignment,
  slug,
  lessonId,
}: LessonAssignmentCardProps) {
  const [pending, startTransition] = useTransition();
  const [fileKey, setFileKey] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [mimeType, setMimeType] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const mySubmission = assignment.submissions[0] ?? null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/s3/upload-direct", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setFileKey(data.key);
      setFileName(file.name);
      setFileSize(file.size);
      setMimeType(file.type);
    } catch {
      toast.error("File upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleSubmit() {
    const hasFile = !!fileKey;
    const hasText = !!textAnswer.trim();
    if (assignment.allowFile && assignment.allowText && !hasFile && !hasText) {
      toast.error("Please provide a file and/or text answer");
      return;
    }
    if (assignment.allowFile && !assignment.allowText && !hasFile) {
      toast.error("Please upload a file");
      return;
    }
    if (assignment.allowText && !assignment.allowFile && !hasText) {
      toast.error("Please provide a text answer");
      return;
    }
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        submitAssignment(
          assignment.id,
          { fileKey: fileKey || undefined, fileName: fileName || undefined, fileSize: fileSize || undefined, mimeType: mimeType || undefined, textAnswer: textAnswer || undefined },
          slug,
          lessonId
        )
      );
      if (error) {
        toast.error("Something went wrong");
        return;
      }
      if (result?.status === "success") {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result?.message ?? "Failed to submit");
      }
    });
  }

  async function handleDownloadSubmission() {
    if (!mySubmission?.id || !mySubmission.fileKey) return;
    try {
      const res = await fetch("/api/assignment-submissions/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: mySubmission.id }),
      });
      if (!res.ok) throw new Error("Failed to get link");
      const { url } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = mySubmission.fileName ?? "submission";
      a.target = "_blank";
      a.click();
    } catch {
      toast.error("Could not download");
    }
  }

  const isGraded = mySubmission?.status === "Graded";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          {assignment.title}
        </CardTitle>
        {assignment.dueDate && (
          <CardDescription>
            Due: {new Date(assignment.dueDate).toLocaleString()}
          </CardDescription>
        )}
        {assignment.description && (() => {
          try {
            return (
              <div className="prose prose-sm dark:prose-invert max-w-none mt-2">
                <RenderDescription json={JSON.parse(assignment.description)} />
              </div>
            );
          } catch {
            return <p className="text-sm mt-2">{assignment.description}</p>;
          }
        })()}
      </CardHeader>
      <CardContent className="space-y-4">
        {mySubmission ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Submitted {formatDistanceToNow(new Date(mySubmission.submittedAt), { addSuffix: true })}
              {assignment.dueDate && new Date(mySubmission.submittedAt) > new Date(assignment.dueDate) && (
                <Badge variant="secondary" className="text-xs">Late</Badge>
              )}
            </p>
            {mySubmission.fileName && (
              <Button variant="link" className="h-auto p-0 text-sm" onClick={handleDownloadSubmission}>
                <Download className="size-4 mr-1" />
                {mySubmission.fileName}
              </Button>
            )}
            {mySubmission.textAnswer && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                {mySubmission.textAnswer}
              </div>
            )}
            {isGraded && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                <p className="font-medium text-sm">
                  Grade: {assignment.maxScore != null ? `${mySubmission.score} / ${assignment.maxScore}` : mySubmission.score}
                </p>
                {mySubmission.feedback && (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {mySubmission.feedback}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {assignment.allowFile && (
              <div>
                <label className="text-sm font-medium mb-2 block">Upload file</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="text-sm"
                />
                {fileName && <p className="text-xs text-muted-foreground mt-1">{fileName}</p>}
              </div>
            )}
            {assignment.allowText && (
              <div>
                <label className="text-sm font-medium mb-2 block">Text answer</label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer..."
                />
              </div>
            )}
            <Button onClick={handleSubmit} disabled={pending || uploading}>
              {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
              Submit
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
