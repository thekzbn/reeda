import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocumentNote, saveDocumentNote } from "@/lib/notes";
import { NotesEditor, type NotesEditorHandle } from "./NotesEditor";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NotesPaneProps {
  documentId: string;
  documentTitle?: string | undefined;
}

const AUTOSAVE_DELAY_MS = 900;

export const NotesPane = forwardRef<NotesEditorHandle, NotesPaneProps>(function NotesPane(
  { documentId, documentTitle },
  ref,
) {
  const queryClient = useQueryClient();

  const noteQuery = useQuery({
    queryKey: ["document-note", documentId],
    queryFn: () => getDocumentNote(documentId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const flush = useCallback(async () => {
    const pending = pendingRef.current;
    if (pending === null) return;
    pendingRef.current = null;
    try {
      await saveDocumentNote(documentId, pending);
      queryClient.setQueryData(["document-note", documentId], pending);
      setHasFailed(false);
    } catch {
      setHasFailed(true);
    }
  }, [documentId, queryClient]);

  const handleChange = useCallback(
    (markdown: string) => {
      pendingRef.current = markdown;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => {
      if (pendingRef.current !== null) void flush();
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      if (timerRef.current) clearTimeout(timerRef.current);
      void flush();
    };
  }, [flush]);

  useEffect(() => {
    if (hasFailed) {
      toast.error("We could not save your notes. Check your connection.");
      setHasFailed(false);
    }
  }, [hasFailed]);

  if (noteQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (noteQuery.error) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
        We could not load your notes for this document.
      </div>
    );
  }

  return (
    <NotesEditor
      ref={ref}
      documentId={documentId}
      documentTitle={documentTitle}
      initialMarkdown={noteQuery.data ?? ""}
      onChangeMarkdown={handleChange}
    />
  );
});
