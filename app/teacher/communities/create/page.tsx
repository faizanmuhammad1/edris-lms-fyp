import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { prisma } from "@/lib/db";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { CreateCommunityForm } from "./_components/CreateCommunityForm";

export const metadata: Metadata = { title: "Create community" };

export default async function CreateTeacherCommunityPage() {
  const session = await requireTeacher();

  // A teacher community must be linked to one of the teacher's own courses
  const courses = await prisma.course.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create community"
        description="Give students enrolled in one of your courses a place to discuss lessons and help each other."
        backHref="/teacher/communities"
        backLabel="All communities"
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Create a course first"
          description="Every community belongs to one of your courses, and only its enrolled students can join. Create a course, then come back to set up its community."
          buttonText="Create a course"
          href="/teacher/courses/create"
        />
      ) : (
        <CreateCommunityForm courses={courses} />
      )}
    </div>
  );
}
