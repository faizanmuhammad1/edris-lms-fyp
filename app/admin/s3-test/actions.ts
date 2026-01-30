"use server";

import { S3 } from "@/lib/S3Client";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { requireUser } from "@/app/data/user/require-user";

export async function checkS3Connection() {
    await requireUser();
    // Ensure we are admin if needed, but for now just authenticated

    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;

    // console.log("Testing S3 connection for bucket:", bucketName);

    if (!bucketName) {
        return { success: false, message: "Bucket name not configured" };
    }

    try {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 5,
        });

        const response = await S3.send(command);

        // console.log("S3 connection successful", response);

        return {
            success: true,
            bucketName,
            region: env.AWS_REGION,
            objects: response.Contents?.map(obj => ({
                key: obj.Key || "Unknown",
                size: obj.Size || 0,
                lastModified: obj.LastModified
            })) || [],
            message: "Connection successful"
        };

    } catch (error) {
        console.error("S3 Connection Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
            success: false,
            message: errorMessage,
            code: (error as { code?: string })?.code,
            requestId: (error as { $metadata?: { requestId?: string } })?.$metadata?.requestId
        };
    }
}
