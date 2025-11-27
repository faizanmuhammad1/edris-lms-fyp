"use client";

import { useState, useEffect } from "react";
import { applyAsTeacher } from "@/app/actions/apply-teacher";
import { getTeacherStatus } from "@/app/data/user/get-teacher-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, GraduationCap, Users, TrendingUp, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function TeachPage() {
    const { data: session, isPending } = authClient.useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teacherStatus, setTeacherStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchStatus() {
            if (session) {
                try {
                    const status = await getTeacherStatus();
                    setTeacherStatus(status?.teacherStatus || null);
                    setRejectionReason(status?.teacherRejectionReason || null);
                } catch (error) {
                    console.error("Failed to fetch teacher status:", error);
                } finally {
                    setIsLoadingStatus(false);
                }
            } else {
                setIsLoadingStatus(false);
            }
        }
        fetchStatus();
    }, [session]);

    const handleApply = async () => {
        setIsSubmitting(true);
        try {
            const result = await applyAsTeacher();
            if (result.success) {
                toast.success(result.message);
                // Refresh status
                const status = await getTeacherStatus();
                setTeacherStatus(status?.teacherStatus || null);
                setRejectionReason(status?.teacherRejectionReason || null);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isPending || isLoadingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If approved teacher, redirect to teacher dashboard
    if (teacherStatus === "Approved") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-primary/20 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl">You're a Teacher!</CardTitle>
                        <CardDescription>You have been approved to teach on Edris LMS.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/teacher">
                            <Button className="w-full" size="lg">
                                Go to Teacher Dashboard
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If pending approval
    if (teacherStatus === "Pending") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-yellow-500/20 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full w-fit mb-4">
                            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                        </div>
                        <CardTitle className="text-2xl">Application Pending</CardTitle>
                        <CardDescription>Your teacher application is under review by our admin team.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                We're reviewing your application and will notify you once a decision has been made. This usually takes 1-2 business days.
                            </p>
                        </div>
                        <Link href="/">
                            <Button variant="outline" className="w-full">
                                Back to Home
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If rejected
    if (teacherStatus === "Rejected") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-destructive/20 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-3 rounded-full w-fit mb-4">
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-2xl">Application Not Approved</CardTitle>
                        <CardDescription>Unfortunately, your teacher application was not approved.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {rejectionReason && (
                            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                                <p className="text-sm font-medium mb-1">Reason:</p>
                                <p className="text-sm text-muted-foreground">{rejectionReason}</p>
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                            You can reapply after addressing the concerns mentioned above.
                        </p>
                        <Button onClick={handleApply} disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Submitting..." : "Reapply"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Not logged in or no application yet - show landing page
    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                {/* Hero Section */}
                <section className="relative py-20 md:py-32 overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 -z-10" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                    <div className="container px-4 md:px-6 mx-auto text-center">
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 mb-6">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Join Our Teaching Community
                        </Badge>

                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            Teach on Edris LMS
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                            Share your knowledge with thousands of students worldwide. Create courses, earn revenue, and make an impact.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/login">
                                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    Sign In to Apply
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="lg" variant="outline">
                                    Create Account
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-20 container px-4 md:px-6 mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Teach With Us?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Global Reach</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Connect with students from around the world and grow your audience.</p>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                                    <TrendingUp className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Earn Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Get paid for your expertise and create a sustainable income stream.</p>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                                    <BookOpen className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Easy Tools</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Use our intuitive course creation tools to build engaging content.</p>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                                    <GraduationCap className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Support</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Get dedicated support from our team to help you succeed.</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-20 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div>
                                <h3 className="text-4xl font-bold text-primary mb-2">10,000+</h3>
                                <p className="text-muted-foreground">Active Students</p>
                            </div>
                            <div>
                                <h3 className="text-4xl font-bold text-primary mb-2">500+</h3>
                                <p className="text-muted-foreground">Expert Teachers</p>
                            </div>
                            <div>
                                <h3 className="text-4xl font-bold text-primary mb-2">1,000+</h3>
                                <p className="text-muted-foreground">Courses Available</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // Logged in but not applied yet - show application form
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-20">
            <div className="container px-4 md:px-6 mx-auto max-w-2xl">
                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                            <GraduationCap className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl">Apply to Become a Teacher</CardTitle>
                        <CardDescription className="text-base">
                            Join our community of expert educators and start sharing your knowledge today.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                            <h3 className="font-semibold text-lg">What happens next?</h3>
                            <ol className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                                    <span>Submit your application by clicking the button below</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                                    <span>Our admin team will review your application (usually within 1-2 business days)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                                    <span>Once approved, you'll get access to the teacher dashboard and course creation tools</span>
                                </li>
                            </ol>
                        </div>

                        <div className="space-y-4">
                            <Button onClick={handleApply} disabled={isSubmitting} className="w-full" size="lg">
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Submitting Application...
                                    </>
                                ) : (
                                    <>
                                        Submit Application
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                By applying, you agree to our teacher terms and conditions.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
