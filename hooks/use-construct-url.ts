import { env } from "@/lib/env";

export function useConstructUrl(key: string): string {
  // Fallback for mock/local thumbnails to avoid remote image domain issues
  if (!key || key.startsWith("thumbnails/")) {
    return "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"; // local public asset
  }

  // If an absolute URL is provided, pass it through as-is
  if (/^https?:\/\//i.test(key)) {
    return key;
  }

  // If we have a specific dev URL for S3 (e.g., local t3.storage or custom domain), use it
  if (env.NEXT_PUBLIC_S3_DEV_URL) {
    // If it's something like https://edris-lms-fyp.t3.storage.dev we can just append the key
    // Alternatively, if it requires path style: https://t3.storage.dev/buckename/key
    // For now we assume NEXT_PUBLIC_S3_DEV_URL already includes the bucket if needed
    // based on user's .env: NEXT_PUBLIC_S3_DEV_URL="https://edris-lms-fyp.t3.storage.dev"
    return `${env.NEXT_PUBLIC_S3_DEV_URL.replace(/\/$/, '')}/${key}`;
  }

  return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${key}`;
}
