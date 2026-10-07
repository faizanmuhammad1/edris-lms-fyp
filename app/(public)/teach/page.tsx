import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { pageMetadata } from "../_lib/seo";
import { TeachContent, type TeachStats } from "./_components/TeachContent";

export const metadata: Metadata = pageMetadata({
    title: "Teach on Edris",
    description:
        "Share your expertise with learners on Edris LMS. Apply to teach, create courses with our course builder, and earn from your knowledge.",
    path: "/teach",
});

/** Real platform numbers for the stats strip (never hard-coded). */
async function getTeachStats(): Promise<TeachStats> {
    try {
        const [students, teachers, courses] = await Promise.all([
            prisma.enrollment.findMany({
                where: { status: "Active" },
                select: { userId: true },
                distinct: ["userId"],
            }),
            prisma.user.count({
                where: { OR: [{ role: "teacher" }, { teacherStatus: "Approved" }] },
            }),
            prisma.course.count({ where: { status: "Published" } }),
        ]);
        return { students: students.length, teachers, courses };
    } catch (error) {
        console.error("[teach] failed to load stats", error);
        return { students: 0, teachers: 0, courses: 0 };
    }
}

export default async function TeachPage() {
    const stats = await getTeachStats();
    return <TeachContent stats={stats} />;
}
