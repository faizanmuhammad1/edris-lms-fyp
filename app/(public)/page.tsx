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
import { getLandingStats } from "@/app/data/landing/get-landing-stats";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, teacherStatus: true },
    });

    if (user?.role === "admin") {
      redirect("/admin");
    }

    if (user?.role === "teacher" || user?.teacherStatus === "Approved") {
      redirect("/teacher");
    }

    // Default logged-in experience: take learners straight to their dashboard
    redirect("/dashboard");
  }

  const [courses, stats] = await Promise.all([
    getAllCourses(),
    getLandingStats(),
  ]);

  return (
    <>
      <HeroSection stats={stats} />
      <PlatformMockupSection />
      <WhyEdrisSection />
      <CategoriesSection categoryCounts={stats.categoryCounts} />
      <FeaturedCourses courses={courses} courseStats={stats.courseStats} />
      <HowItWorksSection />
      <InteractiveFeaturesSection />
      <InstructorsSection instructorStats={stats.instructorStats} />
      <TestimonialsSection />
      <FAQSection />
      <CTASection totalStudents={stats.totalStudents} />
    </>
  );
}
