"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, ShieldAlert, Clock, User, BookOpen, GraduationCap, FileText, Calendar, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const VIOLATION_LABELS: Record<string, string> = {
  tab_switch: "Tab switch",
  back_navigation: "Back navigation",
  window_blur: "Window focus lost",
  fullscreen_exit: "Fullscreen exit",
  copy: "Copy attempt",
  paste: "Paste attempt",
  right_click: "Right-click",
  devtools: "DevTools / restricted key",
};

export interface QuizAttemptDetailData {
  student: { name: string; email: string; image?: string | null };
  course: { title: string };
  lesson?: { title: string };
  quiz: {
    title: string;
    passingScore: number;
    questions: Array<{
      id: string;
      question: string;
      points: number;
      position?: number;
      options: Array<{ id: string; text: string; isCorrect: boolean; position: number }>;
    }>;
  };
  score: number;
  timeSpent: number;
  startedAt: Date;
  submittedAt: Date | null;
  passed: boolean;
  tabSwitchCount: number;
  backButtonCount: number;
  windowBlurCount: number;
  visibilityChangeCount: number;
  copyAttemptCount: number;
  pasteAttemptCount: number;
  rightClickCount: number;
  devToolsAttemptCount: number;
  violationLog: Array<{ type: string; at: string }>;
  answers: Array<{ questionId: string; optionId: string | null; isCorrect: boolean | null }>;
}

function getTotalViolations(a: QuizAttemptDetailData): number {
  return (
    a.tabSwitchCount +
    a.backButtonCount +
    a.windowBlurCount +
    a.visibilityChangeCount +
    a.copyAttemptCount +
    a.pasteAttemptCount +
    a.rightClickCount +
    a.devToolsAttemptCount
  );
}

function getSeverity(total: number): "clean" | "low" | "medium" | "high" {
  if (total === 0) return "clean";
  if (total <= 2) return "low";
  if (total <= 5) return "medium";
  return "high";
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function QuizAttemptDetail({ attempt }: { attempt: QuizAttemptDetailData }) {
  const totalViolations = getTotalViolations(attempt);
  const severity = getSeverity(totalViolations);

  const integrityCounts = [
    { label: "Tab switch", value: attempt.tabSwitchCount },
    { label: "Back button", value: attempt.backButtonCount },
    { label: "Window blur", value: attempt.windowBlurCount },
    { label: "Visibility change", value: attempt.visibilityChangeCount },
    { label: "Copy attempt", value: attempt.copyAttemptCount },
    { label: "Paste attempt", value: attempt.pasteAttemptCount },
    { label: "Right-click", value: attempt.rightClickCount },
    { label: "DevTools attempt", value: attempt.devToolsAttemptCount },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          {/* Student Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
              <AvatarImage src={attempt.student.image ?? ""} alt={attempt.student.name} />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {attempt.student.name?.slice(0, 2).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-lg truncate">{attempt.student.name}</p>
              <p className="text-sm text-muted-foreground truncate">{attempt.student.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Course & Quiz Info */}
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Course</p>
                  <p className="font-medium mt-0.5 truncate">{attempt.course.title}</p>
                </div>
              </div>

              {attempt.lesson && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lesson</p>
                    <p className="font-medium mt-0.5 truncate">{attempt.lesson.title}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quiz</p>
                  <p className="font-medium mt-0.5 truncate">{attempt.quiz.title}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Score & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={cn(
                    "text-2xl font-bold",
                    attempt.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {attempt.score}%
                  </span>
                  {attempt.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{formatTime(attempt.timeSpent)}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time Spent</p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Started</p>
                  <p className="text-sm font-medium mt-0.5">{new Date(attempt.startedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <CalendarCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Submitted</p>
                  <p className="text-sm font-medium mt-0.5">
                    {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Integrity & Answers */}
      <Tabs defaultValue="integrity" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="integrity" className="text-sm font-medium">Integrity</TabsTrigger>
          <TabsTrigger value="answers" className="text-sm font-medium">Answers</TabsTrigger>
        </TabsList>

        <TabsContent value="integrity" className="mt-6 space-y-6">
          {/* Integrity Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Integrity</h3>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-sm px-3 py-1",
                severity === "clean" && "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20",
                severity === "low" && "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20",
                severity === "medium" && "border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20",
                severity === "high" && "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
              )}
            >
              {totalViolations === 0 ? "Clean" : `${totalViolations} violation${totalViolations !== 1 ? "s" : ""}`}
            </Badge>
          </div>

          {/* Integrity Counts Grid */}
          <div className="grid grid-cols-2 gap-3">
            {integrityCounts.map(({ label, value }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  value > 0 ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900" : "bg-muted/30 border-transparent"
                )}
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={cn("text-sm font-semibold", value > 0 && "text-red-600 dark:text-red-400")}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Violation Timeline */}
          {attempt.violationLog.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Timeline</p>
              <ul className="space-y-2 border rounded-xl p-4 bg-muted/30 max-h-52 overflow-y-auto">
                {attempt.violationLog.map((entry, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 text-sm py-1.5 border-b last:border-0 border-border/50">
                    <span className="text-muted-foreground font-mono text-xs">
                      {new Date(entry.at).toLocaleTimeString()}
                    </span>
                    <span className="font-medium">{VIOLATION_LABELS[entry.type] ?? entry.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="answers" className="mt-6 space-y-4">
          {[...attempt.quiz.questions]
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((q, index) => {
              const answer = attempt.answers.find((a) => a.questionId === q.id);
              const isCorrect = answer?.isCorrect ?? false;
              const selectedOptionId = answer?.optionId ?? null;

              return (
                <Card
                  key={q.id}
                  className={cn(
                    "border-2",
                    isCorrect
                      ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/10"
                      : "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base leading-relaxed">
                        <span className="text-muted-foreground font-normal">Q{index + 1}.</span>{" "}
                        {q.question}
                      </CardTitle>
                      <div className="flex items-center gap-2 shrink-0">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {q.points} pt{q.points !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {q.options
                        .sort((a, b) => a.position - b.position)
                        .map((opt) => {
                          const selected = selectedOptionId === opt.id;
                          const correct = opt.isCorrect;
                          return (
                            <li
                              key={opt.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                selected && correct && "border-green-500 bg-green-100 dark:bg-green-950/30",
                                selected && !correct && "border-red-500 bg-red-100 dark:bg-red-950/30",
                                !selected && correct && "border-green-300 bg-green-50/50 dark:bg-green-950/10",
                                !selected && !correct && "border-transparent bg-muted/30"
                              )}
                            >
                              <div className="shrink-0">
                                {selected ? (
                                  correct ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )
                                ) : correct ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                                )}
                              </div>
                              <span className={cn("flex-1", correct && "font-medium text-green-700 dark:text-green-400")}>
                                {opt.text}
                              </span>
                              {selected && !correct && (
                                <Badge variant="outline" className="text-xs border-red-300 text-red-600">
                                  Selected
                                </Badge>
                              )}
                              {correct && !selected && (
                                <Badge variant="outline" className="text-xs border-green-300 text-green-600">
                                  Correct
                                </Badge>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
