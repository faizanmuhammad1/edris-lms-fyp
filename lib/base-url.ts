export function getServerBaseUrl(): string {
  const url =
    process.env.INTERNAL_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";

  return url.replace(/\/$/, "");
}

