import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getTeacherQuizzes } from "@/app/data/teacher/get-teacher-quizzes";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { QuizzesTable, type QuizRow } from "./_components/QuizzesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Quizzes" };

export default async function TeacherQuizzesPage() {
    const quizzes = await getTeacherQuizzes();

    const rows: QuizRow[] = quizzes.map((quiz) => {
        const course = quiz.Lesson.Chapter.Course;
        return {
            id: quiz.id,
            title: quiz.title,
            isPublished: quiz.isPublished,
            passingScore: quiz.passingScore,
            timeLimit: quiz.timeLimit,
            attempts: quiz._count.attempts,
            updatedAt: quiz.updatedAt.toISOString(),
            course: { id: course.id, title: course.title },
            lesson: { title: quiz.Lesson.title },
            manageHref: `/teacher/courses/${course.id}/${quiz.Lesson.chapterId}/${quiz.Lesson.id}/quiz`,
        };
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quizzes"
                description="Every quiz across your courses. To add a quiz, open a lesson in the course editor."
                actions={
                    rows.length > 0 ? (
                        <Link href="/teacher/courses" className={buttonVariants({ variant: "outline" })}>
                            <BookOpen aria-hidden="true" />
                            Go to courses
                        </Link>
                    ) : undefined
                }
            />
            <QuizzesTable rows={rows} />
        </div>
    );
}
