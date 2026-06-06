"use client";

/**
 * TipTap rich-text editor for journal entries — client-only, no SSR.
 * Outputs HTML stored in JournalEntry.content; read mode uses journal-prose.
 */
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect } from "react";

type JournalEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  autoFocus?: boolean;
};

export function JournalEditor({
  content,
  onChange,
  placeholder = "Write what's on your mind today…",
  editable = true,
  autoFocus = false,
}: JournalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: content || "<p></p>",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "ProseMirror min-h-[120px] w-full outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current && content !== editor.getText()) {
      editor.commands.setContent(content || "<p></p>", false);
    }
  }, [content, editor]);

  useEffect(() => {
    if (autoFocus && editor) {
      editor.commands.focus("end");
    }
  }, [autoFocus, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className="journal-editor flex min-h-0 flex-1 flex-col overflow-hidden">
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}
