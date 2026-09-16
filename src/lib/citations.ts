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

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type SourceType =
  | "journal_article"
  | "book"
  | "website"
  | "report"
  | "video"
  | "pdf"
  | "other";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  journal_article: "Journal article",
  book: "Book",
  website: "Website",
  report: "Report",
  video: "Video",
  pdf: "PDF",
  other: "Other",
};

export interface CitationAuthor {
  first_name: string;
  last_name: string;
}

export interface CitationData {
  source_type: SourceType;
  title: string;
  authors: CitationAuthor[];
  publication_year: number | null;
  publisher_or_journal: string;
  doi_or_url: string;
  volume: string;
  issue: string;
  pages: string;
  accessed_date: string | null;
}

export interface CitationEntry extends CitationData {
  id: string;
  citation_key: string;
  origin: "document" | "reference";
}

export class CitationError extends Error {}

export function emptyCitation(partial: Partial<CitationData> = {}): CitationData {
  return {
    source_type: "other",
    title: "",
    authors: [],
    publication_year: null,
    publisher_or_journal: "",
    doi_or_url: "",
    volume: "",
    issue: "",
    pages: "",
    accessed_date: null,
    ...partial,
  };
}

function normalise(raw: Partial<CitationData> | null | undefined): CitationData {
  const value = raw ?? {};
  const authors = Array.isArray(value.authors) ? value.authors : [];
  return emptyCitation({
    source_type: (value.source_type ?? "other") as SourceType,
    title: value.title ?? "",
    authors: authors.map((a) => ({
      first_name: String(a?.first_name ?? ""),
      last_name: String(a?.last_name ?? ""),
    })),
    publication_year:
      typeof value.publication_year === "number" ? value.publication_year : null,
    publisher_or_journal: value.publisher_or_journal ?? "",
    doi_or_url: value.doi_or_url ?? "",
    volume: value.volume ?? "",
    issue: value.issue ?? "",
    pages: value.pages ?? "",
    accessed_date: value.accessed_date ?? null,
  });
}

/** A short, stable handle such as `smith2024` used to track a source inside notes. */
export function makeCitationKey(data: CitationData, taken: string[] = []): string {
  const first = data.authors[0];
  const base =
    (first?.last_name || first?.first_name || data.title || "source")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16) || "source";
  const year = data.publication_year ? String(data.publication_year) : "nd";
  let key = `${base}${year}`;
  let suffix = 1;
  while (taken.includes(key)) {
    key = `${base}${year}${String.fromCharCode(96 + suffix)}`;
    suffix += 1;
  }
  return key;
}

const isTestDocument = (documentId: string) => documentId.startsWith("test-fixture-");
const localKey = (documentId: string) => `reeda-citations:${documentId}`;

interface LocalStore {
  document: (CitationData & { citation_key: string }) | null;
  references: Array<CitationData & { id: string; citation_key: string }>;
}

function readLocal(documentId: string): LocalStore {
  if (typeof window === "undefined") return { document: null, references: [] };
  try {
    const raw = window.localStorage.getItem(localKey(documentId));
    if (!raw) return { document: null, references: [] };
    return JSON.parse(raw) as LocalStore;
  } catch {
    return { document: null, references: [] };
  }
}

function writeLocal(documentId: string, store: LocalStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localKey(documentId), JSON.stringify(store));
  } catch {
    // Storage unavailable; keep working without persistence.
  }
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new CitationError("Your session has expired. Please sign in again.");
  return data.user.id;
}

/** The source details of the PDF that is currently open, or null when none are stored yet. */
export async function getDocumentCitation(documentId: string): Promise<CitationEntry | null> {
  if (isTestDocument(documentId)) {
    const stored = readLocal(documentId).document;
    if (!stored) return null;
    return { ...normalise(stored), id: "local-document", citation_key: stored.citation_key, origin: "document" };
  }

  const { data, error } = await supabase
    .from("document_citations")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle();

  if (error) throw new CitationError("We could not load the source details for this document.");
  if (!data) return null;

  return {
    ...normalise(data as unknown as Partial<CitationData>),
    id: data.id,
    citation_key: data.citation_key || "source",
    origin: "document",
  };
}

