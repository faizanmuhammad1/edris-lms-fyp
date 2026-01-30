"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteQuestion } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Defined locally to match Prisma include structure or imported if shared type exists
// For simplicity, we define compatible interface
interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
    position: number;
}

interface Question {
    id: string;
    question: string;
    points: number;
    position: number;
    options: Option[];
}

interface QuestionListProps {
    questions: Question[];
    quizId: string;
}

export function QuestionList({ questions }: QuestionListProps) {
    const [pending, startTransition] = useTransition();

    const handleDelete = (questionId: string) => {
        if (!confirm("Delete this question?")) return;

        startTransition(async () => {
            try {
                await deleteQuestion(questionId);
                toast.success("Question deleted");
            } catch {
                toast.error("Failed to delete question");
            }
        });
    }

    if (questions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No questions added yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {questions.map((q, qIndex) => (
                <Card key={q.id}>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">Q{qIndex + 1}</Badge>
                                    <span className="font-medium text-lg">{q.question}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{q.points} Points</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(q.id)}
                                disabled={pending}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 border-l-2 border-muted">
                            {q.options.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={cn(
                                        "p-2 rounded text-sm border flex items-center justify-between",
                                        opt.isCorrect ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400" : "bg-muted/50 border-transparent text-muted-foreground"
                                    )}
                                >
                                    <span>{opt.text}</span>
                                    {opt.isCorrect && <Badge className="bg-green-500 hover:bg-green-600 h-5 text-[10px]">Correct</Badge>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
