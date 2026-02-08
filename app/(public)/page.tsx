import { HeroSection } from "./_components/HeroSection";
import { WhyEdrisSection } from "./_components/WhyEdrisSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { FeaturedCourses } from "./_components/FeaturedCourses";
import { HowItWorksSection } from "./_components/HowItWorksSection";
import { TestimonialsSection } from "./_components/TestimonialsSection";
import { CTASection } from "./_components/CTASection";
import { getAllCourses } from "@/app/data/course/get-all-courses";

export default async function Home() {
    const courses = await getAllCourses();

    return (
        <>
            <HeroSection />
            <WhyEdrisSection />
            <CategoriesSection />
            <FeaturedCourses courses={courses} />
            <HowItWorksSection />
            <TestimonialsSection />
            <CTASection />
        </>
    );
}
