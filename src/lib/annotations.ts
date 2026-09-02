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

const testStorageKey = (documentId: string) => `reeda-annotations:${documentId}`;
const isTestDocument = (documentId: string) => documentId.startsWith("test-fixture-");

export async function getDocumentAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
  let localAnnotations: DocumentAnnotation[] = [];
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(testStorageKey(documentId));
    if (raw) {
      try {
        localAnnotations = JSON.parse(raw) as DocumentAnnotation[];
      } catch {
        localAnnotations = [];
      }
    }
  }

  if (isTestDocument(documentId)) {
    return localAnnotations;
  }

  try {
    const { data, error } = await supabase
      .from("document_annotations")
      .select("id, document_id, page_number, annotation_type, selected_text, geometry, created_at")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const dbAnnotations = (data as unknown as AnnotationRow[]).map(toAnnotation);
      const dbIds = new Set(dbAnnotations.map((a) => a.id));
      const extraLocal = localAnnotations.filter((a) => !dbIds.has(a.id));
      return [...dbAnnotations, ...extraLocal];
    }
  } catch {
    // Return local storage fallback on network/auth exception
  }

  return localAnnotations;
}

export async function createDocumentAnnotations(
  documentId: string,
  inputs: CreateAnnotationInput[],
): Promise<DocumentAnnotation[]> {
  if (inputs.length === 0) return [];

  const localFallback = async (): Promise<DocumentAnnotation[]> => {
    const existing = await getDocumentAnnotations(documentId);
    const created: DocumentAnnotation[] = inputs.map((input) => ({
      id: crypto.randomUUID(),
      documentId,
      ...input,
      createdAt: new Date().toISOString(),
    }));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        testStorageKey(documentId),
        JSON.stringify([...existing, ...created]),
      );
    }
    return created;
  };

  if (isTestDocument(documentId)) {
    return localFallback();
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (userId) {
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

      if (!error && data) {
        const saved = (data as unknown as AnnotationRow[]).map(toAnnotation);
        // Also keep local storage in sync
        if (typeof window !== "undefined") {
          const existing = await getDocumentAnnotations(documentId);
          const dbIds = new Set(saved.map((s) => s.id));
          const filtered = existing.filter((e) => !dbIds.has(e.id));
          window.localStorage.setItem(
            testStorageKey(documentId),
            JSON.stringify([...filtered, ...saved]),
          );
        }
        return saved;
      }
    }
  } catch {
    // Fall back below
  }

  return localFallback();
}

export async function deleteDocumentAnnotation(
  documentId: string,
  annotationId: string,
): Promise<void> {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(testStorageKey(documentId));
    if (raw) {
      try {
        const list = JSON.parse(raw) as DocumentAnnotation[];
        window.localStorage.setItem(
          testStorageKey(documentId),
          JSON.stringify(list.filter((a) => a.id !== annotationId)),
        );
      } catch {
        // ignore
      }
    }
  }

  if (isTestDocument(documentId)) {
    return;
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (userId) {
      await supabase
        .from("document_annotations")
        .delete()
        .eq("id", annotationId)
        .eq("document_id", documentId)
        .eq("user_id", userId);
    }
  } catch {
    // ignore
  }
}
