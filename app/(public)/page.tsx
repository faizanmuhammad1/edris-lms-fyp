import { HeroSection } from "./_components/HeroSection";
import { PlatformMockupSection } from "./_components/PlatformMockupSection";
import { WhyEdrisSection } from "./_components/WhyEdrisSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { FeaturedCourses } from "./_components/FeaturedCourses";
import { HowItWorksSection } from "./_components/HowItWorksSection";
import { InteractiveFeaturesSection } from "./_components/InteractiveFeaturesSection";
import { InstructorsSection } from "./_components/InstructorsSection";
import { TestimonialsSection } from "./_components/TestimonialsSection";
import { FAQSection } from "./_components/FAQSection";
import { CTASection } from "./_components/CTASection";
import { getAllCourses } from "@/app/data/course/get-all-courses";

export default async function Home() {
    const courses = await getAllCourses();

    return (
        <>
            <HeroSection />
            <PlatformMockupSection />
            <WhyEdrisSection />
            <CategoriesSection />
            <FeaturedCourses courses={courses} />
            <HowItWorksSection />
            <InteractiveFeaturesSection />
            <InstructorsSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
        </>
    );
}
