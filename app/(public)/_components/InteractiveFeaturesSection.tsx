import { BadgeCheck, BrainCircuit, PlaySquare, Sparkles } from "lucide-react";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

const features = [
    {
        icon: PlaySquare,
        title: "Immersive video learning",
        description:
            "Adaptive streaming that adjusts to your connection, with a player built for focused study.",
    },
    {
        icon: BrainCircuit,
        title: "AI-powered assistance",
        description:
            "The context-aware AI tutor knows which lesson you're watching, so its guidance is specific to what you're learning.",
    },
    {
        icon: Sparkles,
        title: "Interactive mastery",
        description:
            "Quizzes and assignments reinforce key concepts before you move on to the next chapter.",
    },
    {
        icon: BadgeCheck,
        title: "Verifiable certifications",
        description:
            "Earn blockchain-anchored certificates on completion and share them on LinkedIn or with employers.",
    },
];

export function InteractiveFeaturesSection() {
    return (
        <section aria-labelledby="features-heading" className={`border-y bg-muted/30 ${sectionClass}`}>
            <div className={`${containerClass} grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16`}>
                <SectionHeading
                    id="features-heading"
                    eyebrow="Features"
                    title="Built for excellence"
                    description="The tools behind every Edris course, designed to keep you learning and to make your progress count."
                    className="lg:sticky lg:top-24 lg:self-start"
                />

                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                    {features.map((feature) => (
                        <li key={feature.title} className="rounded-2xl border bg-card p-6 sm:p-8">
                            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <feature.icon className="size-6" aria-hidden="true" />
                            </span>
                            <h3 className="mt-6 text-lg font-semibold text-foreground sm:text-xl">{feature.title}</h3>
                            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{feature.description}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
