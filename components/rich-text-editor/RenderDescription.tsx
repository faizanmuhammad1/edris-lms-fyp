import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import parse from "html-react-parser";
import { cn } from "@/lib/utils";

/**
 * Renders stored TipTap JSON as HTML.
 * No "use client": when used from a Server Component the editor libraries stay on the
 * server and never reach the browser bundle.
 */
export function RenderDescription({ json, className }: { json: JSONContent; className?: string }) {
  let output = "";
  try {
    output = generateHTML(json, [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ])
      // Authored content sits under the page's own h1, so demote any h1 headings.
      .replace(/<(\/?)h1(?=[\s>])/g, "<$1h2");
  } catch {
    // Malformed content: render nothing rather than crashing the page.
    output = "";
  }

  return (
    <div
      className={cn(
        "prose dark:prose-invert prose-li:marker:text-primary break-words prose-pre:overflow-x-auto prose-img:max-w-full prose-table:block prose-table:overflow-x-auto",
        className
      )}
    >
      {parse(output)}
    </div>
  );
}
