import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, Home, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has moved.",
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return (
        <main className="flex min-h-svh items-center justify-center bg-background px-4 py-16">
            <div className="w-full max-w-lg text-center">
                <p className="font-mono text-sm font-medium text-primary">Error 404</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Page not found</h1>
                <p className="mt-4 text-base text-muted-foreground">
                    Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved, renamed or
                    removed.
                </p>

                <form role="search" action="/courses" method="get" className="mx-auto mt-8 flex max-w-md gap-2">
                    <label htmlFor="not-found-search" className="sr-only">
                        Search courses
                    </label>
                    <div className="relative min-w-0 flex-1">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Input
                            id="not-found-search"
                            name="search"
                            type="search"
                            maxLength={100}
                            placeholder="Search courses"
                            className="h-11 pl-9"
                        />
                    </div>
                    <Button type="submit" className="h-11 shrink-0">
                        Search
                    </Button>
                </form>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href="/" className={buttonVariants({ size: "lg", className: "h-11" })}>
                        <Home aria-hidden="true" />
                        Go to homepage
                    </Link>
                    <Link href="/courses" className={buttonVariants({ size: "lg", variant: "outline", className: "h-11" })}>
                        <BookOpen aria-hidden="true" />
                        Browse courses
                    </Link>
                </div>

                <p className="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Compass className="size-4" aria-hidden="true" />
                    Think this is a mistake?{" "}
                    <Link href="/contact" className="font-medium text-primary hover:underline">
                        Let us know
                    </Link>
                </p>
            </div>
        </main>
    );
}
