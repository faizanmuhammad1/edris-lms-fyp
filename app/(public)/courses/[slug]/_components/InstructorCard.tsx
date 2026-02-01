import { BookOpen, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InstructorCardProps {
    instructor: {
        id: string;
        name: string;
        image: string | null;
        _count: {
            courses: number;
        };
    };
    totalStudents?: number;
}

export function InstructorCard({ instructor, totalStudents = 0 }: InstructorCardProps) {
    const initials = instructor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Instructor</h3>

                <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 border-2 border-primary/20">
                        <AvatarImage src={instructor.image || undefined} alt={instructor.name} />
                        <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                            {instructor.name}
                        </h4>

                        <div className="mt-3 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="p-1.5 rounded-lg bg-primary/10">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                </div>
                                <span>{instructor._count.courses} Courses</span>
                            </div>

                            {totalStudents > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="p-1.5 rounded-lg bg-primary/10">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <span>{totalStudents.toLocaleString()} Students</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Compact inline version for course header
export function InstructorInline({
    instructor,
}: {
    instructor: { name: string; image: string | null };
}) {
    const initials = instructor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Created by</span>
            <div className="flex items-center gap-2 group cursor-pointer">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={instructor.image || undefined} alt={instructor.name} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-primary hover:underline">
                    {instructor.name}
                </span>
            </div>
        </div>
    );
}
