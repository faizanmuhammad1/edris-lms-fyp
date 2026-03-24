"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyCertificate, VerificationResult } from "@/app/actions/verify-certificate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Search, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerificationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerificationContent />
        </Suspense>
    );
}

function VerificationContent() {
    const [hash, setHash] = useState("");
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const searchParams = useSearchParams();
    const cid = searchParams.get("cid");

    useEffect(() => {
        if (!cid) return;

        setHash(cid);
        setIsLoading(true);
        setResult(null);

        verifyCertificate(cid)
            .then((r) => setResult(r))
            .catch((error) => {
                console.error("Verification error:", error);
                setResult({ isValid: false, error: "Verification failed. Please try again." });
            })
            .finally(() => setIsLoading(false));
    }, [cid]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hash.trim()) return;

        setIsLoading(true);
        setResult(null);

        try {
            const verificationResult = await verifyCertificate(hash.trim());
            setResult(verificationResult as VerificationResult);
        } catch (error) {
            console.error("Verification error:", error);
            setResult({ isValid: false, error: "Verification failed. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 flex-1 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-secondary/30 -z-10" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-40" />

                <div className="container px-4 md:px-6 mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-xl mx-auto"
                    >
                        <Card className="border-border/60 shadow-xl bg-card/80 backdrop-blur-xl">
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                                    <ShieldCheck className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle className="text-3xl font-bold tracking-tight">Verify Certificate</CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Enter the unique certificate hash ID to verify authenticity.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleVerify} className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="e.g., CERT-2025-ABC123"
                                                value={hash}
                                                onChange={(e) => setHash(e.target.value)}
                                                className="pl-10 h-12 text-lg bg-background/50"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" size="lg" className="w-full h-12 text-base font-medium transition-all" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            "Verify Authenticity"
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* Result Section */}
            <section className="flex-1 container px-4 md:px-6 mx-auto pb-20">
                <AnimatePresence mode="wait">
                    {result && (
                        <motion.div
                            key={result.isValid ? "success" : "error"}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-2xl mx-auto"
                        >
                            {result.isValid ? (
                                <Card className="border-primary/20 shadow-lg bg-primary/5 backdrop-blur-sm">
                                    <CardHeader className="text-center pb-2">
                                        <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit mb-4">
                                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <CardTitle className="text-2xl text-green-700 dark:text-green-400">VERIFIED</CardTitle>
                                        <CardDescription>This certificate is valid and authentic.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-background/50 p-4 rounded-lg border">
                                                <p className="text-sm text-muted-foreground mb-1">Course Title</p>
                                                <p className="font-semibold">{result.certificate.courseName}</p>
                                            </div>
                                            <div className="bg-background/50 p-4 rounded-lg border">
                                                <p className="text-sm text-muted-foreground mb-1">Issued On</p>
                                                <p className="font-semibold">
                                                    {new Date(result.certificate.issuedAt).toLocaleDateString(undefined, {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            <div className="bg-background/50 p-4 rounded-lg border md:col-span-2">
                                                <p className="text-sm text-muted-foreground mb-1">Student</p>
                                                <p className="font-semibold">{result.certificate.studentName}</p>
                                            </div>
                                            <div className="bg-background/50 p-4 rounded-lg border md:col-span-2">
                                                <p className="text-sm text-muted-foreground mb-1">Certificate ID</p>
                                                <p className="font-mono text-sm">{result.certificate.uniqueId}</p>
                                            </div>
                                            <div className="bg-background/50 p-4 rounded-lg border">
                                                <p className="text-sm text-muted-foreground mb-1">Transaction</p>
                                                {result.certificate.txHash ? (
                                                    <a
                                                        href={result.certificate.explorerUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-mono text-sm text-primary underline underline-offset-2"
                                                    >
                                                        {result.certificate.txHash.slice(0, 12)}...
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">N/A</p>
                                                )}
                                            </div>
                                            <div className="bg-background/50 p-4 rounded-lg border">
                                                <p className="text-sm text-muted-foreground mb-1">Block</p>
                                                <p className="font-semibold">{result.certificate.blockNumber ?? "N/A"}</p>
                                            </div>
                                            <div className="bg-background/50 p-4 rounded-lg border md:col-span-2">
                                                <p className="text-sm text-muted-foreground mb-1">Network</p>
                                                <p className="font-semibold">Polygon Amoy</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-destructive/20 shadow-lg bg-destructive/5 backdrop-blur-sm">
                                    <CardHeader className="text-center">
                                        <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-3 rounded-full w-fit mb-4">
                                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                        </div>
                                        <CardTitle className="text-2xl text-red-700 dark:text-red-400">INVALID / NOT FOUND</CardTitle>
                                        <CardDescription className="text-red-600/80 dark:text-red-400/80">
                                            {result.error}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}