export async function saveDocumentCitation(
  documentId: string,
  data: CitationData,
  citationKey?: string,
): Promise<CitationEntry> {
  const clean = normalise(data);
  const key = citationKey || makeCitationKey(clean);

  if (isTestDocument(documentId)) {
    const store = readLocal(documentId);
    store.document = { ...clean, citation_key: key };
    writeLocal(documentId, store);
    return { ...clean, id: "local-document", citation_key: key, origin: "document" };
  }

  const userId = await requireUserId();
  const { data: row, error } = await supabase
    .from("document_citations")
    .upsert(
      {
        document_id: documentId,
        user_id: userId,
        source_type: clean.source_type,
        title: clean.title,
        authors: clean.authors as unknown as Json,
        publication_year: clean.publication_year,
        publisher_or_journal: clean.publisher_or_journal,
        doi_or_url: clean.doi_or_url,
        volume: clean.volume,
        issue: clean.issue,
        pages: clean.pages,
        accessed_date: clean.accessed_date,
        citation_key: key,
      },
      { onConflict: "document_id" },
    )
    .select("*")
    .single();

  if (error || !row) throw new CitationError("We could not save those source details.");
  return { ...clean, id: row.id, citation_key: row.citation_key || key, origin: "document" };
}

/** Extra sources the reader wants to cite alongside the open PDF. */
export async function listNoteReferences(documentId: string): Promise<CitationEntry[]> {
  if (isTestDocument(documentId)) {
    return readLocal(documentId).references.map((item) => ({
      ...normalise(item),
      id: item.id,
      citation_key: item.citation_key,
      origin: "reference" as const,
    }));
  }

  const { data, error } = await supabase
    .from("note_references")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) throw new CitationError("We could not load your references.");
  return (data ?? []).map((row) => ({
    ...normalise(row.reference_data as unknown as Partial<CitationData>),
    id: row.id,
    citation_key: row.citation_key || "source",
    origin: "reference" as const,
  }));
}

export async function addNoteReference(
  documentId: string,
  data: CitationData,
  takenKeys: string[],
): Promise<CitationEntry> {
  const clean = normalise(data);
  const key = makeCitationKey(clean, takenKeys);

  if (isTestDocument(documentId)) {
    const store = readLocal(documentId);
    const entry = { ...clean, id: `local-${Date.now()}`, citation_key: key };
    store.references.push(entry);
    writeLocal(documentId, store);
    return { ...clean, id: entry.id, citation_key: key, origin: "reference" };
  }

  const userId = await requireUserId();
  const { data: row, error } = await supabase
    .from("note_references")
    .insert({
      document_id: documentId,
      user_id: userId,
      citation_key: key,
      reference_data: clean as unknown as Json,
    })
    .select("*")
    .single();

  if (error || !row) throw new CitationError("We could not add that reference.");
  return { ...clean, id: row.id, citation_key: key, origin: "reference" };
}

export async function updateNoteReference(
  documentId: string,
  id: string,
  data: CitationData,
): Promise<void> {
  const clean = normalise(data);

  if (isTestDocument(documentId)) {
    const store = readLocal(documentId);
    store.references = store.references.map((item) =>
      item.id === id ? { ...item, ...clean } : item,
    );
    writeLocal(documentId, store);
    return;
  }

  const { error } = await supabase
    .from("note_references")
    .update({ reference_data: clean as unknown as Json })
    .eq("id", id);

  if (error) throw new CitationError("We could not update that reference.");
}

export async function deleteNoteReference(documentId: string, id: string): Promise<void> {
  if (isTestDocument(documentId)) {
    const store = readLocal(documentId);
    store.references = store.references.filter((item) => item.id !== id);
    writeLocal(documentId, store);
    return;
  }

  const { error } = await supabase.from("note_references").delete().eq("id", id);
  if (error) throw new CitationError("We could not remove that reference.");
}
