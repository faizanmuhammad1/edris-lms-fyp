"use client";

import { useMemo, useState } from "react";
import { getTeacherQuizAttempts, type TeacherQuizAttemptItem } from "@/app/data/teacher/get-teacher-quiz-attempts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, AlertTriangle, Users, TrendingUp, Award, ShieldAlert, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizAttemptDetail, type QuizAttemptDetailData } from "@/components/quiz-attempt-detail/QuizAttemptDetail";

function getTotalViolations(a: TeacherQuizAttemptItem): number {
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

function toDetailData(a: TeacherQuizAttemptItem): QuizAttemptDetailData {
  return {
    student: { name: a.student.name, email: a.student.email, image: a.student.image },
    course: { title: a.course.title },
    lesson: { title: a.lesson.title },
    quiz: {
      title: a.quiz.title,
      passingScore: a.quiz.passingScore,
      questions: a.quiz.questions.map((q: TeacherQuizAttemptItem["quiz"]["questions"][number], idx: number) => ({
        id: q.id,
        question: q.question,
        points: q.points,
        position: (q as { position?: number }).position ?? idx,
        options: q.options ?? [],
      })),
    },
    score: a.score,
    timeSpent: a.timeSpent,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    passed: a.passed,
    tabSwitchCount: a.tabSwitchCount,
    backButtonCount: a.backButtonCount,
    windowBlurCount: a.windowBlurCount,
    visibilityChangeCount: a.visibilityChangeCount,
    copyAttemptCount: a.copyAttemptCount,
    pasteAttemptCount: a.pasteAttemptCount,
    rightClickCount: a.rightClickCount,
    devToolsAttemptCount: a.devToolsAttemptCount,
    violationLog: a.violationLog,
    answers: a.answers.map((ans: TeacherQuizAttemptItem["answers"][number]) => ({
      questionId: ans.questionId,
      optionId: ans.optionId,
      isCorrect: ans.isCorrect,
    })),
  };
}

interface TeacherQuizAttemptsClientProps {
  initialAttempts: TeacherQuizAttemptItem[];
  courses: { id: string; title: string }[];
}

export function TeacherQuizAttemptsClient({
  initialAttempts,
  courses,
}: TeacherQuizAttemptsClientProps) {
  const [attempts, setAttempts] = useState(initialAttempts);
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<TeacherQuizAttemptItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = useMemo(() => {
    let list = attempts;
    if (courseFilter !== "all") {
      list = list.filter((a) => a.course.id === courseFilter);
    }
    if (flaggedOnly) {
      list = list.filter((a) => getTotalViolations(a) > 0);
    }
    return list;
  }, [attempts, courseFilter, flaggedOnly]);

  const stats = useMemo(() => {
    const totalAttempts = attempts.length;
    const passed = attempts.filter((a) => a.passed).length;
    const flagged = attempts.filter((a) => getTotalViolations(a) > 0).length;
    const uniqueStudents = new Set(attempts.map((a) => a.student.id)).size;
    return {
      totalAttempts,
      passRate: totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0,
      flagged,
      uniqueStudents,
    };
  }, [attempts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getTeacherQuizAttempts(
        courseFilter !== "all" ? { courseId: courseFilter } : undefined
      );
      setAttempts(data);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openDetail = (attempt: TeacherQuizAttemptItem) => {
    setSelectedAttempt(attempt);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quiz attempts</h1>
        <p className="text-muted-foreground mt-1">
          View quiz attempts and integrity for your courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total attempts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">All quiz attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passRate}%</div>
            <p className="text-xs text-muted-foreground">Students passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged attempts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flagged}</div>
            <p className="text-xs text-muted-foreground">With integrity events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueStudents}</div>
            <p className="text-xs text-muted-foreground">Attempted quizzes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Attempts</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={flaggedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setFlaggedOnly(!flaggedOnly)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Flagged only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Integrity</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No attempts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((attempt) => {
                    const total = getTotalViolations(attempt);
                    const severity = getSeverity(total);
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={attempt.student.image ?? ""} alt={attempt.student.name} />
                              <AvatarFallback>{attempt.student.name?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{attempt.student.name}</p>
                              <p className="text-xs text-muted-foreground">{attempt.student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{attempt.course.title}</TableCell>
                        <TableCell>{attempt.quiz.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{attempt.score}%</span>
                            {attempt.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={attempt.passed ? "default" : "destructive"} className={cn(attempt.passed && "bg-green-600 hover:bg-green-700")}>
                            {attempt.passed ? "Passed" : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(attempt.timeSpent)}</TableCell>
                        <TableCell>
                          {total > 0 ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                severity === "high" && "border-red-500 text-red-600",
                                severity === "medium" && "border-amber-500 text-amber-600",
                                severity === "low" && "border-green-600 text-green-600"
                              )}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {total}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Clean
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openDetail(attempt)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Attempt details</SheetTitle>
          </SheetHeader>
          <div className="mt-6 px-1">
            {selectedAttempt && (
              <QuizAttemptDetail attempt={toDetailData(selectedAttempt)} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
