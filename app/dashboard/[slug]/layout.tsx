import { ReactNode } from "react";
import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import { CourseShell } from "../_components/CourseShell";

interface iAppProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

export default async function CourseLayout({ children, params }: iAppProps) {
  const { slug } = await params;

  // Server-side enrollment check and lightweight data fetching
  const { course } = await getCourseSidebarData(slug);

  return <CourseShell course={course}>{children}</CourseShell>;
}
