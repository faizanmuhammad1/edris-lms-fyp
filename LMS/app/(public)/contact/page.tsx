"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner"; // Assuming sonner is used, or I'll use a simple alert if not sure, but sonner is common with shadcn

export default function ContactPage() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        // Simulate sending
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        toast.success("Message sent successfully!");
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative h-[400px] w-full overflow-hidden">
                <Image
                    src="/contact-hero.png"
                    alt="Contact Us"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center space-y-4 px-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Get in Touch
                        </h1>
                        <p className="text-lg text-white/80 max-w-2xl mx-auto">
                            We&apos;d love to hear from you. Our team is always here to chat.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 -mt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-lg bg-card/95 backdrop-blur-sm">
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Visit Us</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            123 Education Lane,<br />
                                            Tech City, TC 90210
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Mail className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                                        <p className="text-muted-foreground">
                                            hello@edrislms.com<br />
                                            support@edrislms.com
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Phone className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                                        <p className="text-muted-foreground">
                                            +1 (555) 123-4567<br />
                                            Mon-Fri from 8am to 5pm
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Clock className="h-32 w-32" />
                            </div>
                            <CardContent className="p-8 relative z-10">
                                <h3 className="font-bold text-2xl mb-2">Business Hours</h3>
                                <div className="space-y-2 text-primary-foreground/90">
                                    <div className="flex justify-between">
                                        <span>Monday - Friday</span>
                                        <span>9:00 AM - 6:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Saturday</span>
                                        <span>10:00 AM - 4:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Sunday</span>
                                        <span>Closed</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <Card className="h-full border-none shadow-lg">
                            <CardContent className="p-8">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Send us a Message</h2>
                                    <p className="text-muted-foreground">
                                        Fill out the form below and we&apos;ll get back to you within 24 hours.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                                            <Input id="name" placeholder="John Doe" required className="bg-muted/30" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                                            <Input id="email" type="email" placeholder="john@example.com" required className="bg-muted/30" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                        <Input id="subject" placeholder="How can we help?" required className="bg-muted/30" />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-medium">Message</label>
                                        <Textarea
                                            id="message"
                                            placeholder="Tell us more about your inquiry..."
                                            className="min-h-[150px] bg-muted/30 resize-none"
                                            required
                                        />
                                    </div>

                                    <Button type="submit" size="lg" className="w-full md:w-auto" disabled={loading}>
                                        {loading ? "Sending..." : (
                                            <>
                                                Send Message
                                                <Send className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
