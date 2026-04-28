"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  NumberedListLeft,
  Quote,
  Number1Square,
  Number2Square,
  Number3Square,
  Link as LinkIcon,
  MediaImagePlus,
  Minus,
  Undo,
  Redo,
} from "iconoir-react";
import { cn } from "@/lib/utils";

const linkExtension = TiptapLink.configure({
  openOnClick: false,
  HTMLAttributes: {
    class: "text-primary underline hover:text-primary-active",
  },
});

const imageExtension = Image.configure({
  HTMLAttributes: {
    class: "max-w-full h-auto rounded-lg",
  },
});

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = "Write your content here...",
      minHeight = "min-h-[280px]",
      className,
      disabled = false,
    },
    _ref
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        linkExtension,
        imageExtension,
        Placeholder.configure({ placeholder }),
      ],
      content: value || "",
      editable: !disabled,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class:
            "prose-custom px-4 py-3 text-sm focus:outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        },
      },
    });

    React.useEffect(() => {
      if (!editor) return;
      if (value !== editor.getHTML()) {
        editor.commands.setContent(value || "", false);
      }
    }, [value, editor]);

    React.useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [editor, disabled]);

    if (!editor) {
      return (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg border border-input bg-muted/30",
            minHeight,
            className
          )}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    const ToolbarButton = ({
      onClick,
      active,
      disabled: btnDisabled,
      "aria-label": ariaLabel,
      children,
    }: {
      onClick: () => void;
      active?: boolean;
      disabled?: boolean;
      "aria-label": string;
      children: React.ReactNode;
    }) => (
      <button
        type="button"
        onClick={onClick}
        disabled={btnDisabled}
        aria-label={ariaLabel}
        className={cn(
          "rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          active && "bg-primary/10 text-primary"
        )}
      >
        {children}
      </button>
    );

    const addLink = () => {
      const url = window.prompt("Enter URL:", "https://");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    };

    const addImage = () => {
      const url = window.prompt("Enter image URL:", "https://");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    };

    return (
      <div
        className={cn("overflow-hidden rounded-lg border border-input bg-background", className)}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/30 px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            aria-label="Strikethrough"
          >
            <Strikethrough className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            aria-label="Heading 1"
          >
            <Number1Square className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            aria-label="Heading 2"
          >
            <Number2Square className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            aria-label="Heading 3"
          >
            <Number3Square className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            aria-label="Bullet list"
          >
            <List className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            aria-label="Numbered list"
          >
            <NumberedListLeft className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            aria-label="Blockquote"
          >
            <Quote className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton onClick={addLink} active={editor.isActive("link")} aria-label="Add link">
            <LinkIcon className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} aria-label="Add image">
            <MediaImagePlus className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            aria-label="Horizontal rule"
          >
            <Minus className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="Undo"
          >
            <Undo className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="Redo"
          >
            <Redo className="h-4 w-4 stroke-[1.5]" />
          </ToolbarButton>
        </div>

        {/* Editor content */}
        <div className={cn("overflow-y-auto", minHeight)}>
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
