import { supabase } from "@/integrations/supabase/client";

export interface DocumentNote {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export class NoteError extends Error {}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new NoteError("Your session has expired. Please sign in again.");
  return data.user.id;
}

/** Returns the stored Markdown for a document, or an empty string when none exists yet. */
export async function getDocumentNote(documentId: string): Promise<string> {
  const { data, error } = await supabase
    .from("document_notes")
    .select("content")
    .eq("document_id", documentId)
    .maybeSingle();

  if (error) throw new NoteError("We could not load your notes right now.");
  return data?.content ?? "";
}

/** Creates or updates the Markdown note attached to a document. */
export async function saveDocumentNote(documentId: string, content: string): Promise<void> {
  const userId = await requireUserId();

  const { error } = await supabase
    .from("document_notes")
    .upsert({ document_id: documentId, user_id: userId, content }, { onConflict: "document_id" });

  if (error) throw new NoteError("We could not save your notes right now.");
}
