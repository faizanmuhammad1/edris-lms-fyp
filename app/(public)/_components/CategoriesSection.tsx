"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
    {
        title: "Computer Science",
        icon: "/icon-cs.png",
        href: "/courses?category=cs",
        count: "1.2k Courses",
    },
    {
        title: "Business",
        icon: "/icon-business.png",
        href: "/courses?category=business",
        count: "800+ Courses",
    },
    {
        title: "Art & Design",
        icon: "/icon-design.png",
        href: "/courses?category=design",
        count: "500+ Courses",
    },
    {
        title: "Marketing",
        icon: "/icon-marketing.png",
        href: "/courses?category=marketing",
        count: "300+ Courses",
    },
];

export function CategoriesSection() {
    return (
        <section className="py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/3 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col items-center text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                        Explore Top <span className="text-primary">Categories</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
                        Find the right course for you. Browse our most popular categories and start learning today.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {categories.map((category) => (
                        <Link key={category.title} href={category.href} className="group block h-full">
                            <Card className="h-full overflow-hidden border border-border/50 bg-card/40 backdrop-blur-md hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group-hover:bg-card/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
                                    <div className="relative w-28 h-28 mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">

                                        <Image
                                            src={category.icon}
                                            alt={category.title}
                                            fill
                                            className="object-contain drop-shadow-2xl relative z-10"
                                        />
                                    </div>
                                    <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                                        {category.title}
                                    </h3>
                                    <p className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {category.count}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
