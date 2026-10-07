export type EnrollmentRowStatus = "Active" | "Banned";

/** Serializable enrollment row passed from the students page to its client table. */
export interface StudentEnrollmentRow {
    id: string;
    status: EnrollmentRowStatus;
    /** ISO date string. */
    enrolledAt: string;
    /** Amount paid in cents (0 for free enrollments). */
    amount: number;
    student: { name: string; email: string; image: string | null };
    course: { id: string; title: string };
}
