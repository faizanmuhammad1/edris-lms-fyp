"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Quote } from "lucide-react";

const testimonials = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Software Engineer",
        content: "The AI features in Edris are a game changer. Being able to ask questions about the video content in real-time helped me understand complex concepts much faster.",
        avatar: "https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=Sarah",
    },
    {
        id: 2,
        name: "Michael Chen",
        role: "Data Scientist",
        content: "I love the blockchain verification for certificates. It gives me something tangible to show employers that they can trust instantly.",
        avatar: "https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=Michael",
    },
    {
        id: 3,
        name: "Emily Davis",
        role: "Product Manager",
        content: "The course quality is exceptional, and the platform feels so modern and intuitive. Definitely the best learning experience I've had online.",
        avatar: "https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=Emily",
    },
];

export function TestimonialsSection() {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 mb-4">
                        Success Stories
                    </Badge>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                        What Our <span className="text-primary">Students</span> Say
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Join thousands of satisfied learners who have transformed their careers with Edris.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.id} className="group bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Quote className="h-16 w-16 text-primary rotate-12" />
                            </div>
                            <CardContent className="p-8 flex flex-col gap-6 h-full relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <Avatar className="h-12 w-12 border-2 border-primary/10 group-hover:border-primary/30 transition-colors relative z-10">
                                            <AvatarImage src={testimonial.avatar} />
                                            <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{testimonial.name}</h4>
                                        <p className="text-sm text-muted-foreground font-medium">{testimonial.role}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Quote className="h-6 w-6 text-primary/40 mb-2" />
                                    <p className="text-lg leading-relaxed italic text-muted-foreground group-hover:text-foreground transition-colors">
                                        &quot;{testimonial.content}&quot;
                                    </p>
                                </div>
                                <div className="mt-auto pt-4 flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary/60 transition-colors" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
