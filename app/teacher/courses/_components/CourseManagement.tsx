"use client";

import { useState } from "react";
import { TeacherCourseType } from "@/app/data/teacher/get-teacher-courses";
import {
  TeacherCourseCard,
} from "./TeacherCourseCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Search, Filter, Grid3x3, List, BookOpen, TrendingUp, Clock, DollarSign, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function SortableCourseItem({
  course,
  viewMode,
}: {
  course: TeacherCourseType;
  viewMode: "grid" | "list";
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (viewMode === "list") {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "group flex items-center gap-4 p-5 rounded-xl border border-border/50 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm hover:from-card hover:to-card/80 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-grab active:cursor-grabbing",
          isDragging && "shadow-2xl scale-105 z-50"
        )}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-primary/10 rounded-lg transition-colors group-hover:scale-110"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {course.smallDescription}
          </p>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <Badge
              variant={
                course.status === "Published" ? "default" : "secondary"
              }
              className="group-hover:scale-105 transition-transform"
            >
              {course.status === "Published" && <Sparkles className="w-3 h-3 mr-1" />}
              {course.status}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.duration}h
            </span>
            <span className="text-sm text-muted-foreground">{course.level}</span>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {course.price}
            </span>
          </div>
        </div>
        <Link href={`/teacher/courses/${course.id}/edit`}>
          <Button
            variant="outline"
            size="sm"
            className="group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          >
            Edit
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(isDragging && "opacity-50 scale-105 z-50")}
    >
      <TeacherCourseCard data={course} />
    </motion.div>
  );
}

interface CourseManagementProps {
  courses: TeacherCourseType[];
}

export function CourseManagement({ courses }: CourseManagementProps) {
  const [displayCourses, setDisplayCourses] = useState<TeacherCourseType[]>(courses);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredCourses = displayCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.smallDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setDisplayCourses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const stats = {
    total: filteredCourses.length,
    published: filteredCourses.filter((c) => c.status === "Published").length,
    draft: filteredCourses.filter((c) => c.status === "Draft").length,
    totalRevenue: filteredCourses.reduce((acc, c) => acc + c.price, 0),
  };

  const activeCourse = activeId ? filteredCourses.find((c) => c.id === activeId) : null;

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Courses</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-green-500/10 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Published</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                    {stats.published}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Drafts</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
                    {stats.draft}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 group-hover:scale-110 transition-all duration-300">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    ${stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Filters and Search */}
      <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filter & Search
          </CardTitle>
          <CardDescription>Find and organize your courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Input
                  placeholder="Search courses by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-background/50 border-border/50 hover:border-primary/50 transition-all">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[160px] bg-background/50 border-border/50 hover:border-primary/50 transition-all">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border border-border/50 rounded-lg overflow-hidden bg-background/50">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none border-r border-border/50 hover:bg-primary/10 transition-all"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none hover:bg-primary/10 transition-all"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses List/Grid with Drag Overlay */}
      {filteredCourses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || levelFilter !== "all"
                ? "Try adjusting your filters"
                : "Create a new course to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {viewMode === "list" ? (
            <SortableContext
              items={filteredCourses.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {filteredCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SortableCourseItem
                        course={course}
                        viewMode="list"
                      />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </SortableContext>
          ) : (
            <SortableContext
              items={filteredCourses.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7">
                  {filteredCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SortableCourseItem
                        course={course}
                        viewMode="grid"
                      />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </SortableContext>
          )}
          <DragOverlay>
            {activeCourse ? (
              <div className="opacity-90 rotate-3 scale-105">
                {viewMode === "list" ? (
                  <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-primary bg-card shadow-2xl w-96">
                    <GripVertical className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{activeCourse.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {activeCourse.smallDescription}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-80">
                    <TeacherCourseCard data={activeCourse} />
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
