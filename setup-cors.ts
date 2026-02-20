import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";
config({ path: ".env.local" });

// Fallback to .env if .env.local doesn't have the keys loaded
if (!process.env.AWS_ACCESS_KEY_ID) {
    config({ path: ".env" });
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});

const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES || "edris-lms-fyp";

async function setAndCheckCors() {
    const params = {
        Bucket: bucketName,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["PUT", "POST", "GET", "HEAD", "DELETE"],
                    AllowedOrigins: ["*"],
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3600,
                },
            ],
        },
    };

    try {
        console.log(`Setting CORS for bucket: ${bucketName}...`);
        await s3Client.send(new PutBucketCorsCommand(params));
        console.log("CORS Configuration applied successfully.");

        console.log("Verifying CORS...");
        const cors = await s3Client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
        console.dir(cors.CORSRules, { depth: null });

    } catch (err) {
        console.error("Error with CORS Configuration:", err);
    }
}

setAndCheckCors();
