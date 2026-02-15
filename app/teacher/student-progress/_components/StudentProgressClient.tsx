"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTeacherQuizAttempts, type TeacherQuizAttemptItem } from "@/app/data/teacher/get-teacher-quiz-attempts";
import {
  getTeacherAssignmentSubmissions,
  type TeacherAssignmentSubmissionItem,
} from "@/app/data/teacher/get-teacher-assignment-submissions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Award,
  ShieldAlert,
  Eye,
  Loader2,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizAttemptDetail, type QuizAttemptDetailData } from "@/components/quiz-attempt-detail/QuizAttemptDetail";
import { gradeSubmission } from "../../courses/[courseId]/[chapterId]/[lessonId]/assignment/actions";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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

interface StudentProgressClientProps {
  initialAttempts: TeacherQuizAttemptItem[];
  initialSubmissions: TeacherAssignmentSubmissionItem[];
  courses: { id: string; title: string }[];
}

export function StudentProgressClient({
  initialAttempts,
  initialSubmissions,
  courses,
}: StudentProgressClientProps) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(initialAttempts);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [needsGradingOnly, setNeedsGradingOnly] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<TeacherQuizAttemptItem | null>(null);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradingMaxScore, setGradingMaxScore] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [gradePending, startGradeTransition] = useTransition();

  const filteredAttempts = useMemo(() => {
    let list = attempts;
    if (courseFilter !== "all") list = list.filter((a) => a.course.id === courseFilter);
    if (flaggedOnly) list = list.filter((a) => getTotalViolations(a) > 0);
    return list;
  }, [attempts, courseFilter, flaggedOnly]);

  const filteredSubmissions = useMemo(() => {
    let list = submissions;
    if (courseFilter !== "all") list = list.filter((s) => s.course.id === courseFilter);
    if (needsGradingOnly) list = list.filter((s) => s.status === "Submitted");
    return list;
  }, [submissions, courseFilter, needsGradingOnly]);

  const stats = useMemo(() => {
    const totalAttempts = attempts.length;
    const passed = attempts.filter((a) => a.passed).length;
    const flagged = attempts.filter((a) => getTotalViolations(a) > 0).length;
    const totalSubmissions = submissions.length;
    const needsGrading = submissions.filter((s) => s.status === "Submitted").length;
    const uniqueFromAttempts = new Set(attempts.map((a) => a.student.id));
    const uniqueFromSubmissions = new Set(submissions.map((s) => s.student.id));
    const uniqueStudents = new Set([...uniqueFromAttempts, ...uniqueFromSubmissions]).size;
    return {
      totalAttempts,
      passRate: totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0,
      flagged,
      totalSubmissions,
      needsGrading,
      uniqueStudents,
    };
  }, [attempts, submissions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [a, s] = await Promise.all([
        getTeacherQuizAttempts(courseFilter !== "all" ? { courseId: courseFilter } : undefined),
        getTeacherAssignmentSubmissions(courseFilter !== "all" ? { courseId: courseFilter } : undefined),
      ]);
      setAttempts(a);
      setSubmissions(s);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openQuizDetail = (attempt: TeacherQuizAttemptItem) => {
    setSelectedAttempt(attempt);
    setQuizSheetOpen(true);
  };

  const openGrading = (sub: TeacherAssignmentSubmissionItem) => {
    setGradingSubmissionId(sub.id);
    setGradingMaxScore(sub.assignment.maxScore);
    setGradeScore(sub.score != null ? String(sub.score) : "");
    setGradeFeedback(sub.feedback ?? "");
  };

  const handleSaveGrade = () => {
    if (!gradingSubmissionId) return;
    startGradeTransition(async () => {
      const numScore = gradeScore === "" ? undefined : Number(gradeScore);
      const { data: result, error } = await tryCatch(
        gradeSubmission(gradingSubmissionId, {
          score: numScore,
          feedback: gradeFeedback || undefined,
        })
      );
      if (error) {
        toast.error("Something went wrong");
        return;
      }
      if (result?.status === "success") {
        toast.success(result.message);
        setGradingSubmissionId(null);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to grade");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground mt-1">
          Quiz attempts and assignment submissions across your courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz attempts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">Total attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz pass rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passRate}%</div>
            <p className="text-xs text-muted-foreground">Students passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs grading</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needsGrading}</div>
            <p className="text-xs text-muted-foreground">Assignment submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueStudents}</div>
            <p className="text-xs text-muted-foreground">Across quizzes & assignments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Activity</CardTitle>
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
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quizzes" className="w-full">
            <TabsList>
              <TabsTrigger value="quizzes">Quiz attempts</TabsTrigger>
              <TabsTrigger value="assignments">Assignment submissions</TabsTrigger>
            </TabsList>
            <TabsContent value="quizzes" className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={flaggedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlaggedOnly(!flaggedOnly)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Flagged only
                </Button>
              </div>
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
                    {filteredAttempts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No quiz attempts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttempts.map((attempt) => {
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
                              <Badge
                                variant={attempt.passed ? "default" : "destructive"}
                                className={cn(attempt.passed && "bg-green-600 hover:bg-green-700")}
                              >
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
                              <Button variant="ghost" size="sm" onClick={() => openQuizDetail(attempt)}>
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
            </TabsContent>
            <TabsContent value="assignments" className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={needsGradingOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNeedsGradingOnly(!needsGradingOnly)}
                >
                  <ClipboardCheck className="h-4 w-4 mr-1" />
                  Needs grading
                </Button>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Lesson</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No assignment submissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={sub.student.image ?? ""} alt={sub.student.name} />
                                <AvatarFallback>{sub.student.name?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{sub.student.name}</p>
                                <p className="text-xs text-muted-foreground">{sub.student.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{sub.course.title}</TableCell>
                          <TableCell>{sub.lesson.title}</TableCell>
                          <TableCell>{sub.assignment.title}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.status === "Graded" ? "default" : "secondary"}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.status === "Graded" && sub.score != null ? (
                              sub.assignment.maxScore != null ? (
                                `${sub.score} / ${sub.assignment.maxScore}`
                              ) : (
                                sub.score
                              )
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openGrading(sub)}>
                              {sub.status === "Graded" ? "View / Edit grade" : "Grade"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Sheet open={quizSheetOpen} onOpenChange={setQuizSheetOpen}>
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

      <Sheet open={!!gradingSubmissionId} onOpenChange={(open) => !open && setGradingSubmissionId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Grade submission</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Score {gradingMaxScore != null ? `(out of ${gradingMaxScore})` : ""}</Label>
              <Input
                type="number"
                min={0}
                max={gradingMaxScore ?? undefined}
                placeholder="Optional"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
              />
            </div>
            <div>
              <Label>Feedback (optional)</Label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Write feedback for the student..."
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setGradingSubmissionId(null)} disabled={gradePending}>
                Cancel
              </Button>
              <Button onClick={handleSaveGrade} disabled={gradePending}>
                {gradePending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save grade
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
