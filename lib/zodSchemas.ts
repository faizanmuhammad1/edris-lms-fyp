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

  // Course.price is stored as an Int of whole currency units (USD); Stripe gets price * 100 cents.
  price: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .int({ message: "Price must be a whole number of dollars (no cents)" })
    .min(1, { message: "Price must be at least 1" }),

  duration: z.coerce
    .number({ invalid_type_error: "Duration must be a number" })
    .int({ message: "Duration must be a whole number of hours" })
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

/** Default max file size for assignment uploads (20MB) */
export const ASSIGNMENT_MAX_FILE_BYTES_DEFAULT = 20 * 1024 * 1024;
/** Default max text length for assignment answers (30k chars) */
export const ASSIGNMENT_MAX_TEXT_LENGTH_DEFAULT = 30_000;

export const ALLOWED_FILE_TYPE_OPTIONS = ["pdf", "image", "word", "text", "zip"] as const;

export type AllowedFileTypeOption = (typeof ALLOWED_FILE_TYPE_OPTIONS)[number];

/**
 * MIME types and extensions for each assignment `allowedFileTypes` token.
 * `extensions` maps each extension to the canonical MIME type used when the browser
 * reports no/unspecific type (e.g. "" or application/octet-stream).
 */
export const ASSIGNMENT_FILE_TYPE_MAP: Record<
  AllowedFileTypeOption,
  { mimes: string[]; extensions: Record<string, string> }
> = {
  pdf: {
    mimes: ["application/pdf", "application/x-pdf"],
    extensions: { ".pdf": "application/pdf" },
  },
  image: {
    mimes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
    extensions: {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
    },
  },
  word: {
    mimes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extensions: {
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  },
  text: {
    mimes: ["text/plain", "text/markdown"],
    extensions: { ".txt": "text/plain", ".md": "text/markdown" },
  },
  zip: {
    mimes: [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-compressed",
      "multipart/x-zip",
      "application/x-rar-compressed",
    ],
    extensions: { ".zip": "application/zip", ".rar": "application/x-rar-compressed" },
  },
};

/** Parse an assignment's comma-separated allowedFileTypes (null/empty = all types). */
export function parseAllowedFileTypes(allowedFileTypes: string | null | undefined): AllowedFileTypeOption[] {
  const tokens = (allowedFileTypes ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t): t is AllowedFileTypeOption =>
      (ALLOWED_FILE_TYPE_OPTIONS as readonly string[]).includes(t)
    );
  return tokens.length > 0 ? tokens : [...ALLOWED_FILE_TYPE_OPTIONS];
}

/** react-dropzone `accept` map ({ mime: [extensions] }) for an assignment's allowed types. */
export function getAssignmentAcceptMap(
  allowedFileTypes: string | null | undefined
): Record<string, string[]> {
  const accept: Record<string, string[]> = {};
  for (const token of parseAllowedFileTypes(allowedFileTypes)) {
    const { mimes, extensions } = ASSIGNMENT_FILE_TYPE_MAP[token];
    const exts = Object.keys(extensions);
    for (const mime of mimes) {
      accept[mime] = exts;
    }
  }
  return accept;
}

/**
 * Returns the MIME type to store for an assignment upload, or null if the file is not
 * allowed by the assignment's allowedFileTypes.
 */
export function resolveAssignmentUploadMime(
  fileName: string,
  contentType: string | null | undefined,
  allowedFileTypes: string | null | undefined
): string | null {
  const mime = (contentType ?? "").trim().toLowerCase();
  const dot = fileName.lastIndexOf(".");
  const ext = dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
  for (const token of parseAllowedFileTypes(allowedFileTypes)) {
    const { mimes, extensions } = ASSIGNMENT_FILE_TYPE_MAP[token];
    if (mime && mimes.includes(mime)) return mime;
    if ((!mime || mime === "application/octet-stream") && extensions[ext]) {
      return extensions[ext];
    }
  }
  return null;
}

export const assignmentSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    maxScore: z.coerce.number().int().min(0).max(10000).optional().nullable(),
    allowFile: z.boolean(),
    allowText: z.boolean(),
    autoGradeEnabled: z.boolean().optional(),
    allowedFileTypes: z.string().optional().nullable(), // comma-separated: "pdf,image,word,text,zip" or null/undefined for any
    maxFileSizeBytes: z.coerce.number().int().min(0).max(100 * 1024 * 1024).optional().nullable(),
    maxTextLength: z.coerce.number().int().min(0).max(100_000).optional().nullable(),
  })
  .refine((data) => data.allowFile || data.allowText, {
    message: "At least one of file upload or text answer must be allowed",
    path: ["allowFile"],
  })
  .refine((data) => !data.autoGradeEnabled || !!data.description?.trim(), {
    message: "Add assignment instructions before enabling AI auto-grading",
    path: ["description"],
  });

export const assignmentSubmissionSchema = z
  .object({
    fileKey: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    textAnswer: z.string().optional(),
  })
  .refine(
    (data) => {
      const len = data.textAnswer?.length ?? 0;
      return len <= ASSIGNMENT_MAX_TEXT_LENGTH_DEFAULT;
    },
    { message: `Text answer must be at most ${ASSIGNMENT_MAX_TEXT_LENGTH_DEFAULT.toLocaleString()} characters`, path: ["textAnswer"] }
  );

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
