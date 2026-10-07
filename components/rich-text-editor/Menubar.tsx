"use client";

import type { KeyboardEvent } from "react";
import { type Editor } from "@tiptap/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Toggle } from "../ui/toggle";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Italic,
  ListIcon,
  ListOrdered,
  Redo,
  Strikethrough,
  Undo,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../ui/button";

interface iAppProps {
  editor: Editor | null;
}

interface ToggleItem {
  label: string;
  icon: LucideIcon;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}

const FORMAT_ITEMS: ToggleItem[] = [
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
  {
    label: "Heading 1",
    icon: Heading1Icon,
    isActive: (e) => e.isActive("heading", { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "Heading 2",
    icon: Heading2Icon,
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Heading 3",
    icon: Heading3Icon,
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "Bullet list",
    icon: ListIcon,
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered list",
    icon: ListOrdered,
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
];

const ALIGN_ITEMS: ToggleItem[] = [
  {
    label: "Align left",
    icon: AlignLeft,
    isActive: (e) => e.isActive({ textAlign: "left" }),
    run: (e) => e.chain().focus().setTextAlign("left").run(),
  },
  {
    label: "Align center",
    icon: AlignCenter,
    isActive: (e) => e.isActive({ textAlign: "center" }),
    run: (e) => e.chain().focus().setTextAlign("center").run(),
  },
  {
    label: "Align right",
    icon: AlignRight,
    isActive: (e) => e.isActive({ textAlign: "right" }),
    run: (e) => e.chain().focus().setTextAlign("right").run(),
  },
];

/** Arrow keys move between toolbar controls (WAI-ARIA toolbar pattern). */
function handleToolbarKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) return;
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")
  );
  const current = items.indexOf(document.activeElement as HTMLButtonElement);
  if (current === -1 || items.length === 0) return;
  event.preventDefault();
  let next = current;
  if (event.key === "ArrowRight") next = (current + 1) % items.length;
  if (event.key === "ArrowLeft") next = (current - 1 + items.length) % items.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = items.length - 1;
  items[next]?.focus();
}

function ToolbarToggle({ editor, item }: { editor: Editor; item: ToggleItem }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          type="button"
          size="default"
          aria-label={item.label}
          pressed={item.isActive(editor)}
          onPressedChange={() => item.run(editor)}
        >
          <Icon aria-hidden="true" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>{item.label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarSeparator() {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="mx-1 h-6 w-px shrink-0 bg-border"
    />
  );
}

export function Menubar({ editor }: iAppProps) {
  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider>
      <div
        role="toolbar"
        aria-label="Text formatting"
        aria-orientation="horizontal"
        onKeyDown={handleToolbarKeyDown}
        className="flex flex-wrap items-center gap-1 border-b border-input bg-card p-1.5 sm:p-2"
      >
        <div className="flex flex-wrap gap-1">
          {FORMAT_ITEMS.map((item) => (
            <ToolbarToggle key={item.label} editor={editor} item={item} />
          ))}
        </div>

        <ToolbarSeparator />

        <div className="flex flex-wrap gap-1">
          {ALIGN_ITEMS.map((item) => (
            <ToolbarToggle key={item.label} editor={editor} item={item} />
          ))}
        </div>

        <ToolbarSeparator />

        <div className="flex flex-wrap gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                aria-label="Undo"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                <Undo aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                aria-label="Redo"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                <Redo aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
