"use client";

import { TeacherCourseType } from "@/app/data/teacher/get-teacher-courses";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { ArrowRight, Clock, ExternalLink, GraduationCap, ListTree, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteTeacherCourse } from "../[courseId]/delete/actions";
import { CourseStatusBadge } from "../../_components/CourseStatusBadge";
import { formatCoursePrice } from "../../_components/format";
import { DELETE_COURSE_CONSEQUENCES } from "./delete-course-copy";

interface TeacherCourseCardProps {
  data: TeacherCourseType;
  /** Heading level for the course title (h3 when the card sits under a section h2). */
  headingLevel?: "h2" | "h3";
}

export function TeacherCourseCard({ data, headingLevel: Heading = "h2" }: TeacherCourseCardProps) {
  const thumbnailUrl = useConstructUrl(data.fileKey);
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const editHref = `/teacher/courses/${data.id}/edit`;

  async function handleDelete() {
    const { data: result, error } = await tryCatch(deleteTeacherCourse(data.id));
    if (error || result.status !== "success") {
      toast.error(result?.message ?? "We couldn't delete this course. Please try again.");
      return false;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <Card className="relative h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div className="relative aspect-video bg-muted">
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          sizes="(min-width: 1600px) 25vw, (min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <CourseStatusBadge status={data.status} className="absolute left-3 top-3 shadow-sm" />
      </div>

      <div className="absolute right-3 top-3">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="size-9 bg-background/90 shadow-sm hover:scale-100 hover:bg-background"
              aria-label={`Actions for ${data.title}`}
            >
              <MoreVertical aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href={editHref}>
                <Pencil aria-hidden="true" />
                Edit details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${editHref}?tab=structure`}>
                <ListTree aria-hidden="true" />
                Chapters & lessons
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${data.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" />
                View course page
                <span className="sr-only">(opens in a new tab)</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
              <Trash2 aria-hidden="true" />
              Delete course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <Heading className="text-lg font-semibold leading-snug">
          <Link
            href={editHref}
            className="line-clamp-2 break-words rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {data.title}
          </Link>
        </Heading>

        {data.smallDescription && (
          <p className="line-clamp-2 break-words text-sm text-muted-foreground">{data.smallDescription}</p>
        )}

        <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Duration</dt>
            <Clock className="size-4" aria-hidden="true" />
            <dd>{data.duration} {data.duration === 1 ? "hour" : "hours"}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Level</dt>
            <GraduationCap className="size-4" aria-hidden="true" />
            <dd>{data.level}</dd>
          </div>
          <div className="ml-auto">
            <dt className="sr-only">Price</dt>
            <dd className="font-semibold text-foreground">{formatCoursePrice(data.price)}</dd>
          </div>
        </dl>

        <Link href={editHref} className={buttonVariants({ className: "h-10 w-full hover:scale-100" })}>
          Edit course
          <ArrowRight aria-hidden="true" />
        </Link>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${data.title}"?`}
        description={DELETE_COURSE_CONSEQUENCES}
        confirmLabel="Delete course"
        destructive
        onConfirm={handleDelete}
      />
    </Card>
  );
}

export function TeacherCourseCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-3 border-t pt-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-12" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
