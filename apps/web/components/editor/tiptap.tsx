"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Minus,
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
  /** Render the editing surface as a white A4 sheet (contract documents). */
  a4?: boolean;
  /** Low editing surface for short snippets (e.g. header/footer lines). */
  compact?: boolean;
}

/**
 * Lightweight rich-text editor for email bodies. Mirrors the Periparto Tiptap
 * pattern (StarterKit + Link + toolbar) trimmed to the formatting an email
 * needs — no CMS shortcodes, media uploads or entity cards.
 */
const Tiptap = ({ description, onChange, className, a4, compact }: TiptapProps) => {
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
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: description ?? "",
    editorProps: {
      attributes: {
        class: a4
          ? // White sheet with A4 proportions and print-like margins. Typography
            // mirrors the a4-preview stylesheet so editor and preview line up.
            "mx-auto min-h-[297mm] w-[210mm] max-w-full bg-white text-black shadow-md px-[20mm] py-[15mm] font-[Helvetica,Arial,sans-serif] text-[10pt] leading-[1.45] focus-visible:outline-none " +
            "[&_p]:mt-0 [&_p]:mb-[0.6em] " +
            "[&_h1]:mt-[0.8em] [&_h1]:mb-[0.4em] [&_h1]:text-[2em] [&_h1]:font-bold " +
            "[&_h2]:mt-[0.8em] [&_h2]:mb-[0.4em] [&_h2]:text-[1.5em] [&_h2]:font-bold " +
            "[&_h3]:mt-[0.8em] [&_h3]:mb-[0.4em] [&_h3]:text-[1.17em] [&_h3]:font-bold " +
            "[&_h4]:mt-[0.8em] [&_h4]:mb-[0.4em] [&_h4]:font-bold " +
            "[&_ul]:mt-0 [&_ul]:mb-[0.6em] [&_ul]:list-disc [&_ul]:pl-[1.4em] " +
            "[&_ol]:mt-0 [&_ol]:mb-[0.6em] [&_ol]:list-decimal [&_ol]:pl-[1.4em] " +
            "[&_blockquote]:my-[0.6em] [&_blockquote]:border-l-2 [&_blockquote]:border-[#ccc] [&_blockquote]:pl-[0.8em] [&_blockquote]:text-[#444] " +
            "[&_hr]:my-[0.8em] [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[#bbb]"
          : cn(
              "prose prose-sm dark:prose-invert max-w-none w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none",
              compact ? "min-h-[72px]" : "min-h-[220px]",
            ),
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
      {a4 ? (
        <div className="overflow-auto rounded-b-md border border-t-0 border-input bg-muted/60 p-4">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
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
      key: "hr",
      icon: Minus,
      label: "Trennlinie",
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      key: "align-left",
      icon: AlignLeft,
      label: "Linksbündig",
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
    },
    {
      key: "align-center",
      icon: AlignCenter,
      label: "Zentriert",
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
    },
    {
      key: "align-right",
      icon: AlignRight,
      label: "Rechtsbündig",
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editor.isActive({ textAlign: "right" }),
    },
    {
      key: "align-justify",
      icon: AlignJustify,
      label: "Blocksatz",
      onClick: () => editor.chain().focus().setTextAlign("justify").run(),
      isActive: editor.isActive({ textAlign: "justify" }),
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
