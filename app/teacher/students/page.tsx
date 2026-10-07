import { getTeacherStudents, getTeacherBannedEnrollments } from "@/app/data/teacher/get-teacher-students";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EnrollmentActions } from "./_components/EnrollmentActions";
import { UnbanButton } from "./_components/UnbanButton";

export default async function TeacherStudentsPage() {
    const [students, banned] = await Promise.all([
        getTeacherStudents(),
        getTeacherBannedEnrollments(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Students</h1>
                <p className="text-muted-foreground">Manage ongoing enrollments in your courses.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Enrolled Students</CardTitle>
                    <CardDescription>
                        You have {students.length} active enrollments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Enrolled Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No active students found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((enrollment) => (
                                    <TableRow key={enrollment.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={enrollment.User.image || ""} alt={enrollment.User.name || "Student"} />
                                                    <AvatarFallback>{enrollment.User.name?.slice(0, 2).toUpperCase() || "ST"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{enrollment.User.name}</span>
                                                    <span className="text-xs text-muted-foreground">{enrollment.User.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{enrollment.Course.title}</TableCell>
                                        <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">Active</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <EnrollmentActions
                                                enrollmentId={enrollment.id}
                                                studentName={enrollment.User.name ?? "Student"}
                                                courseTitle={enrollment.Course.title}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {banned.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Banned (access revoked)</CardTitle>
                        <CardDescription>
                            {banned.length} enrollment{banned.length === 1 ? "" : "s"} with access revoked. Unban to restore access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Enrolled Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banned.map((enrollment) => (
                                    <TableRow key={enrollment.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={enrollment.User.image || ""} alt={enrollment.User.name || "Student"} />
                                                    <AvatarFallback>{enrollment.User.name?.slice(0, 2).toUpperCase() || "ST"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{enrollment.User.name}</span>
                                                    <span className="text-xs text-muted-foreground">{enrollment.User.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{enrollment.Course.title}</TableCell>
                                        <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">Banned</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <UnbanButton
                                                enrollmentId={enrollment.id}
                                                studentName={enrollment.User.name ?? "Student"}
                                                courseTitle={enrollment.Course.title}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
