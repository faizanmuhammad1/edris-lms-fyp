"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-muted/30 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Edris LMS Blog</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Latest news, insights, and educational trends from the Edris team.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Featured Post */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1 h-8 bg-primary rounded-full" />
                        Featured Story
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8 items-center bg-card rounded-3xl p-2 md:p-6 border border-border/50 shadow-sm hover:shadow-md transition-all">
                        <div className="relative aspect-video rounded-2xl overflow-hidden">
                            {/* Placeholder for featured image - consider generating one later if needed, but standard placeholder is fine for now */}
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary">
                                Featured Image
                            </div>
                        </div>
                        <div className="space-y-4 p-4">
                            <Badge variant="secondary" className="text-primary hover:text-primary">E-Learning</Badge>
                            <h3 className="text-3xl font-bold leading-tight hover:text-primary transition-colors cursor-pointer">
                                The Future of AI in Education: Personalized Learning at Scale
                            </h3>
                            <p className="text-muted-foreground line-clamp-3">
                                Discover how artificial intelligence is reshaping the educational landscape, making personalized learning paths accessible to students worldwide.
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
                                <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    <span>Edris Team</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Oct 24, 2025</span>
                                </div>
                            </div>
                            <Button variant="link" className="p-0 h-auto font-semibold text-primary">
                                Read Article <ArrowRight className="ml-1 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Post Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((post) => (
                        <Link href="#" key={post} className="group">
                            <Card className="h-full border-none shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden bg-card/50 hover:bg-card">
                                <div className="aspect-[1.6] bg-muted relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="flex items-center justify-center h-full text-muted-foreground/30 font-medium">
                                        Blog Post Image {post}
                                    </div>
                                </div>
                                <CardContent className="p-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs font-normal">Category</Badge>
                                        <span className="text-xs text-muted-foreground">5 min read</span>
                                    </div>
                                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-2">
                                        Transforming Education Through Blockchain Verification
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        Explore how blockchain technology ensures the integrity and portability of digital credentials.
                                    </p>
                                    <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="w-6 h-6 rounded-full bg-primary/20" />
                                        <span>Author Name</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Button variant="outline" size="lg" className="min-w-[200px]">
                        Load More Articles
                    </Button>
                </div>
            </div>
        </div>
    );
}
