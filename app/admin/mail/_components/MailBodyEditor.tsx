"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Menubar } from "@/components/rich-text-editor/Menubar";

const defaultContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Write your message here…" }] }] };

type Props = {
  value: string;
  onChange: (json: string) => void;
  readOnly?: boolean;
};

export function MailBodyEditor({ value, onChange, readOnly }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] p-4 focus:outline-none prose prose-sm dark:prose-invert !w-full !max-w-none",
      },
    },
    content: value ? (JSON.parse(value) as object) : defaultContent,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (!readOnly) onChange(JSON.stringify(editor.getJSON()));
    },
  });

  return (
    <div className="w-full border border-input rounded-lg overflow-hidden bg-card">
      {!readOnly && <Menubar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
