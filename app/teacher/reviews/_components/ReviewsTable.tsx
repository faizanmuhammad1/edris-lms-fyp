"use client";

import { useId, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MessageSquareText, Star } from "lucide-react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteReviewButton } from "@/components/teacher/DeleteReviewButton";
import { StudentIdentity } from "@/app/teacher/students/_components/StudentIdentity";
import { formatDate } from "@/app/teacher/_components/format";
import { cn } from "@/lib/utils";

export interface ReviewRow {
    id: string;
    rating: number;
    text: string | null;
    /** ISO date string. */
    createdAt: string;
    student: { name: string; email: string; image: string | null };
    course: { id: string; title: string };
}

/** Comments longer than this get a "Show more" toggle. */
const CLAMP_THRESHOLD = 180;

export function RatingStars({ rating, className }: { rating: number; className?: string }) {
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            <span className="sr-only">
                {rating} out of 5 stars
            </span>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    aria-hidden="true"
                    className={cn(
                        "size-4",
                        i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                    )}
                />
            ))}
        </div>
    );
}

function ReviewText({ text, className }: { text: string | null; className?: string }) {
    const [expanded, setExpanded] = useState(false);
    const id = useId();

    if (!text?.trim()) {
        return <p className={cn("text-sm italic text-muted-foreground", className)}>No written comment</p>;
    }

    const long = text.length > CLAMP_THRESHOLD;
    return (
        <div className={cn("whitespace-normal", className)}>
            <p id={id} className={cn("text-sm break-words whitespace-pre-line", long && !expanded && "line-clamp-3")}>
                {text}
            </p>
            {long && (
                <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0 py-1"
                    aria-expanded={expanded}
                    aria-controls={id}
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded ? "Show less" : "Show more"}
                </Button>
            )}
        </div>
    );
}

const columns: ColumnDef<ReviewRow>[] = [
    {
        id: "student",
        accessorFn: (row) => row.student.name.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Student" />,
        cell: ({ row }) => (
            <StudentIdentity
                name={row.original.student.name}
                email={row.original.student.email}
                image={row.original.student.image}
                className="max-w-[14rem]"
            />
        ),
    },
    {
        id: "course",
        accessorFn: (row) => row.course.title.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Course" />,
        cell: ({ row }) => (
            <p className="line-clamp-2 min-w-[8rem] max-w-[12rem] whitespace-normal break-words font-medium">
                {row.original.course.title}
            </p>
        ),
    },
    {
        accessorKey: "rating",
        header: ({ column }) => <SortableHeader column={column} title="Rating" />,
        cell: ({ row }) => <RatingStars rating={row.original.rating} />,
    },
    {
        id: "comment",
        header: "Review",
        cell: ({ row }) => <ReviewText text={row.original.text} className="min-w-[14rem] max-w-md" />,
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column} title="Date" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <DeleteReviewButton
                    reviewId={row.original.id}
                    studentName={row.original.student.name}
                    courseTitle={row.original.course.title}
                />
            </div>
        ),
    },
];

const getSearchText = (row: ReviewRow) =>
    `${row.student.name} ${row.student.email} ${row.course.title} ${row.text ?? ""}`;

function MobileCard({ row }: { row: ReviewRow }) {
    return (
        <article className="space-y-3 rounded-xl border bg-card p-4" aria-label={`Review by ${row.student.name}`}>
            <div className="flex items-start justify-between gap-2">
                <StudentIdentity
                    name={row.student.name}
                    email={row.student.email}
                    image={row.student.image}
                    className="flex-1"
                />
                <div className="-mr-2 -mt-1 shrink-0">
                    <DeleteReviewButton reviewId={row.id} studentName={row.student.name} courseTitle={row.course.title} />
                </div>
            </div>
            <p className="break-words text-sm font-medium">{row.course.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <RatingStars rating={row.rating} />
                <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
            </div>
            <ReviewText text={row.text} />
        </article>
    );
}

export function ReviewsTable({ rows }: { rows: ReviewRow[] }) {
    const [courseFilter, setCourseFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");

    const courses = useMemo(() => {
        const byId = new Map<string, string>();
        for (const row of rows) byId.set(row.course.id, row.course.title);
        return [...byId].map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
    }, [rows]);

    const data = useMemo(
        () =>
            rows.filter(
                (r) =>
                    (courseFilter === "all" || r.course.id === courseFilter) &&
                    (ratingFilter === "all" || r.rating === Number(ratingFilter))
            ),
        [rows, courseFilter, ratingFilter]
    );

    const toolbar =
        rows.length > 0 ? (
            <>
                {courses.length > 1 && (
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="w-full sm:w-52" aria-label="Filter by course">
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
                )}
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-full sm:w-40" aria-label="Filter by rating">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ratings</SelectItem>
                        {[5, 4, 3, 2, 1].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                                {n} {n === 1 ? "star" : "stars"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </>
        ) : undefined;

    return (
        <DataTable
            columns={columns}
            data={data}
            getSearchText={getSearchText}
            searchPlaceholder="Search by student, course or comment"
            toolbar={toolbar}
            emptyState={
                rows.length === 0 ? (
                    <EmptyState
                        icon={MessageSquareText}
                        title="No reviews yet"
                        description="Reviews that students leave on your courses will appear here. Encourage learners to rate a course once they've made progress."
                        buttonText="View your courses"
                        href="/teacher/courses"
                    />
                ) : undefined
            }
            noResultsText="No reviews match your search or filters."
            renderMobileCard={(row) => <MobileCard row={row} />}
            getRowId={(row) => row.id}
            caption="Course reviews"
        />
    );
}
