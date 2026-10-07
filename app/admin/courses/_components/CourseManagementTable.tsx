"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  IconArchive,
  IconExternalLink,
  IconPencil,
  IconTrash,
  IconWorld,
  IconWorldOff,
} from "@tabler/icons-react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { DataTable, SortableHeader } from "@/components/general/DataTable";
import { EmptyState } from "@/components/general/EmptyState";
import type { ApiResponse } from "@/lib/types";
import { RowActionsMenu } from "../../_components/RowActionsMenu";
import { CourseStatusBadge } from "../../_components/StatusBadge";
import { formatNumber, formatPrice, pluralize } from "../../_lib/format";
import { archiveCourse, deleteCourse, publishCourse, unpublishCourse } from "../actions";
import type { CourseForManagement } from "./CourseManagementView";

type StatusFilter = "all" | "Draft" | "Published" | "Archived";
type PendingAction = { type: "publish" | "unpublish" | "archive" | "delete"; course: CourseForManagement };

function CourseTitleCell({ course }: { course: CourseForManagement }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/admin/courses/${course.id}/edit`}
        className="line-clamp-2 font-medium break-words hover:text-primary hover:underline"
      >
        {course.title}
      </Link>
      <p className="text-sm text-muted-foreground">{pluralize(course._count.chapter, "chapter")}</p>
    </div>
  );
}

function TeacherCell({ course }: { course: CourseForManagement }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm">{course.user.name || "Unknown teacher"}</p>
      <p className="truncate text-xs text-muted-foreground">{course.user.email}</p>
    </div>
  );
}

function CourseRowActions({
  course,
  onRequest,
}: {
  course: CourseForManagement;
  onRequest: (action: PendingAction) => void;
}) {
  return (
    <RowActionsMenu label={`Actions for ${course.title}`} heading={course.title}>
      <DropdownMenuItem asChild>
        <Link href={`/admin/courses/${course.id}/edit`}>
          <IconPencil aria-hidden="true" />
          Edit course
        </Link>
      </DropdownMenuItem>
      {course.status === "Published" && (
        <DropdownMenuItem asChild>
          <Link href={`/courses/${course.slug}`} target="_blank" rel="noopener noreferrer">
            <IconExternalLink aria-hidden="true" />
            View public page
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {course.status !== "Published" ? (
        <DropdownMenuItem onSelect={() => onRequest({ type: "publish", course })}>
          <IconWorld aria-hidden="true" />
          Publish
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onSelect={() => onRequest({ type: "unpublish", course })}>
          <IconWorldOff aria-hidden="true" />
          Unpublish (back to draft)
        </DropdownMenuItem>
      )}
      {course.status !== "Archived" && (
        <DropdownMenuItem onSelect={() => onRequest({ type: "archive", course })}>
          <IconArchive aria-hidden="true" />
          Archive
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onSelect={() => onRequest({ type: "delete", course })}>
        <IconTrash aria-hidden="true" />
        Delete course
      </DropdownMenuItem>
    </RowActionsMenu>
  );
}

const DIALOG_COPY: Record<
  PendingAction["type"],
  { title: (title: string) => string; confirm: string; success: (title: string) => string; destructive?: boolean }
> = {
  publish: {
    title: (t) => `Publish "${t}"?`,
    confirm: "Publish course",
    success: (t) => `"${t}" is now published`,
  },
  unpublish: {
    title: (t) => `Unpublish "${t}"?`,
    confirm: "Unpublish",
    success: (t) => `"${t}" is back in draft`,
  },
  archive: {
    title: (t) => `Archive "${t}"?`,
    confirm: "Archive course",
    success: (t) => `"${t}" has been archived`,
  },
  delete: {
    title: (t) => `Delete "${t}"?`,
    confirm: "Delete course",
    success: (t) => `"${t}" has been deleted`,
    destructive: true,
  },
};

function dialogDescription(action: PendingAction | null) {
  if (!action) return "";
  const { course } = action;
  const enrolled = pluralize(course._count.enrollment, "enrolled student");
  switch (action.type) {
    case "publish":
      return "It will appear in the public course catalog and students can enroll.";
    case "unpublish":
      return `It will be hidden from the catalog and closed to new enrollments. It currently has ${enrolled}; they are not unenrolled.`;
    case "archive":
      return `It will be hidden from the catalog and closed to new enrollments. It currently has ${enrolled}; they are not unenrolled. You can publish it again later.`;
    case "delete":
      return (
        <div className="space-y-2">
          <p>
            This permanently deletes the course with its {pluralize(course._count.chapter, "chapter")}, every lesson,
            uploaded videos and files.
          </p>
          {course._count.enrollment > 0 && (
            <p className="font-medium text-destructive">
              {enrolled} will lose access, and their enrollments and progress will be deleted.
            </p>
          )}
          <p>This can&apos;t be undone. To hide the course but keep its data, archive it instead.</p>
        </div>
      );
  }
}

export function CourseManagementTable({ courses }: { courses: CourseForManagement[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // `pending` keeps dialog content while it animates closed; `open` drives visibility.
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [open, setOpen] = useState(false);

  const request = (action: PendingAction) => {
    setPending(action);
    setOpen(true);
  };

  const filtered = useMemo(
    () => (statusFilter === "all" ? courses : courses.filter((course) => course.status === statusFilter)),
    [courses, statusFilter]
  );

  async function handleConfirm() {
    if (!pending) return;
    const { type, course } = pending;
    const action: Record<PendingAction["type"], (id: string) => Promise<ApiResponse>> = {
      publish: publishCourse,
      unpublish: unpublishCourse,
      archive: archiveCourse,
      delete: deleteCourse,
    };
    try {
      const result = await action[type](course.id);
      if (result.status === "error") {
        toast.error(result.message);
        return false;
      }
      toast.success(DIALOG_COPY[type].success(course.title));
      router.refresh();
      return true;
    } catch {
      toast.error("Something went wrong. Check your connection and try again.");
      return false;
    }
  }

  const columns = useMemo<ColumnDef<CourseForManagement>[]>(
    () => [
      {
        id: "title",
        accessorFn: (course) => course.title.toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Course" />,
        cell: ({ row }) => (
          <div className="max-w-[300px]">
            <CourseTitleCell course={row.original} />
          </div>
        ),
      },
      {
        id: "teacher",
        accessorFn: (course) => (course.user.name || "").toLowerCase(),
        header: ({ column }) => <SortableHeader column={column} title="Teacher" />,
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <TeacherCell course={row.original} />
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <CourseStatusBadge status={row.original.status} />,
      },
      {
        id: "price",
        accessorFn: (course) => course.price,
        header: ({ column }) => <SortableHeader column={column} title="Price" />,
        cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatPrice(row.original.price)}</span>,
      },
      {
        id: "enrollments",
        accessorFn: (course) => course._count.enrollment,
        header: ({ column }) => <SortableHeader column={column} title="Enrollments" />,
        cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: "created",
        accessorFn: (course) => new Date(course.createdAt).getTime(),
        header: ({ column }) => <SortableHeader column={column} title="Created" />,
        cell: ({ row }) => (
          <time dateTime={new Date(row.original.createdAt).toISOString()} className="whitespace-nowrap">
            {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          </time>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <CourseRowActions course={row.original} onRequest={request} />
          </div>
        ),
      },
    ],
    []
  );

  const renderMobileCard = (course: CourseForManagement) => (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <CourseTitleCell course={course} />
        </div>
        <CourseRowActions course={course} onRequest={request} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CourseStatusBadge status={course.status} />
        <span className="text-sm font-medium tabular-nums">{formatPrice(course.price)}</span>
      </div>
      <div className="mt-3 border-t pt-3">
        <TeacherCell course={course} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Enrollments</dt>
          <dd className="font-medium tabular-nums">{formatNumber(course._count.enrollment)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="font-medium">{format(new Date(course.createdAt), "MMM d, yyyy")}</dd>
        </div>
      </dl>
    </div>
  );

  const copy = pending ? DIALOG_COPY[pending.type] : null;

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(course) => course.id}
        getSearchText={(course) => `${course.title} ${course.user.name ?? ""} ${course.user.email}`}
        searchPlaceholder="Search courses or teachers"
        caption="Courses"
        noResultsText={statusFilter === "all" ? "No courses match your search." : "No courses match this filter."}
        renderMobileCard={renderMobileCard}
        toolbar={
          <>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full min-[400px]:w-[160px]" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {statusFilter !== "all" && (
              <Button variant="ghost" className="h-9" onClick={() => setStatusFilter("all")}>
                Clear filter
              </Button>
            )}
          </>
        }
        emptyState={
          courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Courses created by teachers will appear here for you to review, publish or archive."
            />
          ) : undefined
        }
      />

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={pending && copy ? copy.title(pending.course.title) : "Confirm"}
        description={dialogDescription(pending)}
        confirmLabel={copy?.confirm ?? "Confirm"}
        destructive={copy?.destructive}
        onConfirm={handleConfirm}
      />
    </>
  );
}
