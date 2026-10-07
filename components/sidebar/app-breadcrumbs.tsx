"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const AREA_LABELS: Record<string, string> = {
  admin: "Admin",
  teacher: "Teacher",
  dashboard: "My learning",
};

const SEGMENT_LABELS: Record<string, string> = {
  analytics: "Analytics",
  assignment: "Assignment",
  certificate: "Certificate",
  certificates: "Certificates",
  communities: "Communities",
  compose: "Compose",
  courses: "Courses",
  create: "Create",
  delete: "Delete",
  edit: "Edit",
  forum: "Forum",
  mail: "Mail",
  new: "New",
  quiz: "Quiz",
  "quiz-attempts": "Quiz attempts",
  quizzes: "Quizzes",
  reviews: "Reviews",
  settings: "Settings",
  "student-progress": "Student progress",
  students: "Students",
  support: "Support",
  teachers: "Teachers",
  users: "Users",
};

/** What an id segment refers to, based on the segment before it. */
const ID_LABELS: Record<string, string[]> = {
  courses: ["Course", "Chapter", "Lesson"],
  compose: ["Campaign"],
  support: ["Ticket"],
  forum: ["Post"],
  users: ["User"],
  students: ["Student"],
  quizzes: ["Quiz"],
  certificates: ["Certificate"],
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isId(segment: string) {
  return UUID_RE.test(segment) || (/^[a-z0-9]{20,}$/i.test(segment) && /\d/.test(segment));
}

function humanize(segment: string) {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // keep the raw segment
  }
  const words = decoded.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function buildCrumbs(segments: string[]) {
  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    if (index === 0) {
      return { href, label: segments.length === 1 ? "Dashboard" : AREA_LABELS[segment], linkable: true };
    }

    let label = SEGMENT_LABELS[segment];
    if (!label && isId(segment)) {
      // Walk back over consecutive ids to find the collection they belong to.
      let offset = 0;
      let parent = index - 1;
      while (parent > 0 && isId(segments[parent])) {
        offset++;
        parent--;
      }
      label = ID_LABELS[segments[parent]]?.[offset] ?? "Details";
    }

    return {
      href,
      label: label ?? humanize(segment),
      // Area roots and their top-level sections are real index pages; deeper
      // intermediate paths (e.g. /admin/courses/{id}) may not be, so they stay text.
      linkable: index === 1,
    };
  });
}

/** Page trail for the dashboard shells (admin / teacher / student). */
export function AppBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  if (!segments[0] || !AREA_LABELS[segments[0]]) return null;

  const crumbs = buildCrumbs(segments);
  // Deep trails (e.g. Teacher › Courses › Course › Chapter › Lesson › Quiz) collapse their
  // middle crumbs into an ellipsis until there is room to show them all.
  const collapsible = crumbs.length > 4;
  const isMiddle = (index: number) => collapsible && index >= 2 && index < crumbs.length - 2;

  return (
    <Breadcrumb className={cn("min-w-0 overflow-hidden", className)}>
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const middle = isMiddle(index);
          return (
            <Fragment key={crumb.href}>
              {collapsible && index === 2 && (
                <>
                  <BreadcrumbSeparator className="xl:hidden" />
                  <BreadcrumbItem className="shrink-0 xl:hidden">
                    <BreadcrumbEllipsis className="size-5" />
                  </BreadcrumbItem>
                </>
              )}
              {index > 0 && <BreadcrumbSeparator className={cn(middle && "hidden xl:list-item")} />}
              <BreadcrumbItem
                className={cn(isLast ? "min-w-0" : "shrink-0", middle && "hidden xl:inline-flex")}
              >
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
                ) : crumb.linkable ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
