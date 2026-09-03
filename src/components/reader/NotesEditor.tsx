/*
 * Reeda - a reading environment for PDFs.
 * Copyright (C) 2026 Quing (thekzbn)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Link as LinkIcon,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/lib/profile";
import { toast } from "sonner";
import "./notes-editor.css";

export interface NotesEditorHandle {
  insertText: (text: string) => void;
  focus: () => void;
}

interface NotesEditorProps {
  documentId: string;
  documentTitle?: string | undefined;
  initialMarkdown: string;
  onChangeMarkdown: (markdown: string) => void;
}

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`squircle h-8 w-8 ${
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Button>
  );
}

function Toolbar({
  editor,
  documentTitle,
}: {
  editor: Editor;
  documentTitle?: string | undefined;
}) {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const includeSource = profileQuery.data?.export_include_source ?? true;

  const handleToggleIncludeSource = (checked: boolean) => {
    updateProfileMutation.mutate({ export_include_source: checked });
  };

  const handleExport = async () => {
    try {
      const storage = editor.storage["markdown"] as { getMarkdown: () => string } | undefined;
      const markdown = storage ? storage.getMarkdown() : editor.getText();
      const { exportNotesToPdf } = await import("@/lib/notes-pdf");
      exportNotesToPdf({
        markdown,
        sourceTitle: documentTitle,
        includeSource,
        fileName: documentTitle ? `${documentTitle} Notes` : "Notes",
      });
      toast.success("Notes exported as PDF.");
    } catch {
      toast.error("Could not export notes.");
    }
  };

  const chain = () => editor.chain().focus();

  const setLink = () => {
    const previous = editor.getAttributes("link")["href"] as string | undefined;
    const url = window.prompt("Link address", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      chain().extendMarkRange("link").unsetLink().run();
      return;
    }
    chain().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => chain().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => chain().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => chain().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => chain().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => chain().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Checklist"
        active={editor.isActive("taskList")}
        onClick={() => chain().toggleTaskList().run()}
      >
        <ListChecks className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => chain().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="ml-auto flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="squircle h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
              title="Export notes"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleExport} className="cursor-pointer text-xs">
              <Download className="h-3.5 w-3.5 mr-2" />
              <span>Export as PDF</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={includeSource}
              onCheckedChange={handleToggleIncludeSource}
              className="cursor-pointer text-xs"
            >
              <span>Include source line</span>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export const NotesEditor = forwardRef<NotesEditorHandle, NotesEditorProps>(function NotesEditor(
  { documentId, documentTitle, initialMarkdown, onChangeMarkdown },
  ref,
) {
  const onChangeRef = useRef(onChangeMarkdown);
  onChangeRef.current = onChangeMarkdown;
  const [, forceRender] = useState(0);
  const lastLoadedDocIdRef = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing your notes" }),
      Markdown.configure({ html: false, transformPastedText: true, linkify: true }),
    ],
    content: initialMarkdown,
    editorProps: {
      attributes: {
        class: "px-5 py-5 sm:px-7 sm:py-6",
      },
    },
    onUpdate: ({ editor: current }: { editor: Editor }) => {
      const storage = current.storage["markdown"] as { getMarkdown: () => string } | undefined;
      const markdown = storage ? storage.getMarkdown() : current.getText();
      onChangeRef.current(markdown);
    },
    onSelectionUpdate: () => forceRender((n) => n + 1),
    onTransaction: () => forceRender((n) => n + 1),
  });

  useEffect(() => {
    if (!editor) return;
    if (lastLoadedDocIdRef.current !== documentId) {
      lastLoadedDocIdRef.current = documentId;
      editor.commands.setContent(initialMarkdown, false);
    }
  }, [editor, documentId, initialMarkdown]);

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(text).run();
      },
      focus: () => editor?.commands.focus(),
    }),
    [editor],
  );

  if (!editor) {
    return <div className="flex-1" />;
  }

  return (
    <div className="notes-editor flex h-full min-h-0 flex-col bg-background">
      <Toolbar editor={editor} documentTitle={documentTitle} />
      <div className="min-h-0 flex-1 overflow-y-auto" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} className="mx-auto h-full max-w-2xl" />
      </div>
    </div>
  );
});
