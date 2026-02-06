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
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <Link
                        href={`/teacher/courses/${courseId}/${chapterId}/${lessonId}`}
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mb-2 w-fit"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Lesson
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Quiz Management</h1>
                    <p className="text-muted-foreground">Create and manage content for this lesson&apos;s quiz.</p>
                </div>
                <div className="flex items-center gap-3">
                    {initialData && (
                        <Button variant="outline" size="sm" onClick={handleDelete} disabled={pending} className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                            <Trash2 className="size-4 mr-2" /> Delete Quiz
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={pending} size="lg" className="shadow-sm">
                        {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                        {initialData ? "Save Changes" : "Create Quiz"}
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8">
                {/* Configuration Card */}
                <Card className="border-border/60 shadow-sm">
                    <CardHeader className="border-b bg-muted/40 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold text-sm">1</span>
                            </div>
                            <div>
                                <CardTitle className="text-lg">Quiz Settings</CardTitle>
                                <CardDescription>Configure the basic details and visibility.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Quiz Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Chapter 1 Knowledge Check"
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="passingScore">Passing Score (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="passingScore"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={passingScore}
                                        onChange={(e) => setPassingScore(Number(e.target.value))}
                                        className="h-10 pl-4"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what students will be tested on..."
                                className="min-h-[100px] resize-y"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/20">
                            <div className="space-y-1">
                                <Label className="text-base font-medium">Publish Status</Label>
                                <p className="text-sm text-muted-foreground">Make this quiz visible to enrolled students.</p>
                            </div>
                            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Section */}
                {initialData ? (
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="border-b bg-muted/40 pb-4 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-primary font-bold text-sm">2</span>
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Questions</CardTitle>
                                    <CardDescription>Manage the questions for this quiz.</CardDescription>
                                </div>
                            </div>
                            <QuestionForm quizId={initialData.id} />
                        </CardHeader>
                        <CardContent className="pt-6">
                            <QuestionList questions={initialData.questions} quizId={initialData.id} />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-12 text-center bg-muted/5">
                        <div className="max-w-md mx-auto space-y-4">
                            <p className="text-muted-foreground text-lg font-medium">Ready to add questions?</p>
                            <p className="text-muted-foreground/80">Save the quiz settings above to start creating your question bank.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
