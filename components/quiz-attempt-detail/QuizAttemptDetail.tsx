import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  GraduationCap,
  MinusCircle,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
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
  printscreen: "Screenshot attempt / PrintScreen key",
  print: "Print attempt",
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

type Severity = "clean" | "low" | "medium" | "high";

const SEVERITY_LABEL: Record<Severity, string> = {
  clean: "No issues",
  low: "Low",
  medium: "Medium",
  high: "High",
};

const SEVERITY_CLASS: Record<Severity, string> = {
  clean: "border-emerald-600/40 text-emerald-700 dark:text-emerald-400",
  low: "border-amber-500/50 text-amber-700 dark:text-amber-400",
  medium: "border-orange-500/50 text-orange-700 dark:text-orange-400",
  high: "border-destructive/50 text-destructive",
};

function countViolations(log: QuizAttemptDetailData["violationLog"] | undefined, type: string) {
  return log?.filter((v) => v.type === type).length ?? 0;
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
    a.devToolsAttemptCount +
    countViolations(a.violationLog, "printscreen") +
    countViolations(a.violationLog, "print")
  );
}

function getSeverity(total: number): Severity {
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

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg bg-muted/40 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium break-words">{value}</dd>
      </div>
    </div>
  );
}

export function QuizAttemptDetail({ attempt }: { attempt: QuizAttemptDetailData }) {
  const totalViolations = getTotalViolations(attempt);
  const severity = getSeverity(totalViolations);
  const violationLog = attempt.violationLog ?? [];

  const integrityCounts = [
    { label: "Tab switch", value: attempt.tabSwitchCount },
    { label: "Back button", value: attempt.backButtonCount },
    { label: "Window blur", value: attempt.windowBlurCount },
    { label: "Visibility change", value: attempt.visibilityChangeCount },
    { label: "Copy attempt", value: attempt.copyAttemptCount },
    { label: "Paste attempt", value: attempt.pasteAttemptCount },
    { label: "Right-click", value: attempt.rightClickCount },
    { label: "DevTools attempt", value: attempt.devToolsAttemptCount },
    { label: "Screenshot attempt", value: countViolations(violationLog, "printscreen") },
    { label: "Print attempt", value: countViolations(violationLog, "print") },
  ];

  const questions = [...attempt.quiz.questions].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const correctCount = questions.filter(
    (q) => attempt.answers.find((a) => a.questionId === q.id)?.isCorrect === true
  ).length;

  return (
    <div className="min-w-0 space-y-6">
      {/* Summary */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Summary</h3>

        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-3 sm:gap-4 sm:p-4">
          <Avatar className="size-12 shrink-0 border-2 border-background sm:size-14">
            <AvatarImage src={attempt.student.image ?? ""} alt="" />
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {attempt.student.name?.slice(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold sm:text-lg" title={attempt.student.name}>
              {attempt.student.name}
            </p>
            <p className="truncate text-sm text-muted-foreground" title={attempt.student.email}>
              {attempt.student.email}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={BookOpen} label="Course" value={attempt.course.title} />
          {attempt.lesson && <InfoTile icon={GraduationCap} label="Lesson" value={attempt.lesson.title} />}
          <InfoTile icon={FileText} label="Quiz" value={attempt.quiz.title} />
        </dl>

        <Separator />

        <dl className="grid gap-3 min-[400px]:grid-cols-2">
          <div className="rounded-xl bg-muted/30 p-4 text-center">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Score</dt>
            <dd className="mt-1 space-y-1.5">
              <span className="block text-2xl font-bold tabular-nums">{attempt.score}%</span>
              <Badge
                variant="outline"
                className={cn(
                  attempt.passed
                    ? "border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
                    : "border-destructive/50 text-destructive"
                )}
              >
                {attempt.passed ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}
                {attempt.passed ? "Passed" : "Not passed"}
              </Badge>
              <span className="block text-xs text-muted-foreground">Pass mark {attempt.quiz.passingScore}%</span>
            </dd>
          </div>

          <div className="rounded-xl bg-muted/30 p-4 text-center">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Time spent</dt>
            <dd className="mt-1 flex items-center justify-center gap-2">
              <Clock className="size-5 text-muted-foreground" aria-hidden="true" />
              <span className="text-2xl font-bold tabular-nums">{formatTime(attempt.timeSpent)}</span>
            </dd>
          </div>
        </dl>

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={Calendar} label="Started" value={new Date(attempt.startedAt).toLocaleString()} />
          <InfoTile
            icon={CalendarCheck}
            label="Submitted"
            value={attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "Not submitted"}
          />
        </dl>
      </section>

      {/* Integrity & answers */}
      <Tabs defaultValue="integrity" className="w-full">
        <TabsList className="grid h-11 w-full grid-cols-2">
          <TabsTrigger value="integrity" className="text-sm font-medium">
            Integrity
          </TabsTrigger>
          <TabsTrigger value="answers" className="text-sm font-medium">
            Answers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrity" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {severity === "clean" ? (
                <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              ) : (
                <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
              )}
              <h3 className="text-lg font-semibold">Integrity</h3>
            </div>
            <Badge variant="outline" className={cn("px-2.5 py-1 text-sm", SEVERITY_CLASS[severity])}>
              {totalViolations === 0
                ? "Clean, no violations"
                : `${totalViolations} violation${totalViolations !== 1 ? "s" : ""} · ${SEVERITY_LABEL[severity]} risk`}
            </Badge>
          </div>

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {integrityCounts.map(({ label, value }) => (
              <div
                key={label}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center",
                  value > 0 ? "border-destructive/40 bg-destructive/5" : "bg-muted/20"
                )}
              >
                <dt className="order-2 text-xs leading-tight font-medium break-words text-muted-foreground">
                  {label}
                </dt>
                <dd className={cn("order-1 text-2xl font-bold tabular-nums", value > 0 && "text-destructive")}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {violationLog.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Timeline</h4>
              <ol
                className="max-h-52 space-y-1 overflow-y-auto rounded-xl border bg-muted/30 p-3"
                tabIndex={0}
                aria-label="Violation timeline"
              >
                {violationLog.map((entry, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 border-b border-border/50 py-1.5 text-sm last:border-0"
                  >
                    <time className="font-mono text-xs text-muted-foreground" dateTime={entry.at}>
                      {new Date(entry.at).toLocaleTimeString()}
                    </time>
                    <span className="min-w-0 font-medium break-words">{VIOLATION_LABELS[entry.type] ?? entry.type}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </TabsContent>

        <TabsContent value="answers" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Answers</h3>
            <p className="text-sm text-muted-foreground">
              {correctCount} of {questions.length} correct
            </p>
          </div>

          {questions.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              This quiz has no questions.
            </p>
          )}

          <ol className="space-y-3">
            {questions.map((q, index) => {
              const answer = attempt.answers.find((a) => a.questionId === q.id);
              const selectedOptionId = answer?.optionId ?? null;
              const answered = selectedOptionId !== null;
              const isCorrect = answer?.isCorrect === true;
              const options = [...q.options].sort((a, b) => a.position - b.position);
              const result = !answered ? "unanswered" : isCorrect ? "correct" : "incorrect";

              return (
                <li
                  key={q.id}
                  className={cn(
                    "min-w-0 space-y-3 rounded-xl border-2 p-3 sm:p-4",
                    result === "correct" && "border-emerald-600/30",
                    result === "incorrect" && "border-destructive/30",
                    result === "unanswered" && "border-border"
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h4 className="min-w-0 leading-relaxed font-medium break-words whitespace-pre-wrap">
                      <span className="font-normal text-muted-foreground">Q{index + 1}.</span> {q.question}
                    </h4>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          result === "correct" && "border-emerald-600/40 text-emerald-700 dark:text-emerald-400",
                          result === "incorrect" && "border-destructive/50 text-destructive"
                        )}
                      >
                        {result === "correct" ? (
                          <CheckCircle2 aria-hidden="true" />
                        ) : result === "incorrect" ? (
                          <XCircle aria-hidden="true" />
                        ) : (
                          <MinusCircle aria-hidden="true" />
                        )}
                        {result === "correct" ? "Correct" : result === "incorrect" ? "Incorrect" : "Not answered"}
                      </Badge>
                      <Badge variant="secondary">
                        {q.points} pt{q.points !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>

                  <ul className="space-y-2" aria-label={`Options for question ${index + 1}`}>
                    {options.map((opt) => {
                      const selected = selectedOptionId === opt.id;
                      const correct = opt.isCorrect;
                      return (
                        <li
                          key={opt.id}
                          className={cn(
                            "flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1.5 rounded-lg border p-3 text-sm",
                            selected && correct && "border-emerald-600/50 bg-emerald-600/5",
                            selected && !correct && "border-destructive/50 bg-destructive/5",
                            !selected && correct && "border-emerald-600/30",
                            !selected && !correct && "border-transparent bg-muted/30"
                          )}
                        >
                          <span className="mt-0.5 shrink-0" aria-hidden="true">
                            {correct ? (
                              <CheckCircle2 className="size-4 text-emerald-700 dark:text-emerald-400" />
                            ) : selected ? (
                              <XCircle className="size-4 text-destructive" />
                            ) : (
                              <Circle className="size-4 text-muted-foreground/40" />
                            )}
                          </span>
                          <span className={cn("min-w-0 flex-1 break-words", correct && "font-medium")}>{opt.text}</span>
                          {(selected || correct) && (
                            <span className="flex flex-wrap gap-1.5">
                              {selected && (
                                <Badge
                                  variant="outline"
                                  className={cn(!correct && "border-destructive/50 text-destructive")}
                                >
                                  Student&apos;s answer
                                </Badge>
                              )}
                              {correct && (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
                                >
                                  Correct answer
                                </Badge>
                              )}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>
        </TabsContent>
      </Tabs>
    </div>
  );
}
