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

  return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${key}`;
}
