"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileText, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedQuestion } from "@/lib/generate-quiz-questions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addGeneratedQuestions, generateQuizQuestions } from "../actions";

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

type Difficulty = (typeof DIFFICULTY_OPTIONS)[number]["value"];

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 20;

interface AiQuestionGeneratorProps {
  quizId: string;
  lessonId: string;
  lessonHref: string;
  transcriptionReady: boolean;
}

/** Generates questions from the lesson transcript, previews them, and adds the selected ones. */
export function AiQuestionGenerator({ quizId, lessonId, lessonHref, transcriptionReady }: AiQuestionGeneratorProps) {
  const router = useRouter();
  const id = useId();
  const [quizType, setQuizType] = useState<string>("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [numQuestions, setNumQuestions] = useState("5");
  const [extraContext, setExtraContext] = useState("");
  const [focusTopics, setFocusTopics] = useState("");
  const [generating, setGenerating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedQuestion[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const parsedCount = Number(numQuestions);
  const countError =
    numQuestions.trim() === "" || !Number.isInteger(parsedCount) || parsedCount < MIN_QUESTIONS || parsedCount > MAX_QUESTIONS
      ? `Enter a whole number from ${MIN_QUESTIONS} to ${MAX_QUESTIONS}`
      : null;
  const headingId = `${id}-heading`;
  const countErrorId = `${id}-count-error`;

  async function handleGenerate() {
    if (countError) return;
    setGenerating(true);
    setError(null);
    setPreview(null);
    try {
      const result = await generateQuizQuestions(lessonId, {
        quizType: quizType || undefined,
        description: extraContext.trim() || undefined,
        numQuestions: parsedCount,
        difficulty,
        focusTopics: focusTopics.trim() || undefined,
      });
      if (result.success) {
        setPreview(result.questions);
        setSelected(new Set(result.questions.map((_, i) => i)));
        toast.success(
          `Generated ${result.questions.length} question${result.questions.length === 1 ? "" : "s"}. Review them before adding.`
        );
      } else {
        const message =
          result.error === "NO_TRANSCRIPT"
            ? "This lesson doesn't have a transcript yet. Transcribe the lesson video first, then try again."
            : "We couldn't generate questions right now. Please try again in a moment.";
        setError(message);
        toast.error(message);
      }
    } catch {
      const message = "We couldn't generate questions right now. Please try again in a moment.";
      setError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleAdd() {
    if (!preview) return;
    const chosen = preview.filter((_, i) => selected.has(i));
    if (chosen.length === 0) {
      setError("Select at least one question to add.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const result = await addGeneratedQuestions(quizId, chosen);
      if (result.status === "error") {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setPreview(null);
      setSelected(new Set());
      router.refresh();
    } catch {
      const message = "Couldn't add the generated questions. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setAdding(false);
    }
  }

  function toggleSelected(index: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  const busy = generating || adding;

  return (
    <Card className="min-w-0" role="region" aria-labelledby={headingId}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Wand2 className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h2 id={headingId} className="text-lg font-semibold leading-none">
              Generate questions with AI
            </h2>
            <CardDescription>
              Draft multiple choice questions from this lesson&apos;s transcript. You review them before anything is added.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!transcriptionReady ? (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Transcript required</p>
                <p className="text-muted-foreground">
                  Transcribe the lesson video in the lesson editor, then come back to generate questions.
                </p>
              </div>
            </div>
            <Link href={lessonHref} className={cn(buttonVariants({ variant: "outline" }), "h-10 shrink-0")}>
              Open lesson editor
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`${id}-type`}>Question focus</Label>
                <Select value={quizType} onValueChange={setQuizType} disabled={busy}>
                  <SelectTrigger id={`${id}-type`} className="h-10 w-full">
                    <SelectValue placeholder="Select a focus" />
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
                <Label htmlFor={`${id}-difficulty`}>Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)} disabled={busy}>
                  <SelectTrigger id={`${id}-difficulty`} className="h-10 w-full">
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
              <div className="space-y-2">
                <Label htmlFor={`${id}-count`}>Number of questions</Label>
                <Input
                  id={`${id}-count`}
                  type="number"
                  inputMode="numeric"
                  min={MIN_QUESTIONS}
                  max={MAX_QUESTIONS}
                  step={1}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  aria-invalid={!!countError}
                  aria-describedby={countError ? countErrorId : `${id}-count-help`}
                  className="h-10"
                  disabled={busy}
                />
                {countError ? (
                  <p id={countErrorId} className="text-sm text-destructive">
                    {countError}
                  </p>
                ) : (
                  <p id={`${id}-count-help`} className="text-sm text-muted-foreground">
                    Up to {MAX_QUESTIONS} per run.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${id}-context`}>Additional context (optional)</Label>
                <Textarea
                  id={`${id}-context`}
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="e.g. Focus on definitions and formulas"
                  className="min-h-20 resize-y"
                  maxLength={1000}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-topics`}>Focus topics (optional)</Label>
                <Textarea
                  id={`${id}-topics`}
                  value={focusTopics}
                  onChange={(e) => setFocusTopics(e.target.value)}
                  placeholder="e.g. Variables, loops and functions"
                  className="min-h-20 resize-y"
                  maxLength={1000}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={busy || !!countError}
                aria-busy={generating}
                className="h-10 w-full sm:w-auto"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 className="size-4" aria-hidden="true" />
                )}
                {generating ? "Generating questions…" : preview ? "Generate again" : "Generate questions"}
              </Button>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {generating ? "This can take up to a minute." : ""}
              </p>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            {preview && preview.length > 0 && (
              <section className="space-y-4 border-t pt-6" aria-labelledby={`${id}-preview`}>
                <div className="space-y-1">
                  <h3 id={`${id}-preview`} className="font-semibold">
                    Review generated questions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Untick any you don&apos;t want. Added questions are worth 1 point each and can be edited afterwards.
                  </p>
                </div>

                <ol className="space-y-3">
                  {preview.map((q, qIndex) => {
                    const checkboxId = `${id}-q-${qIndex}`;
                    const isSelected = selected.has(qIndex);
                    return (
                      <li
                        key={qIndex}
                        className={cn(
                          "space-y-3 rounded-xl border p-3 sm:p-4",
                          isSelected ? "bg-card" : "bg-muted/30 opacity-75"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={checkboxId}
                            checked={isSelected}
                            onCheckedChange={(checked) => toggleSelected(qIndex, checked === true)}
                            disabled={adding}
                            className="mt-1 size-5"
                          />
                          <Label htmlFor={checkboxId} className="block min-w-0 flex-1 cursor-pointer leading-snug font-medium">
                            <span className="sr-only">Include question {qIndex + 1}: </span>
                            <span aria-hidden="true" className="mr-1 text-muted-foreground">
                              Q{qIndex + 1}.
                            </span>
                            <span className="break-words">{q.question}</span>
                          </Label>
                        </div>
                        <ul className="grid grid-cols-1 gap-2 sm:pl-8 md:grid-cols-2">
                          {q.options.map((opt, oIdx) => (
                            <li
                              key={oIdx}
                              className={cn(
                                "flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                                opt.isCorrect ? "border-primary/50 bg-primary/5" : "border-transparent bg-muted/50"
                              )}
                            >
                              <span className="min-w-0 flex-1 break-words">{opt.text}</span>
                              {opt.isCorrect && (
                                <Badge variant="outline" className="shrink-0 border-primary/50 text-primary">
                                  <CheckCircle2 aria-hidden="true" />
                                  Correct
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ol>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={adding || generating || selected.size === 0}
                    aria-busy={adding}
                    className="h-10"
                  >
                    {adding && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {adding
                      ? "Adding…"
                      : `Add ${selected.size} selected question${selected.size === 1 ? "" : "s"}`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() => {
                      setPreview(null);
                      setSelected(new Set());
                      setError(null);
                    }}
                    disabled={adding}
                  >
                    Discard
                  </Button>
                </div>
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
