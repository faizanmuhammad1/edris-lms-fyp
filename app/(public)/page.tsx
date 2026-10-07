import type { Metadata } from "next";
import { HeroSection } from "./_components/HeroSection";
import { PlatformMockupSection } from "./_components/PlatformMockupSection";
import { WhyEdrisSection } from "./_components/WhyEdrisSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { FeaturedCourses } from "./_components/FeaturedCourses";
import { HowItWorksSection } from "./_components/HowItWorksSection";
import { InteractiveFeaturesSection } from "./_components/InteractiveFeaturesSection";
import { InstructorsSection } from "./_components/InstructorsSection";
import { TestimonialsSection } from "./_components/TestimonialsSection";
import { FAQSection, faqs } from "./_components/FAQSection";
import { CTASection } from "./_components/CTASection";
import { getAllCourses } from "@/app/data/course/get-all-courses";
import { getLandingStats } from "@/app/data/landing/get-landing-stats";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { SITE_NAME, absoluteUrl, jsonLd, pageMetadata, siteUrl } from "./_lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Edris LMS — Online courses with AI tutoring and verified certificates",
  absoluteTitle: true,
  description:
    "Learn new skills with expert-led video courses, an AI tutor that knows your lesson, quizzes and assignments, and blockchain-verified certificates.",
  path: "/",
});

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    logo: absoluteUrl("/icon.png"),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: SITE_NAME,
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/courses?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  },
];

// Landing data changes rarely; cache it across requests (5 min) so traffic spikes and
// link prefetching don't fan out into ~9 database queries per view.
const getHomeData = unstable_cache(
  async () => Promise.all([getAllCourses(), getLandingStats()]),
  ["home-data"],
  { revalidate: 300 }
);

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

  const [courses, stats] = await getHomeData();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
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
