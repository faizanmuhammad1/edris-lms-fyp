"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Settings2 } from "lucide-react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseStatusBadge } from "@/app/teacher/_components/CourseStatusBadge";
import { formatDate } from "@/app/teacher/_components/format";
import { cn } from "@/lib/utils";

export interface QuizRow {
    id: string;
    title: string;
    isPublished: boolean;
    passingScore: number;
    /** Minutes, or null when untimed. */
    timeLimit: number | null;
    attempts: number;
    /** ISO date string. */
    updatedAt: string;
    course: { id: string; title: string };
    lesson: { title: string };
    manageHref: string;
}

type StatusFilter = "all" | "published" | "draft";

function QuizStatus({ published }: { published: boolean }) {
    return <CourseStatusBadge status={published ? "Published" : "Draft"} />;
}

function ManageLink({ row, className }: { row: QuizRow; className?: string }) {
    return (
        <Link href={row.manageHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}>
            <Settings2 aria-hidden="true" />
            Manage
            <span className="sr-only"> {row.title}</span>
        </Link>
    );
}

function formatTimeLimit(minutes: number | null) {
    return minutes ? `${minutes} min` : "No limit";
}

const columns: ColumnDef<QuizRow>[] = [
    {
        id: "title",
        accessorFn: (row) => row.title.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Quiz" />,
        cell: ({ row }) => (
            <div className="min-w-[12rem] max-w-[22rem] whitespace-normal">
                <p className="break-words font-medium">{row.original.title}</p>
                <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                    {row.original.course.title} &middot; {row.original.lesson.title}
                </p>
            </div>
        ),
    },
    {
        id: "status",
        accessorFn: (row) => (row.isPublished ? 1 : 0),
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => <QuizStatus published={row.original.isPublished} />,
    },
    {
        accessorKey: "passingScore",
        header: ({ column }) => <SortableHeader column={column} title="Pass mark" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.passingScore}%</span>,
    },
    {
        id: "timeLimit",
        accessorFn: (row) => row.timeLimit ?? 0,
        header: "Time limit",
        cell: ({ row }) => <span className="text-muted-foreground">{formatTimeLimit(row.original.timeLimit)}</span>,
    },
    {
        accessorKey: "attempts",
        header: ({ column }) => <SortableHeader column={column} title="Attempts" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.attempts}</span>,
    },
    {
        accessorKey: "updatedAt",
        header: ({ column }) => <SortableHeader column={column} title="Updated" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <ManageLink row={row.original} />
            </div>
        ),
    },
];

const getSearchText = (row: QuizRow) => `${row.title} ${row.course.title} ${row.lesson.title}`;

function MobileCard({ row }: { row: QuizRow }) {
    return (
        <article className="space-y-3 rounded-xl border bg-card p-4" aria-label={row.title}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="break-words font-medium">{row.title}</p>
                    <p className="break-words text-xs text-muted-foreground">
                        {row.course.title} &middot; {row.lesson.title}
                    </p>
                </div>
                <QuizStatus published={row.isPublished} />
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                    <dt className="text-xs text-muted-foreground">Pass mark</dt>
                    <dd className="tabular-nums">{row.passingScore}%</dd>
                </div>
                <div>
                    <dt className="text-xs text-muted-foreground">Time limit</dt>
                    <dd>{formatTimeLimit(row.timeLimit)}</dd>
                </div>
                <div>
                    <dt className="text-xs text-muted-foreground">Attempts</dt>
                    <dd className="tabular-nums">{row.attempts}</dd>
                </div>
            </dl>
            <ManageLink row={row} className="h-10 w-full" />
        </article>
    );
}

export function QuizzesTable({ rows }: { rows: QuizRow[] }) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const data = useMemo(
        () =>
            rows.filter(
                (r) =>
                    statusFilter === "all" || (statusFilter === "published" ? r.isPublished : !r.isPublished)
            ),
        [rows, statusFilter]
    );

    const publishedCount = rows.filter((r) => r.isPublished).length;

    return (
        <DataTable
            columns={columns}
            data={data}
            getSearchText={getSearchText}
            searchPlaceholder="Search quizzes, courses or lessons"
            toolbar={
                rows.length > 0 ? (
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="published">Published ({publishedCount})</SelectItem>
                            <SelectItem value="draft">Draft ({rows.length - publishedCount})</SelectItem>
                        </SelectContent>
                    </Select>
                ) : undefined
            }
            emptyState={
                rows.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="No quizzes yet"
                        description="Quizzes belong to lessons. Open one of your courses, pick a lesson and add a quiz from the lesson editor."
                        buttonText="Go to courses"
                        href="/teacher/courses"
                    />
                ) : undefined
            }
            noResultsText="No quizzes match your search or filter."
            renderMobileCard={(row) => <MobileCard row={row} />}
            getRowId={(row) => row.id}
            caption="Quizzes"
        />
    );
}
