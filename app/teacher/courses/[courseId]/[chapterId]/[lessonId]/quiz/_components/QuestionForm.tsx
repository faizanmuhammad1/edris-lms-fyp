"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createQuestion } from "../actions"; // Assuming updateQuestion exists or will be added
import { cn } from "@/lib/utils";

interface QuestionFormProps {
    quizId: string;
}

export function QuestionForm({ quizId }: QuestionFormProps) {
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [points, setPoints] = useState(1);
    const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
    ]);
    const [pending, startTransition] = useTransition();

    const handleAddOption = () => {
        setOptions([...options, { text: "", isCorrect: false }]);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) {
            toast.error("A question must have at least 2 options");
            return;
        }
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleSetCorrect = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index
        }));
        setOptions(newOptions);
    };

    const handleSubmit = () => {
        if (!question) {
            toast.error("Question text is required");
            return;
        }
        if (options.some(opt => !opt.text)) {
            toast.error("All options must have text");
            return;
        }

        startTransition(async () => {
            try {
                await createQuestion(quizId, {
                    question,
                    points,
                    options
                });
                toast.success("Question added successfully");
                setOpen(false);
                // Reset form
                setQuestion("");
                setPoints(1);
                setOptions([
                    { text: "", isCorrect: true },
                    { text: "", isCorrect: false },
                ]);
            } catch {
                toast.error("Failed to add question");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusIcon className="size-4 mr-2" /> Add Question
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Question</DialogTitle>
                    <DialogDescription>
                        Create a multiple choice question for this quiz.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What is the capital of France?"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Points</Label>
                        <Input
                            type="number"
                            min={1}
                            value={points}
                            onChange={(e) => setPoints(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Options</Label>
                        <div className="space-y-2">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className={cn("shrink-0", option.isCorrect ? "text-green-500 hover:text-green-600" : "text-muted-foreground")}
                                        onClick={() => handleSetCorrect(index)}
                                        title="Mark as correct answer"
                                    >
                                        {option.isCorrect ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                                    </Button>
                                    <Input
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => handleRemoveOption(index)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="mt-2">
                            <PlusIcon className="size-3 mr-2" /> Add Option
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={pending}>
                        {pending ? "Adding..." : "Add Question"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
