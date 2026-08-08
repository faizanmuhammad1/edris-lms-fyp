import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { S3 } from "./S3Client";
import { env } from "./env";

export async function deleteFileFromS3(key: string) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Key: key,
        });
        await S3.send(command);
        return { success: true };
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        return { success: false, error };
    }
}

export async function deleteFilesFromS3(keys: string[]) {
    if (keys.length === 0) return { success: true };

    try {
        const command = new DeleteObjectsCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                Quiet: true,
            },
        });
        await S3.send(command);
        return { success: true };
    } catch (error) {
        console.error("Error deleting files from S3:", error);
        return { success: false, error };
    }
}
