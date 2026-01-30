"use client";

import { useState } from "react";
import { checkS3Connection } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Database } from "lucide-react";

export default function S3TestPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message?: string;
        bucketName?: string;
        region?: string;
        objects?: Array<{ key: string; size: number }>;
        code?: string;
    } | null>(null);

    const runTest = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await checkS3Connection();
            setResult(res);
        } catch {
            setResult({ success: false, message: "Failed to execute server action" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold">AWS S3 Diagnostics</h1>
            <p className="text-muted-foreground">
                Verify connectivity to your S3 Storage Bucket.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={runTest} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Testing..." : "Test S3 Connection"}
                    </Button>

                    {result && (
                        <div className="space-y-4 mt-4">
                            {!result.success && (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertTitle>Connection Failed</AlertTitle>
                                    <AlertDescription>
                                        <p className="font-semibold">{result.message}</p>
                                        {result.code && <p className="text-xs mt-1">Code: {result.code}</p>}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {result.success && (
                                <Alert className="border-green-500 bg-green-500/10">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <AlertTitle className="text-green-500">Connection Successful</AlertTitle>
                                    <AlertDescription className="text-green-600">
                                        Successfully connected to bucket: <strong>{result.bucketName}</strong> in <strong>{result.region}</strong>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {result.objects && (
                                <div className="border rounded-md p-4 bg-muted/50">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Database className="h-4 w-4" />
                                        Recent Objects (Max 5)
                                    </h3>
                                    {result.objects.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Bucket is empty.</p>
                                    ) : (
                                        <ul className="text-sm space-y-2">
                                            {result.objects.map((obj: { key: string; size: number }, i: number) => (
                                                <li key={i} className="flex justify-between border-b pb-1 last:border-0">
                                                    <span className="truncate max-w-[300px]">{obj.key}</span>
                                                    <span className="text-muted-foreground">{(obj.size / 1024).toFixed(2)} KB</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
