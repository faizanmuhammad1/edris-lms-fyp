import { env } from "@/lib/env";

/** Public URL for an object in the images bucket. Keys may contain spaces or "#", so each segment is encoded. */
export function getPublicFileUrl(key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const base = env.NEXT_PUBLIC_S3_DEV_URL
    ? env.NEXT_PUBLIC_S3_DEV_URL.replace(/\/$/, "")
    : `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev`;
  return `${base}/${encodedKey}`;
}
