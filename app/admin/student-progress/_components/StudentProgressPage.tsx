"use client";

import { useEffect, useState } from "react";
import { getStudentProgressData } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, Users, Award, Ban, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type StudentData = Awaited<ReturnType<typeof getStudentProgressData>>[number];

function getTotalCheatingAttempts(attempt: StudentData["quizAttempts"][0]) {
  return (
    attempt.tabSwitchCount +
    attempt.backButtonCount +
    attempt.windowBlurCount +
    attempt.visibilityChangeCount +
    attempt.copyAttemptCount +
    attempt.pasteAttemptCount +
    attempt.rightClickCount +
    attempt.devToolsAttemptCount
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getCheatingSeverity(totalCheating: number): "low" | "medium" | "high" {
  if (totalCheating === 0) return "low";
  if (totalCheating <= 3) return "medium";
  return "high";
}

export function StudentProgressPage() {
  const [mockStudents, setMockStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getStudentProgressData();
        setMockStudents(data);
      } catch (error) {
        console.error("Failed to fetch student progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalStudents = mockStudents.length;
  const totalAttempts = mockStudents.reduce((sum, student) => sum + student.quizAttempts.length, 0);
  const passedAttempts = mockStudents.reduce(
    (sum, student) => sum + student.quizAttempts.filter((a) => a.passed).length,
    0
  );
  const totalCheatingAttempts = mockStudents.reduce(
    (sum, student) =>
      sum + student.quizAttempts.reduce((s, a) => s + getTotalCheatingAttempts(a), 0),
    0
  );
  const studentsWithCheating = mockStudents.filter((student) =>
    student.quizAttempts.some((a) => getTotalCheatingAttempts(a) > 0)
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground mt-2">
          Monitor student quiz performance and cheating attempts
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <p className="text-xs text-muted-foreground">Total attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAttempts > 0
                ? Math.round((passedAttempts / totalAttempts) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {passedAttempts} of {totalAttempts} passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cheating Attempts</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheatingAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {studentsWithCheating} students flagged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Quiz Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>Cheating Attempts</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStudents.map((student) =>
                  student.quizAttempts.map((attempt) => {
                    const totalCheating = getTotalCheatingAttempts(attempt);
                    const severity = getCheatingSeverity(totalCheating);

                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{attempt.quizTitle}</TableCell>
                        <TableCell>{attempt.courseName}</TableCell>
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
                            className={cn(
                              attempt.passed && "bg-green-500 hover:bg-green-600"
                            )}
                          >
                            {attempt.passed ? "Passed" : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(attempt.timeSpent)}</TableCell>
                        <TableCell>
                          {totalCheating > 0 ? (
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  severity === "high" && "border-red-500 text-red-500",
                                  severity === "medium" && "border-yellow-500 text-yellow-500",
                                  severity === "low" && "border-green-500 text-green-500"
                                )}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {totalCheating} attempts
                              </Badge>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                {attempt.tabSwitchCount > 0 && (
                                  <div>Tab: {attempt.tabSwitchCount}</div>
                                )}
                                {attempt.backButtonCount > 0 && (
                                  <div>Back: {attempt.backButtonCount}</div>
                                )}
                                {attempt.copyAttemptCount > 0 && (
                                  <div>Copy: {attempt.copyAttemptCount}</div>
                                )}
                                {attempt.pasteAttemptCount > 0 && (
                                  <div>Paste: {attempt.pasteAttemptCount}</div>
                                )}
                                {attempt.devToolsAttemptCount > 0 && (
                                  <div>DevTools: {attempt.devToolsAttemptCount}</div>
                                )}
                                {attempt.rightClickCount > 0 && (
                                  <div>Right-click: {attempt.rightClickCount}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Clean
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {attempt.submittedAt?.toLocaleDateString()} at{" "}
                          {attempt.submittedAt?.toLocaleTimeString()}
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
    </div>
  );
}
