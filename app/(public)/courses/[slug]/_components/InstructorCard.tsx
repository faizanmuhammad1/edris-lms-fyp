import { BookOpen, Users } from "lucide-react";
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

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function InstructorCard({ instructor, totalStudents = 0 }: InstructorCardProps) {
    const courseCount = instructor._count.courses;

    return (
        <section aria-labelledby="instructor-heading" className="space-y-4">
            <h2 id="instructor-heading" className="text-2xl font-semibold tracking-tight">
                Your instructor
            </h2>
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
                <Avatar className="size-16 border sm:size-20">
                    <AvatarImage src={instructor.image || undefined} alt="" />
                    <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                        {getInitials(instructor.name)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <h3 className="break-words text-xl font-semibold text-foreground">{instructor.name}</h3>
                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <BookOpen className="size-4 text-primary" aria-hidden="true" />
                            {courseCount} course{courseCount === 1 ? "" : "s"}
                        </li>
                        {totalStudents > 0 && (
                            <li className="flex items-center gap-2">
                                <Users className="size-4 text-primary" aria-hidden="true" />
                                {totalStudents.toLocaleString()} student{totalStudents === 1 ? "" : "s"} in this course
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </section>
    );
}

// Compact inline version for course header
export function InstructorInline({
    instructor,
}: {
    instructor: { name: string; image: string | null };
}) {
    return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Created by</span>
            <span className="flex min-w-0 items-center gap-2">
                <Avatar className="size-6">
                    <AvatarImage src={instructor.image || undefined} alt="" />
                    <AvatarFallback className="text-xs">{getInitials(instructor.name)}</AvatarFallback>
                </Avatar>
                <span className="break-words font-medium text-foreground">{instructor.name}</span>
            </span>
        </div>
    );
}
