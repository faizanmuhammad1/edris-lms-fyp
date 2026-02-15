import { z } from "zod";

export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;

export const courseStatus = ["Draft", "Published", "Archived"] as const;

export const courseCategories = [
  "Development",
  "Business",
  "Finance",
  "IT & Software",
  "Office Productivity",
  "Personal Development",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Music",
  "Teaching & Academics",
] as const;

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" }),

  fileKey: z.string().min(1, { message: "File is required" }),

  price: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .min(1, { message: "Price must be at least 1" }),

  duration: z.coerce
    .number({ invalid_type_error: "Duration must be a number" })
    .min(1, { message: "Duration must be at least 1 hour" })
    .max(500, { message: "Duration must be at most 500 hours" }),

  level: z.enum(courseLevels, {
    message: "Level is required",
  }),
  category: z.enum(courseCategories, {
    message: "Category is required",
  }),
  smallDescription: z
    .string()
    .min(3, { message: "Small Description must be at least 3 characters long" })
    .max(200, {
      message: "Small Description must be at most 200 characters long",
    }),

  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters long" }),

  status: z.enum(courseStatus, {
    message: "Status is required",
  }),
});

// UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
const uuidSchema = z.string().uuid({ message: "Invalid ID format" });

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: uuidSchema,
});

export const lessonTypes = ["Video", "Reading", "Mixed"] as const;

export const lessonSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  chapterId: uuidSchema,
  courseId: uuidSchema,
  description: z
    .string()
    .optional(),
  lessonType: z.enum(lessonTypes).optional(),
  videoKey: z.string().optional(),
  thumbnailKey: z.string().optional(),
  pdfKey: z.string().optional(),
  pdfFileName: z.string().optional(),
});

export const assignmentSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    maxScore: z.coerce.number().int().min(0).max(10000).optional().nullable(),
    allowFile: z.boolean(),
    allowText: z.boolean(),
  })
  .refine((data) => data.allowFile || data.allowText, {
    message: "At least one of file upload or text answer must be allowed",
    path: ["allowFile"],
  });

export const assignmentSubmissionSchema = z.object({
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  textAnswer: z.string().optional(),
});

export const gradeSubmissionSchema = z.object({
  score: z.coerce.number().int().min(0).max(10000).optional().nullable(),
  feedback: z.string().optional(),
});

export type CourseSchemaType = z.infer<typeof courseSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;
export type AssignmentSchemaType = z.infer<typeof assignmentSchema>;
export type AssignmentSubmissionSchemaType = z.infer<typeof assignmentSubmissionSchema>;
export type GradeSubmissionSchemaType = z.infer<typeof gradeSubmissionSchema>;
