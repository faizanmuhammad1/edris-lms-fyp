import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, Users, Award, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockStudents = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    quizAttempts: [
      {
        id: "1",
        quizTitle: "What is Next.js and Why Use It? - Quiz",
        courseName: "Complete Next.js 15 Masterclass",
        score: 85,
        timeSpent: 320, // seconds
        startedAt: new Date("2024-01-15T10:30:00"),
        submittedAt: new Date("2024-01-15T10:35:20"),
        isCompleted: true,
        passed: true,
        tabSwitchCount: 0,
        backButtonCount: 0,
        windowBlurCount: 0,
        visibilityChangeCount: 0,
        copyAttemptCount: 0,
        pasteAttemptCount: 0,
        rightClickCount: 0,
        devToolsAttemptCount: 0,
      },
      {
        id: "2",
        quizTitle: "Introduction to Server Components - Quiz",
        courseName: "Complete Next.js 15 Masterclass",
        score: 72,
        timeSpent: 450,
        startedAt: new Date("2024-01-16T14:20:00"),
        submittedAt: new Date("2024-01-16T14:27:30"),
        isCompleted: true,
        passed: true,
        tabSwitchCount: 2,
        backButtonCount: 1,
        windowBlurCount: 1,
        visibilityChangeCount: 2,
        copyAttemptCount: 1,
        pasteAttemptCount: 0,
        rightClickCount: 0,
        devToolsAttemptCount: 1,
      },
    ],
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    quizAttempts: [
      {
        id: "3",
        quizTitle: "What is Next.js and Why Use It? - Quiz",
        courseName: "Complete Next.js 15 Masterclass",
        score: 92,
        timeSpent: 280,
        startedAt: new Date("2024-01-14T09:15:00"),
        submittedAt: new Date("2024-01-14T09:19:40"),
        isCompleted: true,
        passed: true,
        tabSwitchCount: 0,
        backButtonCount: 0,
        windowBlurCount: 0,
        visibilityChangeCount: 0,
        copyAttemptCount: 0,
        pasteAttemptCount: 0,
        rightClickCount: 0,
        devToolsAttemptCount: 0,
      },
      {
        id: "4",
        quizTitle: "Introduction to React - Quiz",
        courseName: "React Fundamentals",
        score: 68,
        timeSpent: 520,
        startedAt: new Date("2024-01-17T11:00:00"),
        submittedAt: new Date("2024-01-17T11:08:40"),
        isCompleted: true,
        passed: false,
        tabSwitchCount: 5,
        backButtonCount: 3,
        windowBlurCount: 4,
        visibilityChangeCount: 5,
        copyAttemptCount: 2,
        pasteAttemptCount: 1,
        rightClickCount: 2,
        devToolsAttemptCount: 3,
      },
    ],
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    quizAttempts: [
      {
        id: "5",
        quizTitle: "Why TypeScript? - Quiz",
        courseName: "TypeScript for JavaScript Developers",
        score: 78,
        timeSpent: 380,
        startedAt: new Date("2024-01-18T15:30:00"),
        submittedAt: new Date("2024-01-18T15:36:20"),
        isCompleted: true,
        passed: true,
        tabSwitchCount: 1,
        backButtonCount: 0,
        windowBlurCount: 1,
        visibilityChangeCount: 1,
        copyAttemptCount: 0,
        pasteAttemptCount: 0,
        rightClickCount: 0,
        devToolsAttemptCount: 0,
      },
    ],
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice.williams@example.com",
    quizAttempts: [
      {
        id: "6",
        quizTitle: "Setting Up the Database - Quiz",
        courseName: "Complete Next.js 15 Masterclass",
        score: 45,
        timeSpent: 600,
        startedAt: new Date("2024-01-19T13:00:00"),
        submittedAt: new Date("2024-01-19T13:10:00"),
        isCompleted: true,
        passed: false,
        tabSwitchCount: 8,
        backButtonCount: 5,
        windowBlurCount: 7,
        visibilityChangeCount: 8,
        copyAttemptCount: 4,
        pasteAttemptCount: 3,
        rightClickCount: 5,
        devToolsAttemptCount: 6,
      },
    ],
  },
  {
    id: "5",
    name: "Charlie Brown",
    email: "charlie.brown@example.com",
    quizAttempts: [
      {
        id: "7",
        quizTitle: "Generics - Quiz",
        courseName: "TypeScript for JavaScript Developers",
        score: 95,
        timeSpent: 290,
        startedAt: new Date("2024-01-20T16:00:00"),
        submittedAt: new Date("2024-01-20T16:04:50"),
        isCompleted: true,
        passed: true,
        tabSwitchCount: 0,
        backButtonCount: 0,
        windowBlurCount: 0,
        visibilityChangeCount: 0,
        copyAttemptCount: 0,
        pasteAttemptCount: 0,
        rightClickCount: 0,
        devToolsAttemptCount: 0,
      },
    ],
  },
];

function getTotalCheatingAttempts(attempt: typeof mockStudents[0]["quizAttempts"][0]) {
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

export async function StudentProgressPage() {
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
