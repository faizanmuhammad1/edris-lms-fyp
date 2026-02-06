import { prisma } from "@/lib/db";
import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { redirect } from "next/navigation";
import { CreateCommunityForm } from "./_components/CreateCommunityForm";

export default async function CreateTeacherCommunityPage() {
    const session = await requireTeacher();

    // Get teacher's courses
    const courses = await prisma.course.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
    });

    // If teacher has no courses, redirect them
    if (courses.length === 0) {
        redirect("/teacher/courses?message=create-course-first");
    }

    return <CreateCommunityForm courses={courses} />;
}
