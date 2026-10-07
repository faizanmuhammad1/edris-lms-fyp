import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

/** Latest genuine learner reviews (4★+, with written feedback); cached across requests for 5 min. */
const queryFeaturedReviews = unstable_cache(
    () =>
        prisma.review.findMany({
            where: {
                rating: { gte: 4 },
                text: { not: null },
                Course: { status: "Published" },
            },
            orderBy: { createdAt: "desc" },
            take: 12,
            select: {
                id: true,
                rating: true,
                text: true,
                User: { select: { name: true, image: true } },
                Course: { select: { title: true, slug: true } },
            },
        }),
    ["featured-reviews"],
    { revalidate: 300 }
);

async function getFeaturedReviews() {
    try {
        const reviews = await queryFeaturedReviews();
        return reviews.filter((review) => (review.text?.trim().length ?? 0) >= 20).slice(0, 6);
    } catch (error) {
        console.error("[TestimonialsSection] failed to load reviews", error);
        return [];
    }
}

function initials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

/** Shows real learner reviews only; renders nothing until there are some to show. */
export async function TestimonialsSection() {
    const reviews = await getFeaturedReviews();
    if (reviews.length === 0) return null;

    return (
        <section aria-labelledby="testimonials-heading" className={`border-y bg-muted/30 ${sectionClass}`}>
            <div className={containerClass}>
                <SectionHeading
                    id="testimonials-heading"
                    eyebrow="Learner reviews"
                    title="What our learners say"
                    description="Recent reviews left by students on Edris courses."
                    align="center"
                />

                <ul className="mt-12 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review) => (
                        <li key={review.id}>
                            <figure className="flex h-full flex-col rounded-2xl border bg-card p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-0.5" aria-hidden="true">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`size-4 ${star <= review.rating ? "fill-amber-500 text-amber-500" : "fill-muted text-muted-foreground/30"}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="sr-only">Rated {review.rating} out of 5</span>
                                    <Quote className="size-5 text-primary/30" aria-hidden="true" />
                                </div>
                                <blockquote className="mt-4 flex-1 break-words text-base leading-relaxed text-foreground">
                                    <p className="line-clamp-6">&ldquo;{review.text?.trim()}&rdquo;</p>
                                </blockquote>
                                <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
                                    <Avatar className="size-10">
                                        <AvatarImage src={review.User.image ?? undefined} alt="" />
                                        <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                                            {initials(review.User.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground">{review.User.name}</p>
                                        <Link
                                            href={`/courses/${review.Course.slug}`}
                                            className="block truncate text-sm text-muted-foreground hover:text-primary hover:underline"
                                        >
                                            {review.Course.title}
                                        </Link>
                                    </div>
                                </figcaption>
                            </figure>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
