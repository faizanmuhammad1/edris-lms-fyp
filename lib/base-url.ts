/** Public base URL used for links in emails (confirm, unsubscribe, certificates). */
export function getServerBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.INTERNAL_WEBHOOK_URL ||
    "http://localhost:3000";

  return url.replace(/\/$/, "");
}
