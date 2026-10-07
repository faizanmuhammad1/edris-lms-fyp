import type { Metadata } from "next";
import { getTeacherReviews } from "@/app/actions/review";
import { PageHeader } from "@/components/general/PageHeader";
import { ReviewsTable, type ReviewRow } from "./_components/ReviewsTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reviews" };

export default async function TeacherReviewsPage() {
    const reviews = await getTeacherReviews();

    const rows: ReviewRow[] = reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt.toISOString(),
        student: {
            name: review.User.name || "Student",
            email: review.User.email,
            image: review.User.image,
        },
        course: { id: review.courseId, title: review.Course.title },
    }));

    const average =
        rows.length > 0 ? (rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(1) : null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Course reviews"
                description={
                    average
                        ? `${rows.length} ${rows.length === 1 ? "review" : "reviews"} across your courses, averaging ${average} out of 5 stars.`
                        : "See what students say about your courses."
                }
            />
            <ReviewsTable rows={rows} />
        </div>
    );
}
