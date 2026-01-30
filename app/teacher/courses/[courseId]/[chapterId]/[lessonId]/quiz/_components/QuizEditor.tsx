"use client";

import { TeacherQuizType } from "@/app/data/teacher/get-teacher-quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertQuiz, deleteQuiz } from "../actions";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { QuestionList } from "./QuestionList";
import { QuestionForm } from "./QuestionForm";
import { useRouter } from "next/navigation";

interface QuizEditorProps {
    lessonId: string;
    courseId: string;
    chapterId: string;
    initialData: TeacherQuizType | null;
}

export function QuizEditor({ lessonId, courseId, chapterId, initialData }: QuizEditorProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
    const [passingScore, setPassingScore] = useState(initialData?.passingScore || 70);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const handleSave = () => {
        if (!title) {
            toast.error("Title is required");
            return;
        }

        startTransition(async () => {
            try {
                await upsertQuiz(lessonId, { title, description, isPublished, passingScore });
                toast.success("Quiz saved successfully");
            } catch {
                toast.error("Failed to save quiz");
            }
        });
    };

    const handleDelete = () => {
        if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;

        startTransition(async () => {
            try {
                await deleteQuiz(lessonId);
                toast.success("Quiz deleted successfully");
                router.refresh(); // clear local state if needed
            } catch {
                toast.error("Failed to delete quiz");
            }
        });
    }


    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href={`/teacher/courses/${courseId}/${chapterId}/${lessonId}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ArrowLeft className="size-4" /> Back to Lesson
                </Link>
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Quiz Management</h1>
                <div className="flex items-center gap-2">
                    {initialData && (
                        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
                            <Trash2 className="size-4 mr-2" /> Delete Quiz
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={pending}>
                        {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                        {initialData ? "Update Quiz" : "Create Quiz"}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                    <CardDescription>Configure the basic settings for this quiz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Chapter 1 Review"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this quiz covers..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Published</Label>
                                <p className="text-sm text-muted-foreground">Make this quiz visible to students</p>
                            </div>
                            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="passingScore">Passing Score (%)</Label>
                            <Input
                                id="passingScore"
                                type="number"
                                min={0}
                                max={100}
                                value={passingScore}
                                onChange={(e) => setPassingScore(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {initialData ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Questions</h2>
                        <QuestionForm quizId={initialData.id} />
                    </div>

                    <QuestionList questions={initialData.questions} quizId={initialData.id} />
                </div>
            ) : (
                <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground bg-muted/50">
                    <p>Save user quiz details above to start adding questions.</p>
                </div>
            )}
        </div>
    );
}
