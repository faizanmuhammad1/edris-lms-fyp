"use client";

import { useCallback, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, ClipboardCheck, RefreshCw, ShieldAlert, Users } from "lucide-react";
import type { TeacherQuizAttemptItem } from "@/app/data/teacher/get-teacher-quiz-attempts";
import type { TeacherAssignmentSubmissionItem } from "@/app/data/teacher/get-teacher-assignment-submissions";
import { PageHeader } from "@/components/general/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard, StatGrid } from "@/app/teacher/_components/StatCard";
import { ProgressDetailDialog, type DetailView } from "./ProgressDetailDialog";
import { QuizAttemptsTable } from "./QuizAttemptsTable";
import { StudentsOverviewTable } from "./StudentsOverviewTable";
import { SubmissionsTable } from "./SubmissionsTable";
import {
  getTotalViolations,
  PROGRESS_TABS,
  summarizeStudents,
  type ProgressTab,
  type QuizAttempt,
  type StudentSummary,
  type Submission,
} from "./progress-utils";

interface StudentProgressClientProps {
  initialAttempts: TeacherQuizAttemptItem[];
  initialSubmissions: TeacherAssignmentSubmissionItem[];
  courses: { id: string; title: string }[];
  initialTab?: ProgressTab;
}

export function StudentProgressClient({
  initialAttempts: attempts,
  initialSubmissions: submissions,
  courses,
  initialTab = "students",
}: StudentProgressClientProps) {
  const router = useRouter();
  const courseSelectId = useId();
  const [tab, setTab] = useState<ProgressTab>(initialTab);
  const [courseFilter, setCourseFilter] = useState("all");
  const [detail, setDetail] = useState<DetailView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const showDetail = useCallback((view: DetailView | null) => {
    if (view) {
      setDetail(view);
      setDetailOpen(true);
    } else {
      // Keep `detail` so the dialog content stays visible while it animates out.
      setDetailOpen(false);
    }
  }, []);

  const refresh = useCallback(() => startRefresh(() => router.refresh()), [router]);

  const filteredAttempts = useMemo(
    () => (courseFilter === "all" ? attempts : attempts.filter((a) => a.course.id === courseFilter)),
    [attempts, courseFilter]
  );
  const filteredSubmissions = useMemo(
    () => (courseFilter === "all" ? submissions : submissions.filter((s) => s.course.id === courseFilter)),
    [submissions, courseFilter]
  );
  const students = useMemo(
    () => summarizeStudents(filteredAttempts, filteredSubmissions),
    [filteredAttempts, filteredSubmissions]
  );

  const stats = useMemo(() => {
    const total = filteredAttempts.length;
    const passed = filteredAttempts.filter((a) => a.passed).length;
    return {
      total,
      passed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      flagged: filteredAttempts.filter((a) => getTotalViolations(a) > 0).length,
      needsGrading: filteredSubmissions.filter((s) => s.status === "Submitted").length,
    };
  }, [filteredAttempts, filteredSubmissions]);

  const changeTab = (value: string) => {
    if (!PROGRESS_TABS.includes(value as ProgressTab)) return;
    setTab(value as ProgressTab);
    // Keep the tab in the URL so reloads and shared links open the same view.
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(null, "", url);
  };

  const viewStudent = useCallback(
    (s: StudentSummary) => showDetail({ kind: "student", studentId: s.id }),
    [showDetail]
  );
  const viewAttempt = useCallback((a: QuizAttempt) => showDetail({ kind: "attempt", attemptId: a.id }), [showDetail]);
  const gradeSubmission = useCallback(
    (s: Submission) => showDetail({ kind: "grade", submissionId: s.id }),
    [showDetail]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student progress"
        description="Quiz results, integrity reports and assignment submissions across your courses."
        actions={
          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
            <div className="grid min-w-0 flex-1 gap-1.5 sm:w-60 sm:flex-none">
              <Label htmlFor={courseSelectId}>Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger id={courseSelectId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="truncate">{c.title}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={refresh} disabled={isRefreshing} aria-busy={isRefreshing}>
              <RefreshCw className={isRefreshing ? "motion-safe:animate-spin" : undefined} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        }
      />

      <StatGrid>
        <StatCard label="Active students" value={students.length} description="Took a quiz or submitted work" icon={Users} />
        <StatCard
          label="Quiz pass rate"
          value={`${stats.passRate}%`}
          description={`${stats.passed} of ${stats.total} ${stats.total === 1 ? "attempt" : "attempts"} passed`}
          icon={Award}
        />
        <StatCard
          label="Flagged attempts"
          value={stats.flagged}
          description="With integrity events"
          icon={ShieldAlert}
        />
        <StatCard
          label="Needs grading"
          value={stats.needsGrading}
          description={`Of ${filteredSubmissions.length} assignment ${filteredSubmissions.length === 1 ? "submission" : "submissions"}`}
          icon={ClipboardCheck}
        />
      </StatGrid>

      <Tabs value={tab} onValueChange={changeTab} className="gap-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="students" className="px-3">
              Students
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="px-3">
              Quiz attempts
            </TabsTrigger>
            <TabsTrigger value="assignments" className="px-3">
              Assignments
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="students">
          <StudentsOverviewTable students={students} onView={viewStudent} />
        </TabsContent>
        <TabsContent value="quizzes">
          <QuizAttemptsTable attempts={filteredAttempts} onView={viewAttempt} />
        </TabsContent>
        <TabsContent value="assignments">
          <SubmissionsTable submissions={filteredSubmissions} onGrade={gradeSubmission} />
        </TabsContent>
      </Tabs>

      <ProgressDetailDialog
        open={detailOpen}
        view={detail}
        onViewChange={showDetail}
        students={students}
        attempts={filteredAttempts}
        submissions={filteredSubmissions}
        onGraded={refresh}
      />
    </div>
  );
}
