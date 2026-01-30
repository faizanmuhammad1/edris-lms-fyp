import { getTeacherQuizzes } from "@/app/data/teacher/get-teacher-quizzes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconClipboardList } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeacherQuizzesPage() {
    const quizzes = await getTeacherQuizzes();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
                    <p className="text-muted-foreground">
                        View and manage quizzes across all your courses
                    </p>
                </div>
                <Link href="/teacher/courses">
                    <Button>
                        Go to Courses to Add Quiz
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quizzes.length === 0 ? (
                    <div className="col-span-full text-center p-12 border rounded-lg border-dashed text-muted-foreground">
                        <p>No quizzes found. Add quizzes to your lessons in the Course Editor.</p>
                    </div>
                ) : quizzes.map((quiz) => (
                    <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <IconClipboardList className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg line-clamp-1">{quiz.title}</CardTitle>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {quiz.Lesson.Chapter.Course.title} - {quiz.Lesson.title}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                                    {quiz.isPublished ? "Published" : "Draft"}
                                </Badge>
                                <span>
                                    {quiz._count.attempts} Attempts
                                </span>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" className="flex-1" asChild>
                                    <Link href={`/teacher/courses/${quiz.Lesson.Chapter.Course.id}/lessons/${quiz.Lesson.id}/quiz`}>
                                        Manage
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
