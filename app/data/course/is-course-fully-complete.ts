import { getCourseCompletionStatus } from "./get-course-completion-status";

/**
 * True when every lesson in the course has lessonProgress.completed === true for this user.
 * Must match the logic in app/dashboard/certificate/[slug]/page.tsx getCertificateData.
 */
export async function isCourseFullyComplete(
  courseId: string,
  userId: string
): Promise<boolean> {
  const status = await getCourseCompletionStatus(courseId, userId);
  return status.isEligible;
}
