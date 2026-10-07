"use client";

import { useEffect, type ComponentType } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "Write your message…";
const EDITOR_CLASS =
  "min-h-[280px] p-4 focus:outline-none prose prose-sm dark:prose-invert !w-full !max-w-none break-words";

type Props = {
  value: string;
  onChange: (json: string) => void;
  readOnly?: boolean;
  /** Temporarily blocks editing (e.g. while sending) without hiding the toolbar. */
  disabled?: boolean;
  /** Used when there is no TipTap JSON (older campaigns only stored HTML). */
  fallbackHtml?: string;
  /** id of the visible label element. */
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
};

function parseContent(value: string, fallbackHtml?: string): object | string {
  if (value) {
    try {
      return JSON.parse(value) as object;
    } catch {
      // Fall through to the HTML copy.
    }
  }
  return fallbackHtml ?? "";
}

export function MailBodyEditor({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  fallbackHtml,
  labelledBy,
  describedBy,
  invalid = false,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      attributes: { class: EDITOR_CLASS, role: "textbox", "aria-labelledby": labelledBy },
    },
    content: parseContent(value, fallbackHtml),
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (editor.isEditable) onChange(JSON.stringify(editor.getJSON()));
    },
  });

  const editable = !readOnly && !disabled;

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  // The contenteditable element is the actual control: give it a role, name and state.
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: EDITOR_CLASS,
          role: "textbox",
          "aria-multiline": "true",
          "aria-labelledby": labelledBy,
          ...(describedBy ? { "aria-describedby": describedBy } : {}),
          ...(readOnly ? { "aria-readonly": "true" } : { "aria-placeholder": PLACEHOLDER }),
          ...(disabled ? { "aria-disabled": "true" } : {}),
          "aria-invalid": invalid ? "true" : "false",
        },
      },
    });
  }, [editor, labelledBy, describedBy, readOnly, disabled, invalid]);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border bg-card transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        invalid ? "border-destructive" : "border-input",
        disabled && "opacity-70"
      )}
    >
      {!readOnly && <EditorToolbar editor={editor} disabled={disabled} />}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor && editable && editor.isEmpty && (
          <p
            aria-hidden="true"
            className="pointer-events-none absolute top-4 left-4 text-sm text-muted-foreground"
          >
            {PLACEHOLDER}
          </p>
        )}
      </div>
    </div>
  );
}

type ToolbarItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

const FORMAT_GROUPS: { label: string; items: ToolbarItem[] }[] = [
  {
    label: "Text style",
    items: [
      {
        label: "Bold",
        icon: Bold,
        isActive: (e) => e.isActive("bold"),
        run: (e) => e.chain().focus().toggleBold().run(),
      },
      {
        label: "Italic",
        icon: Italic,
        isActive: (e) => e.isActive("italic"),
        run: (e) => e.chain().focus().toggleItalic().run(),
      },
      {
        label: "Strikethrough",
        icon: Strikethrough,
        isActive: (e) => e.isActive("strike"),
        run: (e) => e.chain().focus().toggleStrike().run(),
      },
    ],
  },
  {
    label: "Headings",
    items: ([1, 2, 3] as const).map((level) => ({
      label: `Heading ${level}`,
      icon: level === 1 ? Heading1 : level === 2 ? Heading2 : Heading3,
      isActive: (e: Editor) => e.isActive("heading", { level }),
      run: (e: Editor) => e.chain().focus().toggleHeading({ level }).run(),
    })),
  },
  {
    label: "Lists",
    items: [
      {
        label: "Bulleted list",
        icon: List,
        isActive: (e) => e.isActive("bulletList"),
        run: (e) => e.chain().focus().toggleBulletList().run(),
      },
      {
        label: "Numbered list",
        icon: ListOrdered,
        isActive: (e) => e.isActive("orderedList"),
        run: (e) => e.chain().focus().toggleOrderedList().run(),
      },
    ],
  },
  {
    label: "Alignment",
    items: (["left", "center", "right"] as const).map((align) => ({
      label: `Align ${align}`,
      icon: align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight,
      isActive: (e: Editor) => e.isActive({ textAlign: align }),
      run: (e: Editor) => e.chain().focus().setTextAlign(align).run(),
    })),
  },
];

function EditorToolbar({ editor, disabled }: { editor: Editor | null; disabled: boolean }) {
  if (!editor) {
    // Reserve the toolbar's height until the editor mounts on the client.
    return <div className="h-[3.25rem] border-b bg-muted/30" aria-hidden="true" />;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="group"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2"
      >
        {FORMAT_GROUPS.map((group, index) => (
          <div key={group.label} role="group" aria-label={group.label} className="flex flex-wrap items-center gap-1">
            {index > 0 && <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(editor);
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Toggle
                      aria-label={item.label}
                      pressed={active}
                      onPressedChange={() => item.run(editor)}
                      disabled={disabled}
                      className="data-[state=on]:bg-primary/15 data-[state=on]:text-foreground"
                    >
                      <Icon aria-hidden="true" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
        <div role="group" aria-label="History" className="flex items-center gap-1 sm:ml-auto">
          {[
            { label: "Undo", icon: Undo, can: editor.can().undo(), run: () => editor.chain().focus().undo().run() },
            { label: "Redo", icon: Redo, can: editor.can().redo(), run: () => editor.chain().focus().redo().run() },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={item.label}
                    onClick={item.run}
                    disabled={disabled || !item.can}
                  >
                    <Icon aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
