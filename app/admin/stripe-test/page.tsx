"use client";

import { useState } from "react";
import { checkStripeConnection, seedStripeProduct } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface StripeTestResult {
    success: boolean;
    message?: string;
    data?: {
        apiKeyConfigured?: boolean;
        webhookSecretConfigured?: boolean;
        webhookSecretSample?: string;
        stripeConnection?: boolean;
        productList?: number;
    };
}

export default function StripeTestPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<StripeTestResult | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [seedResult, setSeedResult] = useState<any>(null);

    const runTest = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await checkStripeConnection();
            setResult(res);
        } catch {
            setResult({ success: false, message: "Failed to execute server action" });
        } finally {
            setLoading(false);
        }
    };

    const createTestProduct = async () => {
        setLoading(true);
        try {
            const res = await seedStripeProduct();
            setSeedResult(res);
            // Re-run test to see updated count
            if (res.success) runTest();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold">Stripe Integration Diagnostics</h1>
            <p className="text-muted-foreground">
                Use this tool to verify your Stripe API keys and connection status.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={runTest} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Testing..." : "Run Diagnostics"}
                    </Button>

                    {result && (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StatusItem
                                    label="API Key Configured (STRIPE_SECRET_KEY)"
                                    success={result.data?.apiKeyConfigured}
                                />
                                <StatusItem
                                    label="Webhook Secret Configured"
                                    success={result.data?.webhookSecretConfigured}
                                    details={result.data?.webhookSecretSample}
                                />
                                <StatusItem
                                    label="Stripe API Connection"
                                    success={result.data?.stripeConnection}
                                />
                                <StatusItem
                                    label="Product List Access"
                                    success={!!result.data?.stripeConnection}
                                    details={`Found ${result.data?.productList} products`}
                                />
                            </div>

                            {!result.success && (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{result.message}</AlertDescription>
                                </Alert>
                            )}

                            {result.success && (
                                <Alert className="border-green-500 bg-green-500/10">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <AlertTitle className="text-green-500">System Ready</AlertTitle>
                                    <AlertDescription className="text-green-600">
                                        Your Stripe configuration appears to be correct and operational.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {result?.success && (
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={createTestProduct} disabled={loading}>
                            Create Test Product ($10.00)
                        </Button>
                        {seedResult && (
                            <div className="mt-4 p-4 bg-muted rounded">
                                <pre className="text-xs overflow-auto">
                                    {JSON.stringify(seedResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function StatusItem({ label, success, details }: { label: string, success?: boolean, details?: string }) {
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">{label}</span>
            <div className="flex items-center gap-2">
                {details && <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{details}</span>}
                {success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                )}
            </div>
        </div>
    )
}
