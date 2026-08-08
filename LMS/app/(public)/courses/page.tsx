import { getAllCourses } from "@/app/data/course/get-all-courses";
import {
  PublicCourseCard,
  PublicCourseCardSkeleton,
} from "../_components/PublicCourseCard";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function PublicCoursesRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16 relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col space-y-4 mb-12">
          {category && (
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 w-fit">
              {category}
            </Badge>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {category ? (
              <>
                <span className="text-primary">{category}</span> Courses
              </>
            ) : (
              <>
                Explore <span className="text-primary">All Courses</span>
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            {category
              ? `Discover our comprehensive ${category.toLowerCase()} courses designed to help you master new skills.`
              : "Discover our wide range of courses designed to help you achieve your learning goals."}
          </p>
        </div>

        <Suspense fallback={<LoadingSkeletonLayout />}>
          <RenderCourses category={category} />
        </Suspense>
      </div>
    </div>
  );
}

async function RenderCourses({ category }: { category?: string }) {
  const courses = await getAllCourses(category);

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-muted/50 rounded-full p-6 mb-6">
          <svg
            className="w-16 h-16 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">No Courses Found</h2>
        <p className="text-muted-foreground max-w-md">
          {category
            ? `We don't have any ${category} courses available at the moment. Check back soon!`
            : "No courses are currently available. Check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map((course) => (
        <PublicCourseCard key={course.id} data={course} />
      ))}
    </div>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <PublicCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
