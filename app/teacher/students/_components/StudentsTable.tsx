"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Ban, CircleCheck, Users } from "lucide-react";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatMoney } from "@/app/teacher/_components/format";
import { EnrollmentActions } from "./EnrollmentActions";
import { StudentIdentity } from "./StudentIdentity";
import type { EnrollmentRowStatus, StudentEnrollmentRow } from "./types";

function formatAmount(cents: number) {
    return cents > 0 ? formatMoney(cents / 100) : "Free";
}

function EnrollmentStatusBadge({ status }: { status: EnrollmentRowStatus }) {
    if (status === "Active") {
        return (
            <Badge variant="secondary">
                <CircleCheck aria-hidden="true" />
                Active
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="border-destructive/40 text-destructive">
            <Ban aria-hidden="true" />
            Banned
        </Badge>
    );
}

function RowActions({ row }: { row: StudentEnrollmentRow }) {
    return (
        <EnrollmentActions
            enrollmentId={row.id}
            status={row.status}
            studentName={row.student.name}
            studentEmail={row.student.email}
            courseTitle={row.course.title}
        />
    );
}

const columns: ColumnDef<StudentEnrollmentRow>[] = [
    {
        id: "student",
        accessorFn: (row) => row.student.name.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Student" />,
        cell: ({ row }) => (
            <StudentIdentity
                name={row.original.student.name}
                email={row.original.student.email}
                image={row.original.student.image}
                className="max-w-[16rem]"
            />
        ),
    },
    {
        id: "course",
        accessorFn: (row) => row.course.title.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Course" />,
        cell: ({ row }) => (
            <p className="line-clamp-2 min-w-[10rem] max-w-[16rem] whitespace-normal break-words font-medium">
                {row.original.course.title}
            </p>
        ),
    },
    {
        accessorKey: "enrolledAt",
        header: ({ column }) => <SortableHeader column={column} title="Enrolled" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.enrolledAt)}</span>,
    },
    {
        accessorKey: "amount",
        header: ({ column }) => <SortableHeader column={column} title="Paid" />,
        cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.amount)}</span>,
    },
    {
        accessorKey: "status",
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => <EnrollmentStatusBadge status={row.original.status} />,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <RowActions row={row.original} />
            </div>
        ),
    },
];

const getSearchText = (row: StudentEnrollmentRow) => `${row.student.name} ${row.student.email} ${row.course.title}`;

function MobileCard({ row }: { row: StudentEnrollmentRow }) {
    return (
        <article className="rounded-xl border bg-card p-4" aria-label={`${row.student.name}, ${row.course.title}`}>
            <div className="flex items-start justify-between gap-2">
                <StudentIdentity
                    name={row.student.name}
                    email={row.student.email}
                    image={row.student.image}
                    className="flex-1"
                />
                <div className="-mr-2 -mt-1 shrink-0">
                    <RowActions row={row} />
                </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="col-span-2 min-w-0">
                    <dt className="text-xs text-muted-foreground">Course</dt>
                    <dd className="break-words font-medium">{row.course.title}</dd>
                </div>
                <div>
                    <dt className="text-xs text-muted-foreground">Enrolled</dt>
                    <dd>{formatDate(row.enrolledAt)}</dd>
                </div>
                <div>
                    <dt className="text-xs text-muted-foreground">Paid</dt>
                    <dd className="tabular-nums">{formatAmount(row.amount)}</dd>
                </div>
                <div className="col-span-2">
                    <dt className="sr-only">Status</dt>
                    <dd>
                        <EnrollmentStatusBadge status={row.status} />
                    </dd>
                </div>
            </dl>
        </article>
    );
}

export function StudentsTable({ rows }: { rows: StudentEnrollmentRow[] }) {
    const [courseFilter, setCourseFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<"all" | EnrollmentRowStatus>("all");

    const courses = useMemo(() => {
        const byId = new Map<string, string>();
        for (const row of rows) byId.set(row.course.id, row.course.title);
        return [...byId].map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
    }, [rows]);

    const counts = useMemo(
        () => ({
            Active: rows.filter((r) => r.status === "Active").length,
            Banned: rows.filter((r) => r.status === "Banned").length,
        }),
        [rows]
    );

    const data = useMemo(
        () =>
            rows.filter(
                (r) =>
                    (courseFilter === "all" || r.course.id === courseFilter) &&
                    (statusFilter === "all" || r.status === statusFilter)
            ),
        [rows, courseFilter, statusFilter]
    );

    const toolbar =
        rows.length > 0 ? (
            <>
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
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | EnrollmentRowStatus)}>
                    <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="Active">Active ({counts.Active})</SelectItem>
                        <SelectItem value="Banned">Banned ({counts.Banned})</SelectItem>
                    </SelectContent>
                </Select>
            </>
        ) : undefined;

    return (
        <DataTable
            columns={columns}
            data={data}
            getSearchText={getSearchText}
            searchPlaceholder="Search by name, email or course"
            toolbar={toolbar}
            emptyState={
                rows.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No students yet"
                        description="When students enroll in your published courses, they'll appear here so you can manage their access."
                        buttonText="Go to your courses"
                        href="/teacher/courses"
                    />
                ) : undefined
            }
            noResultsText="No enrollments match your search or filters."
            renderMobileCard={(row) => <MobileCard row={row} />}
            getRowId={(row) => row.id}
            caption="Course enrollments"
        />
    );
}
