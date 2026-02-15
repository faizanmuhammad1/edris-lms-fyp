"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupportTicket } from "@/app/data/support/create-ticket";
import { ticketPriorityOptions } from "@/app/data/support/schemas";
import { toast } from "sonner";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
}

interface CreateTicketFormProps {
  role: "student" | "teacher" | "admin";
  backHref: string;
  courses?: Course[];
  categoryOptions: readonly { value: string; label: string }[];
}

export function CreateTicketForm({
  role,
  backHref,
  courses = [],
  categoryOptions,
}: CreateTicketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [courseId, setCourseId] = useState<string>("");

  const showCourseSelector =
    courses.length > 0 &&
    (category === "CourseRelated" || category === "AssignmentGrading");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim() || !category) {
      toast.error("Please fill in all required fields");
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
          toast.success(
            `Ticket ${result.ticketNumber} created successfully`
          );
          router.push(backHref);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create ticket"
        );
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to tickets
        </Link>
      </div>

      <Card>
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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isPending}
                maxLength={100}
              />
            </div>

            {/* Category & Priority row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} disabled={isPending}>
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority} disabled={isPending}>
                  <SelectTrigger>
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
                <Label>Related Course</Label>
                <Select value={courseId} onValueChange={setCourseId} disabled={isPending}>
                  <SelectTrigger>
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
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Provide details about your issue. The more information you share, the faster we can help."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                rows={6}
                className="resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/5000
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(backHref)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                <Send className="h-4 w-4 mr-1.5" />
                {isPending ? "Creating..." : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
