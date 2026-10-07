/**
 * Sanitize user text for storage and AI input: remove script tags, data URLs,
 * and other obviously dangerous content. Does not execute or render HTML.
 */
export function sanitizeAssignmentText(text: string | null | undefined): string {
  if (text == null || typeof text !== "string") return "";
  let out = text;
  // Remove script/style tags and content
  out = out.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  out = out.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  out = out.replace(/<[^>]+>/g, " "); // Strip remaining HTML tags
  // Remove data: URLs (can be used for XSS)
  out = out.replace(/\bdata:\s*[^,\s)]+/gi, "");
  return out.trim();
}
