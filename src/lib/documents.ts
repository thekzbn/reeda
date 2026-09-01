import { supabase } from "@/integrations/supabase/client";
import { getStorageProvider, defaultStorageProviderId, StorageError } from "@/lib/storage";

export interface DocumentRecord {
  id: string;
  user_id: string;
  title: string;
  file_type: string;
  file_size: number;
  storage_provider: string;
  storage_ref: string;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export const MANAGED_STORAGE_ALLOWANCE_BYTES = 500 * 1024 * 1024;

export class DocumentError extends Error {}

function fail(message: string): never {
  throw new DocumentError(message);
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) fail("Your session has expired. Please sign in again.");
  return data.user.id;
}

export async function listDocuments(search?: string): Promise<DocumentRecord[]> {
  let query = supabase.from("documents").select("*").order("updated_at", { ascending: false });

  const term = search?.trim();
  if (term) query = query.ilike("title", `%${term}%`);

  const { data, error } = await query;
  if (error) fail("We could not load your documents right now.");
  return (data ?? []) as DocumentRecord[];
}

export async function getDocument(id: string): Promise<DocumentRecord> {
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (error) fail("We could not open that document right now.");
  if (!data) fail("That document is not available.");
  return data as DocumentRecord;
}

export async function uploadDocument(file: File): Promise<DocumentRecord> {
  const userId = await requireUserId();

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) fail("Only PDF files can be added to your library.");
  if (file.size === 0) fail("That file appears to be empty.");

  const storage = getStorageProvider(defaultStorageProviderId);

  const used = await storage.usedBytes(userId);
  if (used + file.size > MANAGED_STORAGE_ALLOWANCE_BYTES) {
    fail("This file would exceed your 500 MB of Reeda storage.");
  }

  let stored;
  try {
    stored = await storage.upload({ file, ownerId: userId });
  } catch (error) {
    fail(error instanceof StorageError ? error.message : "We could not upload that file.");
  }

  const title = file.name.replace(/\.pdf$/i, "").trim() || "Untitled document";
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      title,
      file_type: stored.contentType,
      file_size: stored.size,
      storage_provider: storage.id,
      storage_ref: stored.storageRef,
    })
    .select("*")
    .single();

  if (error || !data) {
    await storage.remove(stored.storageRef).catch(() => undefined);
    fail("We saved the file but could not add it to your library. Please try again.");
  }

  return data as DocumentRecord;
}

export async function renameDocument(id: string, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) fail("Please enter a title.");
  const { error } = await supabase.from("documents").update({ title: trimmed }).eq("id", id);
  if (error) fail("We could not rename that document.");
}

export async function deleteDocument(doc: DocumentRecord): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) fail("We could not delete that document.");
  try {
    await getStorageProvider(doc.storage_provider as "reeda").remove(doc.storage_ref);
  } catch {
    // The record is gone; a leftover file is cleaned up separately.
  }
}

export async function markDocumentOpened(id: string): Promise<void> {
  await supabase
    .from("documents")
    .update({ last_opened_at: new Date().toISOString() })
    .eq("id", id);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
