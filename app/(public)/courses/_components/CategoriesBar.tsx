import Link from "next/link";
import {
    BarChart3,
    Briefcase,
    Code,
    Globe,
    Heart,
    Megaphone,
    Monitor,
    Music,
    Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
    { title: "All courses", icon: Globe, value: null },
    { title: "Development", icon: Code, value: "Development" },
    { title: "Business", icon: Briefcase, value: "Business" },
    { title: "Finance", icon: BarChart3, value: "Finance" },
    { title: "IT & Software", icon: Monitor, value: "IT & Software" },
    { title: "Design", icon: Palette, value: "Design" },
    { title: "Marketing", icon: Megaphone, value: "Marketing" },
    { title: "Health & Fitness", icon: Heart, value: "Health & Fitness" },
    { title: "Music", icon: Music, value: "Music" },
];

interface CategoriesBarProps {
    activeCategory: string | null;
}

/** Switching category starts a fresh browse (clears any search), as before. */
const buildHref = (category: string | null) =>
    category ? `/courses?category=${encodeURIComponent(category)}` : "/courses";

/** Category filter chips. Scrolls horizontally on small screens with faded edges as an affordance. */
export function CategoriesBar({ activeCategory }: CategoriesBarProps) {
    return (
        <nav
            aria-label="Course categories"
            className="sticky top-16 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
        >
            <div className="relative mx-auto w-full max-w-7xl">
                <ul
                    className="flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:scroll-px-6 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden"
                    style={{
                        maskImage:
                            "linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 40px), transparent)",
                        WebkitMaskImage:
                            "linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 40px), transparent)",
                    }}
                >
                    {categories.map((category) => {
                        const isActive = activeCategory === category.value;
                        return (
                            <li key={category.title} className="shrink-0 snap-start">
                                <Link
                                    href={buildHref(category.value)}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                                        isActive
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                    )}
                                >
                                    <category.icon className="size-4" aria-hidden="true" />
                                    {category.title}
                                </Link>
                            </li>
                        );
                    })}
                    {/* Spacer so the last chip can scroll clear of the fade */}
                    <li aria-hidden="true" className="w-6 shrink-0 lg:hidden" />
                </ul>
            </div>
        </nav>
    );
}
