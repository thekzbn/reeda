import { supabase } from "@/integrations/supabase/client";
import type {
  AnnotationGeometry,
  AnnotationType,
  DocumentAnnotation,
} from "@/components/reader/types";
import type { Json } from "@/integrations/supabase/types";

export class AnnotationError extends Error {}

interface AnnotationRow {
  id: string;
  document_id: string;
  page_number: number;
  annotation_type: AnnotationType;
  selected_text: string;
  geometry: AnnotationGeometry;
  created_at: string;
}

export interface CreateAnnotationInput {
  pageNumber: number;
  type: AnnotationType;
  selectedText: string;
  geometry: AnnotationGeometry;
}

function toAnnotation(row: AnnotationRow): DocumentAnnotation {
  return {
    id: row.id,
    documentId: row.document_id,
    pageNumber: row.page_number,
    type: row.annotation_type,
    selectedText: row.selected_text,
    geometry: row.geometry,
    createdAt: row.created_at,
  };
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    throw new AnnotationError("Your session has expired. Please sign in again.");
  return data.user.id;
}

const testStorageKey = (documentId: string) => `reeda-test-annotations:${documentId}`;
const isTestDocument = (documentId: string) => documentId.startsWith("test-fixture-");

export async function getDocumentAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
  if (isTestDocument(documentId)) {
    const raw = window.localStorage.getItem(testStorageKey(documentId));
    return raw ? (JSON.parse(raw) as DocumentAnnotation[]) : [];
  }
  const { data, error } = await supabase
    .from("document_annotations")
    .select("id, document_id, page_number, annotation_type, selected_text, geometry, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });
  if (error) throw new AnnotationError("We could not load annotations right now.");
  return ((data ?? []) as unknown as AnnotationRow[]).map(toAnnotation);
}

export async function createDocumentAnnotations(
  documentId: string,
  inputs: CreateAnnotationInput[],
): Promise<DocumentAnnotation[]> {
  if (inputs.length === 0) return [];
  if (isTestDocument(documentId)) {
    const existing = await getDocumentAnnotations(documentId);
    const created = inputs.map((input) => ({
      id: crypto.randomUUID(),
      documentId,
      ...input,
      createdAt: new Date().toISOString(),
    }));
    window.localStorage.setItem(
      testStorageKey(documentId),
      JSON.stringify([...existing, ...created]),
    );
    return created;
  }
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("document_annotations")
    .insert(
      inputs.map((input) => ({
        document_id: documentId,
        user_id: userId,
        page_number: input.pageNumber,
        annotation_type: input.type,
        selected_text: input.selectedText,
        geometry: input.geometry as unknown as Json,
      })),
    )
    .select("id, document_id, page_number, annotation_type, selected_text, geometry, created_at");
  if (error) throw new AnnotationError("We could not save that annotation. Please try again.");
  return ((data ?? []) as unknown as AnnotationRow[]).map(toAnnotation);
}

export async function deleteDocumentAnnotation(
  documentId: string,
  annotationId: string,
): Promise<void> {
  if (isTestDocument(documentId)) {
    const existing = await getDocumentAnnotations(documentId);
    const filtered = existing.filter((a) => a.id !== annotationId);
    window.localStorage.setItem(testStorageKey(documentId), JSON.stringify(filtered));
    return;
  }
  const userId = await requireUserId();
  const { error } = await supabase
    .from("document_annotations")
    .delete()
    .eq("id", annotationId)
    .eq("document_id", documentId)
    .eq("user_id", userId);
  if (error) throw new AnnotationError("We could not delete that annotation. Please try again.");
}
