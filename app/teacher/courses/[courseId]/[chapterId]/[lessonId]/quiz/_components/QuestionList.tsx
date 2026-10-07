"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Pencil, PlusIcon, CheckCircle2, Circle } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestion, updateQuestion } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
    const [editing, setEditing] = useState<Question | null>(null);
    const [editQuestion, setEditQuestion] = useState("");
    const [editPoints, setEditPoints] = useState(1);
    // `id` is kept for existing options so they are updated in place (past attempts reference them)
    const [editOptions, setEditOptions] = useState<{ id?: string; text: string; isCorrect: boolean }[]>([]);
    const router = useRouter();

    const handleDelete = (questionId: string) => {
        if (!confirm("Delete this question?")) return;

        startTransition(async () => {
            try {
                const result = await deleteQuestion(questionId);
                if (!result.success) {
                    toast.error(result.error ?? "Failed to delete question");
                    return;
                }
                toast.success("Question deleted");
                router.refresh();
            } catch {
                toast.error("Failed to delete question");
            }
        });
    };

    const openEdit = (q: Question) => {
        setEditing(q);
        setEditQuestion(q.question);
        setEditPoints(q.points);
        setEditOptions(
            [...q.options]
                .sort((a, b) => a.position - b.position)
                .map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
        );
    };

    const closeEdit = () => {
        setEditing(null);
    };

    const handleEditOptionChange = (index: number, value: string) => {
        const next = [...editOptions];
        next[index] = { ...next[index], text: value };
        setEditOptions(next);
    };

    const handleEditSetCorrect = (index: number) => {
        setEditOptions(editOptions.map((opt, i) => ({ ...opt, isCorrect: i === index })));
    };

    const handleAddEditOption = () => {
        setEditOptions([...editOptions, { text: "", isCorrect: false }]);
    };

    const handleRemoveEditOption = (index: number) => {
        if (editOptions.length <= 2) {
            toast.error("A question must have at least 2 options");
            return;
        }
        setEditOptions(editOptions.filter((_, i) => i !== index));
    };

    const handleSaveEdit = () => {
        if (!editing) return;
        if (!editQuestion.trim()) {
            toast.error("Question text is required");
            return;
        }
        if (editOptions.some((o) => !o.text.trim())) {
            toast.error("All options must have text");
            return;
        }
        if (editOptions.filter((o) => o.isCorrect).length !== 1) {
            toast.error("Exactly one option must be marked correct");
            return;
        }

        startTransition(async () => {
            try {
                const result = await updateQuestion(editing.id, {
                    question: editQuestion.trim(),
                    points: editPoints,
                    options: editOptions.map((o) => ({ id: o.id, text: o.text.trim(), isCorrect: o.isCorrect })),
                });
                if (!result.success) {
                    toast.error(result.error ?? "Failed to update question");
                    return;
                }
                toast.success("Question updated");
                closeEdit();
                router.refresh();
            } catch {
                toast.error("Failed to update question");
            }
        });
    };

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
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Edit question"
                                    onClick={() => openEdit(q)}
                                    disabled={pending}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(q.id)}
                                    disabled={pending}
                                    title="Delete question"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
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

            <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                        <DialogDescription>
                            Update the question text, points, and options.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Input
                                value={editQuestion}
                                onChange={(e) => setEditQuestion(e.target.value)}
                                placeholder="e.g. What is the capital of France?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                                type="number"
                                min={1}
                                value={editPoints}
                                onChange={(e) => setEditPoints(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Options</Label>
                            <div className="space-y-2">
                                {editOptions.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className={cn("shrink-0", option.isCorrect ? "text-green-500 hover:text-green-600" : "text-muted-foreground")}
                                            onClick={() => handleEditSetCorrect(index)}
                                            title="Mark as correct answer"
                                        >
                                            {option.isCorrect ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                                        </Button>
                                        <Input
                                            value={option.text}
                                            onChange={(e) => handleEditOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-destructive hover:text-destructive"
                                            onClick={() => handleRemoveEditOption(index)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddEditOption} className="mt-2">
                                <PlusIcon className="size-3 mr-2" /> Add Option
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeEdit}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={pending}>
                            {pending ? "Saving…" : "Save changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
