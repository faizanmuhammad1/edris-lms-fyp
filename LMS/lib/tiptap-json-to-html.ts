import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

const extensions = [
  StarterKit,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
];

/** Convert TipTap JSON (from our editor) to HTML for email. */
export function tiptapJsonToHtml(json: JSONContent | string | null | undefined): string {
  if (json == null || json === "") return "";
  const content = typeof json === "string" ? (JSON.parse(json) as JSONContent) : json;
  return generateHTML(content, extensions);
}
