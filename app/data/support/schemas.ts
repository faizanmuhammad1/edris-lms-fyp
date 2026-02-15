import { z } from "zod";

export const ticketCategoryOptions = [
  { value: "TechnicalIssue", label: "Technical Issue" },
  { value: "CourseRelated", label: "Course Related" },
  { value: "AccountIssue", label: "Account Issue" },
  { value: "PaymentBilling", label: "Payment & Billing" },
  { value: "AssignmentGrading", label: "Assignment & Grading" },
  { value: "CommunityForum", label: "Community & Forum" },
  { value: "TeacherApplication", label: "Teacher Application" },
  { value: "FeatureRequest", label: "Feature Request" },
  { value: "Other", label: "Other" },
] as const;

export const ticketPriorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
] as const;

export const ticketStatusOptions = [
  { value: "Open", label: "Open" },
  { value: "InProgress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
  { value: "Escalated", label: "Escalated" },
] as const;

// Categories that should route to teacher first (course-related)
export const teacherRoutedCategories = [
  "CourseRelated",
  "AssignmentGrading",
] as const;

// Categories relevant to students
export const studentCategories = [
  "TechnicalIssue",
  "CourseRelated",
  "AccountIssue",
  "PaymentBilling",
  "AssignmentGrading",
  "CommunityForum",
  "FeatureRequest",
  "Other",
] as const;

// Categories relevant to teachers
export const teacherCategories = [
  "TechnicalIssue",
  "CourseRelated",
  "AccountIssue",
  "PaymentBilling",
  "CommunityForum",
  "TeacherApplication",
  "FeatureRequest",
  "Other",
] as const;

export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(100, "Subject must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  category: z.enum([
    "TechnicalIssue",
    "CourseRelated",
    "AccountIssue",
    "PaymentBilling",
    "AssignmentGrading",
    "CommunityForum",
    "TeacherApplication",
    "FeatureRequest",
    "Other",
  ]),
  priority: z
    .enum(["Low", "Medium", "High", "Urgent"])
    .default("Medium"),
  courseId: z.string().uuid().optional().nullable(),
});

export const replySchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be less than 5000 characters"),
  isInternal: z.boolean().default(false),
});

export const updateTicketSchema = z.object({
  status: z
    .enum(["Open", "InProgress", "Resolved", "Closed", "Escalated"])
    .optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  category: z
    .enum([
      "TechnicalIssue",
      "CourseRelated",
      "AccountIssue",
      "PaymentBilling",
      "AssignmentGrading",
      "CommunityForum",
      "TeacherApplication",
      "FeatureRequest",
      "Other",
    ])
    .optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
