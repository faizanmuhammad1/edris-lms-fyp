/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Menubar } from "./Menubar";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  /** react-hook-form field: value is the editor JSON (stringified). */
  field: any;
  /** Injected by shadcn <FormControl>. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  /** Accessible name for the editing area (otherwise the matching <label for={id}> is used). */
  ariaLabel?: string;
  placeholder?: string;
}

/** Stored values are TipTap JSON; fall back to HTML/plain text for legacy values. */
function parseContent(value: unknown): Content {
  if (typeof value !== "string" || value.trim() === "") return "";
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Content) : value;
  } catch {
    return value;
  }
}

export function RichTextEditor({
  field,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ariaLabel,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  // Callbacks are registered once, so read the latest field through a ref.
  const fieldRef = useRef(field);
  useEffect(() => {
    fieldRef.current = field;
  });

  // A <label for> can't name a contenteditable; reference the label by id instead.
  const labelId = id ? `${id}-label` : undefined;
  useEffect(() => {
    if (!id || !labelId || ariaLabel) return;
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (label && !label.id) label.id = labelId;
  }, [id, labelId, ariaLabel]);

  const invalid = ariaInvalid === true || ariaInvalid === "true";

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],

    // Re-applied on every render by useEditor, so aria-invalid stays in sync.
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] p-4 focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert !w-full !max-w-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-placeholder": placeholder,
        ...(id ? { id } : {}),
        ...(ariaLabel
          ? { "aria-label": ariaLabel }
          : labelId
            ? { "aria-labelledby": labelId }
            : { "aria-label": "Rich text editor" }),
        ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },

    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      fieldRef.current.onChange(JSON.stringify(editor.getJSON()));
    },

    onBlur: () => {
      fieldRef.current.onBlur?.();
    },

    content: parseContent(field.value),
  });

  const showPlaceholder = !!editor && editor.isEmpty;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border dark:bg-input/30 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        invalid ? "border-destructive" : "border-input"
      )}
    >
      <Menubar editor={editor} />
      <div className="relative">
        {showPlaceholder && (
          <p
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground sm:text-base"
          >
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
