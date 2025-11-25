"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

const courses = [
    {
        id: 1,
        title: "Complete Python Bootcamp: Go from Zero to Hero in Python 3",
        instructor: "Jose Portilla",
        rating: 4.6,
        students: "1.2m",
        price: "$19.99",
        oldPrice: "$99.99",
        image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80",
        category: "Development",
        bestseller: true,
        duration: "22h 13m",
    },
    {
        id: 2,
        title: "The Web Developer Bootcamp 2024",
        instructor: "Colt Steele",
        rating: 4.7,
        students: "850k",
        price: "$24.99",
        oldPrice: "$129.99",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
        category: "Development",
        bestseller: true,
        duration: "63h 30m",
    },
    {
        id: 3,
        title: "Machine Learning A-Z™: AI, Python & R + ChatGPT Prize [2024]",
        instructor: "Kirill Eremenko",
        rating: 4.5,
        students: "900k",
        price: "$14.99",
        oldPrice: "$89.99",
        image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80",
        category: "Data Science",
        bestseller: false,
        duration: "44h 20m",
    },
    {
        id: 4,
        title: "Ultimate AWS Certified Solutions Architect Associate 2024",
        instructor: "Stephane Maarek",
        rating: 4.8,
        students: "500k",
        price: "$29.99",
        oldPrice: "$149.99",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
        category: "IT & Software",
        bestseller: true,
        duration: "27h 15m",
    },
];

export function FeaturedCourses() {
    return (
        <section className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="space-y-2">
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 mb-2">
                            Top Rated Content
                        </Badge>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                            Featured <span className="text-primary">Courses</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
                            Hand-picked courses to help you master new skills. Join thousands of students learning today.
                        </p>
                    </div>
                    <Button variant="outline" className="shrink-0 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors group">
                        View All Courses
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.map((course) => (
                        <Card key={course.id} className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 flex flex-col h-full">
                            <div className="relative aspect-video overflow-hidden">
                                <Image
                                    src={course.image}
                                    alt={course.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                {course.bestseller && (
                                    <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none shadow-lg font-semibold px-3 py-1">
                                        Bestseller
                                    </Badge>
                                )}
                                <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
                                    <Button className="w-full bg-primary/90 hover:bg-primary text-white shadow-lg backdrop-blur-md">
                                        Enroll Now
                                    </Button>
                                </div>
                            </div>

                            <CardContent className="p-6 flex-1 flex flex-col gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <Badge variant="secondary" className="text-xs font-normal bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 transition-colors">
                                            {course.category}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                                            <Clock className="w-3 h-3" />
                                            <span>{course.duration}</span>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-medium">{course.instructor}</p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                                            <span className="text-yellow-500">★</span>
                                            <span>{course.rating}</span>
                                            <span className="text-muted-foreground font-normal text-xs">({course.students})</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-xl text-primary">{course.price}</span>
                                        <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">{course.oldPrice}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div >
        </section >
    );
}
