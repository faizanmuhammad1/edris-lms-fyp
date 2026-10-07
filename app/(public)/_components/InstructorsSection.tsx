import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, Linkedin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

const instructorDefaults = [
    {
        id: 1,
        name: "Faizan Muhammad",
        role: "Lead Developer",
        image: "/instructors/faizan.webp",
        bio: "Software engineering expert passionate about building scalable, high-performance web applications and systems.",
        linkedin: "https://www.linkedin.com/in/faizanmuhammad2/",
    },
    {
        id: 2,
        name: "Jahanzaib Shaikh",
        role: "Full-Stack Engineer",
        image: "/instructors/jahanzaib.webp",
        bio: "Dedicated full-stack developer bridging the gap between elegant user interfaces and robust backend architectures.",
        linkedin: "https://www.linkedin.com/in/jahanzaib-shaikh-9a6199215/",
    },
    {
        id: 3,
        name: "Aleena Imran",
        role: "Lead UI/UX Designer",
        image: "/instructors/aleena.webp",
        bio: "Designer with a keen eye for detail, crafting intuitive and beautiful digital experiences.",
        linkedin: "https://www.linkedin.com/in/aleena-imran-9a4155282/",
    },
];

type InstructorStat = {
    name: string;
    totalStudents: number;
    totalCourses: number;
};

export function InstructorsSection({ instructorStats }: { instructorStats: InstructorStat[] }) {
    // Merge real stats (when the person teaches on the platform) into the display data.
    const instructors = instructorDefaults.map((def) => ({
        ...def,
        stat: instructorStats.find((s) => s.name === def.name),
    }));

    return (
        <section aria-labelledby="instructors-heading" className={`bg-background ${sectionClass}`}>
            <div className={containerClass}>
                <SectionHeading
                    id="instructors-heading"
                    eyebrow="The team"
                    title="Meet the people behind Edris"
                    description="Practitioners who build, design and teach — and who care about how you learn."
                    align="center"
                />

                <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {instructors.map((instructor) => (
                        <li key={instructor.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
                            <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                                <Image
                                    src={instructor.image}
                                    alt={`Portrait of ${instructor.name}`}
                                    fill
                                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                                    className="object-cover object-top"
                                />
                            </div>
                            <div className="flex flex-1 flex-col p-6">
                                <p className="text-sm font-medium text-primary">{instructor.role}</p>
                                <h3 className="mt-1 text-xl font-semibold text-foreground">{instructor.name}</h3>
                                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{instructor.bio}</p>
                                {instructor.stat && instructor.stat.totalCourses > 0 && (
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        {instructor.stat.totalCourses} course{instructor.stat.totalCourses === 1 ? "" : "s"}
                                        {instructor.stat.totalStudents > 0 &&
                                            ` · ${instructor.stat.totalStudents.toLocaleString()} student${instructor.stat.totalStudents === 1 ? "" : "s"}`}
                                    </p>
                                )}
                                <a
                                    href={instructor.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${instructor.name} on LinkedIn (opens in a new tab)`}
                                    className={buttonVariants({
                                        variant: "outline",
                                        className: "mt-5 h-10 w-fit",
                                    })}
                                >
                                    <Linkedin aria-hidden="true" />
                                    LinkedIn
                                </a>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Become an instructor */}
                <div className="mx-auto mt-16 flex max-w-5xl flex-col items-start gap-6 rounded-2xl border bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-start gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <GraduationCap className="size-6" aria-hidden="true" />
                        </span>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground sm:text-xl">Become an instructor</h3>
                            <p className="mt-1 text-base text-muted-foreground">
                                Share your expertise, build your audience and earn on Edris.
                            </p>
                        </div>
                    </div>
                    <Link href="/teach" className={buttonVariants({ size: "lg", className: "h-11 w-full sm:w-auto" })}>
                        Start teaching
                        <ArrowRight aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
