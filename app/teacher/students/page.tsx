import { getTeacherStudents } from "@/app/data/teacher/get-teacher-students";
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
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function TeacherStudentsPage() {
    const students = await getTeacherStudents();

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
                                            <Button variant="ghost" size="icon" title="Contact Student">
                                                <Mail className="h-4 w-4" />
                                                <span className="sr-only">Contact</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
