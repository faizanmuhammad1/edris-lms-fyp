import { createElement } from "react";
import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import parse, {
  Element,
  attributesToProps,
  domToReact,
  type DOMNode,
  type HTMLReactParserOptions,
} from "html-react-parser";

/**
 * Server-rendered course description. Produces the same markup as the shared client
 * RenderDescription, but keeps tiptap/ProseMirror out of the public page's JS bundle.
 * Author headings are re-levelled to start at h3 so they nest under "About this course" (h2).
 */
export function CourseDescription({ json, fallback }: { json: string; fallback?: string }) {
  let html: string | null = null;
  try {
    html = generateHTML(JSON.parse(json) as JSONContent, [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ]);
  } catch (error) {
    console.error("[CourseDescription] could not render description", error);
  }

  if (!html) {
    return fallback ? <p>{fallback}</p> : null;
  }

  const levels = Array.from(html.matchAll(/<h([1-6])[\s>]/g), (m) => Number(m[1]));
  const offset = levels.length > 0 ? 3 - Math.min(...levels) : 0;

  const options: HTMLReactParserOptions = {
    replace(node) {
      if (offset !== 0 && node instanceof Element && /^h[1-6]$/.test(node.name)) {
        const level = Math.min(6, Math.max(3, Number(node.name[1]) + offset));
        return createElement(
          `h${level}`,
          attributesToProps(node.attribs),
          domToReact(node.children as DOMNode[], options)
        );
      }
      return undefined;
    },
  };

  return <div className="prose prose-li:marker:text-primary dark:prose-invert">{parse(html, options)}</div>;
}
