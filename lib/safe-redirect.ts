/**
 * Returns the value only if it is a same-site relative path ("/dashboard"),
 * rejecting absolute and protocol-relative URLs to prevent open redirects.
 */
export function safeCallbackPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return value;
}
