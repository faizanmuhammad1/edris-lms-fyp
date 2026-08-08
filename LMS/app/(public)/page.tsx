import { HeroSection } from "./_components/HeroSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { FeaturedCourses } from "./_components/FeaturedCourses";
import { TestimonialsSection } from "./_components/TestimonialsSection";
import { getAllCourses } from "@/app/data/course/get-all-courses";

export default async function Home() {
  // Fetch real courses from database
  const courses = await getAllCourses();

  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <CategoriesSection />
      <FeaturedCourses courses={courses} />
      <TestimonialsSection />
    </main>
  );
}
