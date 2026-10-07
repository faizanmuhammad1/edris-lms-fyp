import { prisma } from "@/lib/db";
import { requireTeacher } from "./require-teacher";

export async function getTeacherTransactions() {
    const session = await requireTeacher();
    const teacherId = session.user.id;

    const transactions = await prisma.enrollment.findMany({
        where: {
            Course: { userId: teacherId },
            status: "Active",
        },
        orderBy: { createdAt: "desc" },
        include: {
            User: {
                select: {
                    name: true,
                    email: true,
                    image: true,
                },
            },
            Course: {
                select: {
                    title: true,
                },
            },
        },
    });

    return transactions.map((t) => ({
        id: t.id,
        studentName: t.User.name || "Unknown",
        studentEmail: t.User.email,
        studentImage: t.User.image,
        courseTitle: t.Course.title,
        amount: t.amount / 100, // Convert cents to dollars
        date: t.createdAt,
    }));
}
