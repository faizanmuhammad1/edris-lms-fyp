import Link from "next/link";
import {
    ArrowRight,
    BarChart3,
    Briefcase,
    Code,
    Heart,
    Megaphone,
    Monitor,
    Music,
    Palette,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

const categories = [
    { title: "Development", icon: Code, iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { title: "Business", icon: Briefcase, iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { title: "Finance", icon: BarChart3, iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { title: "IT & Software", icon: Monitor, iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { title: "Design", icon: Palette, iconClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
    { title: "Marketing", icon: Megaphone, iconClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
    { title: "Health & Fitness", icon: Heart, iconClass: "bg-red-500/10 text-red-600 dark:text-red-400" },
    { title: "Music", icon: Music, iconClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
];

/** Display titles map to one or more stored category values. */
const categoryAliases: Record<string, string[]> = {
    Finance: ["Finance & Accounting", "Finance"],
};

function getCategoryCount(title: string, categoryCounts: Record<string, number>): number {
    const keys = categoryAliases[title] ?? [title];
    return keys.reduce((sum, key) => sum + (categoryCounts[key] ?? 0), 0);
}

export function CategoriesSection({ categoryCounts }: { categoryCounts: Record<string, number> }) {
    return (
        <section aria-labelledby="categories-heading" className={`bg-background ${sectionClass}`}>
            <div className={containerClass}>
                <SectionHeading
                    id="categories-heading"
                    eyebrow="Browse by topic"
                    title="Explore top categories"
                    description="Find the right course in any subject and learn from industry practitioners."
                    actions={
                        <Link href="/courses" className={buttonVariants({ variant: "outline", className: "h-10" })}>
                            View all courses
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    }
                />

                <ul className="mt-10 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    {categories.map((category) => {
                        const count = getCategoryCount(category.title, categoryCounts);
                        return (
                            <li key={category.title}>
                                <Link
                                    href={`/courses?category=${encodeURIComponent(category.title)}`}
                                    className="group flex h-full items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:p-5"
                                >
                                    <span
                                        className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${category.iconClass}`}
                                    >
                                        <category.icon className="size-5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-semibold text-foreground group-hover:text-primary">
                                            {category.title}
                                        </span>
                                        <span className="block text-sm text-muted-foreground">
                                            {count} course{count === 1 ? "" : "s"}
                                        </span>
                                    </span>
                                    <ArrowRight
                                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
