"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuizTimer } from "./QuizTimer";
import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitQuizAttempt } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  position: number;
  points: number;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  questions: QuizQuestion[];
}

interface QuizProps {
  quiz: Quiz;
  lessonId: string;
  courseSlug: string;
  onComplete?: () => void;
  onAnswerChange?: (hasAnswers: boolean, answers: Record<string, string>) => void;
  onSubmitRef?: (submitFn: () => void) => void;
  cheatingCountersRef?: React.MutableRefObject<{
    tabSwitchCount: number;
    backButtonCount: number;
    windowBlurCount: number;
    visibilityChangeCount: number;
    copyAttemptCount: number;
    pasteAttemptCount: number;
    rightClickCount: number;
    devToolsAttemptCount: number;
  }>;
}

export function Quiz({ quiz, lessonId, courseSlug, onComplete, onAnswerChange, onSubmitRef, cheatingCountersRef }: QuizProps) {
  const router = useRouter();
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    answers: Record<string, { isCorrect: boolean; correctOptionId: string }>;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [timeUp, setTimeUp] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const submitFnRef = useRef<(() => void) | null>(null);

  const handleSubmit = useCallback(() => {
    if (isSubmitted || isPending) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // Time in seconds

    startTransition(async () => {
      try {
        const response = await submitQuizAttempt({
          quizId: quiz.id,
          lessonId,
          courseSlug,
          answers: selectedAnswers,
          timeSpent: timeSpent,
          cheatingCounters: cheatingCountersRef?.current,
        });

        if (response.status === "success" && response.data) {
          setResults(response.data);
          setIsSubmitted(true);
          
          if (response.data.passed) {
            toast.success(
              `Congratulations! You passed with ${response.data.score}%`
            );
          } else {
            toast.error(
              `You scored ${response.data.score}%. Passing score is ${quiz.passingScore}%`
            );
          }
          
          // Call onComplete callback if provided
          if (onComplete) {
            setTimeout(() => {
              onComplete();
            }, 1000);
          }
        } else {
          toast.error(response.message || "Failed to submit quiz");
        }
      } catch (error) {
        toast.error("An error occurred while submitting the quiz");
        console.error(error);
      }
    });
  }, [isSubmitted, isPending, selectedAnswers, quiz.id, lessonId, courseSlug, quiz.passingScore, onComplete, startTime, cheatingCountersRef]);

  const handleTimeUp = () => {
    setTimeUp(true);
    handleSubmit();
  };

  // Expose submit function to parent
  useEffect(() => {
    submitFnRef.current = handleSubmit;
    if (onSubmitRef) {
      onSubmitRef(() => {
        if (submitFnRef.current) {
          submitFnRef.current();
        }
      });
    }
  }, [onSubmitRef, handleSubmit]);

  const handleAnswerChangeLocal = (questionId: string, optionId: string) => {
    if (isSubmitted || timeUp) return;
    const newAnswers = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(newAnswers);
    // Notify parent about answer changes
    if (onAnswerChange) {
      onAnswerChange(Object.keys(newAnswers).length > 0, newAnswers);
    }
  };

  const allQuestionsAnswered = quiz.questions.every(
    (q) => selectedAnswers[q.id]
  );

  if (isSubmitted && results) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                results.passed
                  ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
              )}
            >
              {results.passed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-semibold">{results.score}%</span>
            </div>
          </div>
          {quiz.description && (
            <p className="text-muted-foreground mt-2">{quiz.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{results.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {results.totalQuestions - results.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{results.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((question, index) => {
              const selectedOptionId = selectedAnswers[question.id];
              const answerResult = results.answers[question.id];
              const isCorrect = answerResult?.isCorrect ?? false;
              const correctOptionId = answerResult?.correctOptionId;

              return (
                <Card
                  key={question.id}
                  className={cn(
                    "border-2",
                    isCorrect
                      ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/10"
                      : "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-lg">
                        Question {index + 1}: {question.question}
                      </CardTitle>
                      <div className="flex items-center gap-2 shrink-0">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <span className="text-sm font-semibold">
                          {question.points} point{question.points !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedOptionId} disabled>
                      {question.options
                        .sort((a, b) => a.position - b.position)
                        .map((option) => {
                          const isSelected = selectedOptionId === option.id;
                          const isCorrectOption = option.id === correctOptionId;

                          return (
                            <div
                              key={option.id}
                              className={cn(
                                "flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors",
                                isSelected && isCorrectOption
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                  : isSelected && !isCorrectOption
                                  ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                                  : isCorrectOption && !isSelected
                                  ? "border-green-300 bg-green-50/50 dark:bg-green-950/10"
                                  : "border-transparent bg-muted/50"
                              )}
                            >
                              <RadioGroupItem
                                value={option.id}
                                id={option.id}
                                className="shrink-0"
                              />
                              <Label
                                htmlFor={option.id}
                                className={cn(
                                  "flex-1 cursor-pointer",
                                  isCorrectOption &&
                                    "font-semibold text-green-700 dark:text-green-400"
                                )}
                              >
                                {option.text}
                              </Label>
                              {isCorrectOption && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                    </RadioGroup>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAnswers({});
                setIsSubmitted(false);
                setResults(null);
                setTimeUp(false);
              }}
            >
              Retake Quiz
            </Button>
            <Button onClick={() => router.push(`/dashboard/${courseSlug}`)}>
              Continue to Course
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              {quiz.title}
              {quiz.timeLimit && (
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {quiz.timeLimit} min
                </span>
              )}
            </CardTitle>
            {quiz.description && (
              <p className="text-muted-foreground mt-2">{quiz.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4">
              <div className="text-sm text-muted-foreground">
                {quiz.questions.length} question
                {quiz.questions.length !== 1 ? "s" : ""}
              </div>
              <div className="text-sm text-muted-foreground">
                Passing score: {quiz.passingScore}%
              </div>
            </div>
          </div>
          {quiz.timeLimit && (
            <QuizTimer
              timeLimitMinutes={quiz.timeLimit}
              onTimeUp={handleTimeUp}
              isCompleted={isSubmitted}
            />
          )}
        </div>
        {timeUp && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Time's up! Submitting quiz...</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {quiz.questions
          .sort((a, b) => a.position - b.position)
          .map((question, index) => (
            <Card key={question.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {index + 1}: {question.question}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {question.points} point{question.points !== 1 ? "s" : ""}
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedAnswers[question.id] || ""}
                  onValueChange={(value) => handleAnswerChangeLocal(question.id, value)}
                  disabled={isSubmitted || timeUp}
                >
                  {question.options
                    .sort((a, b) => a.position - b.position)
                    .map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label
                          htmlFor={option.id}
                          className="flex-1 cursor-pointer"
                        >
                          {option.text}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {Object.keys(selectedAnswers).length} of {quiz.questions.length}{" "}
            questions answered
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered || isSubmitted || isPending || timeUp}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
