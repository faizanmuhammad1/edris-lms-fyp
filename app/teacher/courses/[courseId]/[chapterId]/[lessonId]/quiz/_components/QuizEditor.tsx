"use client";

import { TeacherQuizType } from "@/app/data/teacher/get-teacher-quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  upsertQuiz,
  deleteQuiz,
  generateQuizQuestions,
  addGeneratedQuestions,
  type GenerateQuizQuestionsResult,
} from "../actions";
import type { GeneratedQuestion } from "@/lib/generate-quiz-questions";
import { ArrowLeft, Loader2, Trash2, Wand2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { QuestionList } from "./QuestionList";
import { QuestionForm } from "./QuestionForm";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface QuizEditorProps {
    lessonId: string;
    courseId: string;
    chapterId: string;
    initialData: TeacherQuizType | null;
}

const QUIZ_TYPES = [
  { value: "knowledge", label: "Knowledge check" },
  { value: "concepts", label: "Key concepts" },
  { value: "application", label: "Application" },
  { value: "mixed", label: "Mixed" },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

export function QuizEditor({ lessonId, courseId, chapterId, initialData }: QuizEditorProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
    const [passingScore, setPassingScore] = useState(initialData?.passingScore || 70);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    // AI generation state
    const [aiQuizType, setAiQuizType] = useState<string>("mixed");
    const [aiDescription, setAiDescription] = useState("");
    const [aiNumQuestions, setAiNumQuestions] = useState(5);
    const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [aiFocusTopics, setAiFocusTopics] = useState("");
    const [generatePending, setGeneratePending] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
    const [addPending, setAddPending] = useState(false);

    const handleSave = () => {
        if (!title) {
            toast.error("Title is required");
            return;
        }

        startTransition(async () => {
            try {
                const result = await upsertQuiz(lessonId, { title, description, isPublished, passingScore });
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
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
    };

    const handleGenerate = async () => {
        const num = Math.min(20, Math.max(1, Number(aiNumQuestions) || 5));
        setGeneratePending(true);
        setGeneratedQuestions(null);
        try {
            const result: GenerateQuizQuestionsResult = await generateQuizQuestions(lessonId, {
                quizType: aiQuizType || undefined,
                description: aiDescription.trim() || undefined,
                numQuestions: num,
                difficulty: aiDifficulty,
                focusTopics: aiFocusTopics.trim() || undefined,
            });
            if (result.success) {
                setGeneratedQuestions(result.questions);
                setAiNumQuestions(num);
                toast.success(`Generated ${result.questions.length} question(s). Review and add to quiz.`);
            } else if (result.error === "NO_TRANSCRIPT") {
                toast.error("No transcript available. Transcribe the lesson first.");
            } else {
                toast.error("Generation failed. Please try again.");
            }
        } catch {
            toast.error("Generation failed. Please try again.");
        } finally {
            setGeneratePending(false);
        }
    };

    const handleAddGenerated = async () => {
        if (!initialData || !generatedQuestions?.length) return;
        setAddPending(true);
        try {
            const result = await addGeneratedQuestions(initialData.id, generatedQuestions);
            if (result.success) {
                toast.success("Questions added to quiz.");
                setGeneratedQuestions(null);
                router.refresh();
            } else {
                toast.error(result.error ?? "Failed to add questions.");
            }
        } catch {
            toast.error("Failed to add questions.");
        } finally {
            setAddPending(false);
        }
    };

    const transcriptionReady =
        initialData?.Lesson?.transcriptionStatus === "COMPLETED";

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

                {/* AI Generate from transcript - only when quiz exists */}
                {initialData && (
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="border-b bg-muted/40 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Wand2 className="size-4 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Generate from lecture</CardTitle>
                                    <CardDescription>
                                        Create quiz questions from this lesson&apos;s transcript. Transcribe the lesson first if needed.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {!transcriptionReady ? (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
                                    <p className="font-medium mb-1">Transcript required</p>
                                    <p className="text-muted-foreground mb-3">
                                        Generate questions from this lesson&apos;s transcript. Transcribe the lesson first.
                                    </p>
                                    <Link
                                        href={`/teacher/courses/${courseId}/${chapterId}/${lessonId}`}
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        Go to lesson →
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Quiz type / focus</Label>
                                            <Select value={aiQuizType} onValueChange={setAiQuizType}>
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {QUIZ_TYPES.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Difficulty</Label>
                                            <Select
                                                value={aiDifficulty}
                                                onValueChange={(v) => setAiDifficulty(v as "easy" | "medium" | "hard")}
                                            >
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Select difficulty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DIFFICULTY_OPTIONS.map((d) => (
                                                        <SelectItem key={d.value} value={d.value}>
                                                            {d.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="aiNumQuestions">Number of questions</Label>
                                        <Input
                                            id="aiNumQuestions"
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={aiNumQuestions}
                                            onChange={(e) => setAiNumQuestions(Number(e.target.value) || 5)}
                                            className="h-10 w-32"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="aiDescription">Additional context (optional)</Label>
                                        <Textarea
                                            id="aiDescription"
                                            value={aiDescription}
                                            onChange={(e) => setAiDescription(e.target.value)}
                                            placeholder="e.g. Focus on definitions and formulas"
                                            className="min-h-[80px] resize-y"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="aiFocusTopics">Focus topics (optional)</Label>
                                        <Textarea
                                            id="aiFocusTopics"
                                            value={aiFocusTopics}
                                            onChange={(e) => setAiFocusTopics(e.target.value)}
                                            placeholder="e.g. Variables, loops, and functions"
                                            className="min-h-[60px] resize-y"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={generatePending}
                                        className="gap-2"
                                    >
                                        {generatePending ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Wand2 className="size-4" />
                                        )}
                                        {generatePending ? "Generating…" : "Generate questions"}
                                    </Button>

                                    {generatedQuestions && generatedQuestions.length > 0 && (
                                        <div className="space-y-4 pt-4 border-t">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Preview — add these to your quiz or discard
                                            </p>
                                            <div className="space-y-4">
                                                {generatedQuestions.map((q, qIndex) => (
                                                    <Card key={qIndex}>
                                                        <CardContent className="p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">Q{qIndex + 1}</Badge>
                                                                <span className="font-medium">{q.question}</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 border-l-2 border-muted">
                                                                {q.options.map((opt, oIdx) => (
                                                                    <div
                                                                        key={oIdx}
                                                                        className={cn(
                                                                            "p-2 rounded text-sm border flex items-center justify-between",
                                                                            opt.isCorrect
                                                                                ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400"
                                                                                : "bg-muted/50 border-transparent text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        <span>{opt.text}</span>
                                                                        {opt.isCorrect && (
                                                                            <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={handleAddGenerated}
                                                    disabled={addPending}
                                                    className="gap-2"
                                                >
                                                    {addPending ? <Loader2 className="size-4 animate-spin" /> : null}
                                                    Add all to quiz
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setGeneratedQuestions(null)}
                                                    disabled={addPending}
                                                >
                                                    Discard
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

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
