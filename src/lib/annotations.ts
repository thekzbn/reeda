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
const pendingCreationsKey = (documentId: string) => `reeda-pending-annotations:${documentId}`;
const pendingDeletionsKey = (documentId: string) => `reeda-pending-deletions:${documentId}`;
const isTestDocument = (documentId: string) => documentId.startsWith("test-fixture-");

function readLocal(documentId: string): DocumentAnnotation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(testStorageKey(documentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DocumentAnnotation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(documentId: string, list: DocumentAnnotation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(testStorageKey(documentId), JSON.stringify(list));
  } catch {
    // Storage can be unavailable (private mode, sandboxed frames). Ignore.
  }
}

function readPendingCreations(documentId: string): CreateAnnotationInput[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(pendingCreationsKey(documentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CreateAnnotationInput[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingCreations(documentId: string, list: CreateAnnotationInput[]): void {
  if (typeof window === "undefined") return;
  try {
    if (list.length === 0) {
      window.localStorage.removeItem(pendingCreationsKey(documentId));
    } else {
      window.localStorage.setItem(pendingCreationsKey(documentId), JSON.stringify(list));
    }
  } catch {
    // Storage can be unavailable. Ignore.
  }
}

function readPendingDeletions(documentId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(pendingDeletionsKey(documentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingDeletions(documentId: string, list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    if (list.length === 0) {
      window.localStorage.removeItem(pendingDeletionsKey(documentId));
    } else {
      window.localStorage.setItem(pendingDeletionsKey(documentId), JSON.stringify(list));
    }
  } catch {
    // Storage can be unavailable. Ignore.
  }
}

export async function syncPendingAnnotations(documentId: string): Promise<void> {
  if (isTestDocument(documentId) || typeof window === "undefined") return;

  const pendingCreations = readPendingCreations(documentId);
  const pendingDeletions = readPendingDeletions(documentId);

  if (pendingCreations.length === 0 && pendingDeletions.length === 0) return;

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    if (pendingDeletions.length > 0) {
      const { error: delError } = await supabase
        .from("document_annotations")
        .delete()
        .in("id", pendingDeletions)
        .eq("document_id", documentId)
        .eq("user_id", userId);

      if (!delError) {
        writePendingDeletions(documentId, []);
      }
    }

    if (pendingCreations.length > 0) {
      const { error: insError } = await supabase
        .from("document_annotations")
        .insert(
          pendingCreations.map((input) => ({
            document_id: documentId,
            user_id: userId,
            page_number: input.pageNumber,
            annotation_type: input.type,
            selected_text: input.selectedText,
            geometry: input.geometry as unknown as Json,
          })),
        );

      if (!insError) {
        writePendingCreations(documentId, []);
      }
    }
  } catch {
    // Still offline or unauthenticated; leave pending items in storage
  }
}

export async function getDocumentAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
  const localAnnotations: DocumentAnnotation[] = readLocal(documentId);

  if (isTestDocument(documentId)) {
    return localAnnotations;
  }

  try {
    await syncPendingAnnotations(documentId);

    const { data, error } = await supabase
      .from("document_annotations")
      .select("id, document_id, page_number, annotation_type, selected_text, geometry, created_at")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const dbAnnotations = (data as unknown as AnnotationRow[]).map(toAnnotation);
      writeLocal(documentId, dbAnnotations);
      return dbAnnotations;
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

  const localFallback = (): DocumentAnnotation[] => {
    const existing = readLocal(documentId);
    const created: DocumentAnnotation[] = inputs.map((input) => ({
      id: crypto.randomUUID(),
      documentId,
      ...input,
      createdAt: new Date().toISOString(),
    }));
    writeLocal(documentId, [...existing, ...created]);

    if (!isTestDocument(documentId)) {
      const pending = readPendingCreations(documentId);
      writePendingCreations(documentId, [...pending, ...inputs]);
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
        .select(
          "id, document_id, page_number, annotation_type, selected_text, geometry, created_at",
        );

      if (!error && data) {
        const saved = (data as unknown as AnnotationRow[]).map(toAnnotation);
        const existing = readLocal(documentId);
        const dbIds = new Set(saved.map((s) => s.id));
        const filtered = existing.filter((e) => !dbIds.has(e.id));
        writeLocal(documentId, [...filtered, ...saved]);

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
  groupId?: string | undefined,
): Promise<string[]> {
  const local = readLocal(documentId);
  const targetAnnotation = local.find((a) => a.id === annotationId);
  const effectiveGroupId = groupId || targetAnnotation?.geometry?.groupId;

  const targetIds = local
    .filter(
      (a) =>
        a.id === annotationId ||
        (effectiveGroupId !== undefined && a.geometry?.groupId === effectiveGroupId),
    )
    .map((a) => a.id);

  const deletedSet = new Set(targetIds.length > 0 ? targetIds : [annotationId]);
  const deletedArray = Array.from(deletedSet);
  writeLocal(
    documentId,
    local.filter((a) => !deletedSet.has(a.id)),
  );

  if (isTestDocument(documentId)) {
    return deletedArray;
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (userId) {
      const { error } = await supabase
        .from("document_annotations")
        .delete()
        .in("id", deletedArray)
        .eq("document_id", documentId)
        .eq("user_id", userId);

      if (error) {
        const pending = readPendingDeletions(documentId);
        writePendingDeletions(documentId, [...pending, ...deletedArray]);
      }
    } else {
      const pending = readPendingDeletions(documentId);
      writePendingDeletions(documentId, [...pending, ...deletedArray]);
    }
  } catch {
    const pending = readPendingDeletions(documentId);
    writePendingDeletions(documentId, [...pending, ...deletedArray]);
  }

  return deletedArray;
}
