"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Code,
    Briefcase,
    BarChart3,
    Monitor,
    Palette,
    Megaphone,
    Heart,
    Music,
    Globe
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const categories = [
    {
        title: "All Courses",
        icon: Globe,
        href: "/courses",
        activeParam: null,
    },
    {
        title: "Development",
        icon: Code,
        href: "/courses?category=Development",
        activeParam: "Development",
    },
    {
        title: "Business",
        icon: Briefcase,
        href: "/courses?category=Business",
        activeParam: "Business",
    },
    {
        title: "Finance",
        icon: BarChart3,
        href: "/courses?category=Finance %26 Accounting",
        activeParam: "Finance & Accounting",
    },
    {
        title: "IT & Software",
        icon: Monitor,
        href: "/courses?category=IT %26 Software",
        activeParam: "IT & Software",
    },
    {
        title: "Design",
        icon: Palette,
        href: "/courses?category=Design",
        activeParam: "Design",
    },
    {
        title: "Marketing",
        icon: Megaphone,
        href: "/courses?category=Marketing",
        activeParam: "Marketing",
    },
    {
        title: "Health & Fitness",
        icon: Heart,
        href: "/courses?category=Health %26 Fitness",
        activeParam: "Health & Fitness",
    },
    {
        title: "Music",
        icon: Music,
        href: "/courses?category=Music",
        activeParam: "Music",
    },
];

export function CategoriesBar() {
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentCategory]);

    return (
        <div className="w-full relative py-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-16 z-40">
            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-2 pb-2">
                        {categories.map((category) => {
                            const isActive = currentCategory === category.activeParam || (currentCategory === null && category.activeParam === null);

                            return (
                                <Link
                                    key={category.title}
                                    href={category.href}
                                    onClick={() => window.scrollTo(0, 0)}
                                    className={cn(
                                        "flex flex-row items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
                                    )}
                                >
                                    <category.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "")} />
                                    <span>{category.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
            </div>
        </div>
    );
}
