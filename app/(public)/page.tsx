import { HeroSection } from "./_components/HeroSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { FeaturedCourses } from "./_components/FeaturedCourses";
import { TestimonialsSection } from "./_components/TestimonialsSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <CategoriesSection />
      <FeaturedCourses />
      <TestimonialsSection />
    </main>
  );
}

