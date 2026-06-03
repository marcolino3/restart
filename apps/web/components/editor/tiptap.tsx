"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TiptapProps {
  /** Current HTML value (RHF field value). */
  description?: string;
  onChange: (richText: string) => void;
  className?: string;
}

/**
 * Lightweight rich-text editor for email bodies. Mirrors the Periparto Tiptap
 * pattern (StarterKit + Link + toolbar) trimmed to the formatting an email
 * needs — no CMS shortcodes, media uploads or entity cards.
 */
const Tiptap = ({ description, onChange, className }: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
    ],
    content: description ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[220px] w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Keep the editor in sync when the value is set externally (e.g. a template
  // preview prefilling the body).
  useEffect(() => {
    if (editor && description !== editor.getHTML()) {
      editor.commands.setContent(description ?? "", false);
    }
  }, [description, editor]);

  return (
    <div className={cn("flex flex-col", className)}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link-URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const items: Array<{
    key: string;
    icon: typeof Bold;
    label: string;
    onClick: () => void;
    isActive?: boolean;
  }> = [
    {
      key: "h2",
      icon: Heading2,
      label: "Überschrift",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      key: "bold",
      icon: Bold,
      label: "Fett",
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      key: "italic",
      icon: Italic,
      label: "Kursiv",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      key: "bullet",
      icon: List,
      label: "Aufzählung",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      key: "ordered",
      icon: ListOrdered,
      label: "Nummerierte Liste",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      key: "quote",
      icon: Quote,
      label: "Zitat",
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
    {
      key: "link",
      icon: LinkIcon,
      label: "Link",
      onClick: setLink,
      isActive: editor.isActive("link"),
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 rounded-t-md border border-input bg-muted/40 p-1.5">
      {items.map(({ key, icon: Icon, label, onClick, isActive }) => (
        <Button
          key={key}
          type="button"
          variant={isActive ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          title={label}
          aria-label={label}
          aria-pressed={isActive}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <div className="ml-auto flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Rückgängig"
          aria-label="Rückgängig"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Wiederholen"
          aria-label="Wiederholen"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Tiptap;
