"use client";

import { TeacherCourseType } from "@/app/data/teacher/get-teacher-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { COURSE_GRID } from "../../_components/TeacherSkeletons";
import { TeacherCourseCard } from "./TeacherCourseCard";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Published", label: "Published" },
  { value: "Draft", label: "Draft" },
  { value: "Archived", label: "Archived" },
];

/** Course grid with search and a status filter (client-side; teachers rarely have hundreds of courses). */
export function TeacherCourseList({ courses }: { courses: TeacherCourseType[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesStatus = status === "all" || course.status === status;
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        (course.smallDescription ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [courses, query, status]);

  const isFiltered = query.trim() !== "" || status !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full space-y-1.5 sm:max-w-sm">
          <Label htmlFor="course-search">Search courses</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="course-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title or description"
              className="h-10 pl-9"
            />
          </div>
        </div>
        <div className="w-full space-y-1.5 sm:w-48">
          <Label htmlFor="course-status-filter">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="course-status-filter" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground sm:ml-auto sm:pb-2.5" aria-live="polite">
          {isFiltered ? `${filtered.length} of ${courses.length} courses` : `${courses.length} ${courses.length === 1 ? "course" : "courses"}`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No courses match your search or filter.</p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className={COURSE_GRID} aria-label="Your courses">
          {filtered.map((course) => (
            <li key={course.id} className="min-w-0">
              <TeacherCourseCard data={course} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
