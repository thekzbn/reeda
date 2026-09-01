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

const DEFAULT_TEST_NOTE = `# Reading Notes: System Design & Architecture

## Key Insights
- Reeda focuses on **calm, distraction-free** document reading and synthesis.
- The interface emphasizes clean typography, independent scroll panes, and high-performance canvas rendering.

### Methodology
1. Read the source PDF in the left pane.
2. Select key quotes or text passages and click **Add to notes**.
3. Synthesize findings in the notes editor on the right.

### Checklist
- [x] Test continuous zoom and fit modes
- [x] Test divider drag resize
- [x] Test live search highlighting
- [ ] Complete synthesis summary
`;

const isTestDocument = (documentId: string) => documentId.startsWith("test-fixture-");
const testNoteKey = (documentId: string) => `reeda-test-note:${documentId}`;

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new NoteError("Your session has expired. Please sign in again.");
  return data.user.id;
}

/** Returns the stored Markdown for a document, or an empty string when none exists yet. */
export async function getDocumentNote(documentId: string): Promise<string> {
  if (isTestDocument(documentId)) {
    if (typeof window !== "undefined") {
      const local = window.localStorage.getItem(testNoteKey(documentId));
      return local !== null ? local : DEFAULT_TEST_NOTE;
    }
    return DEFAULT_TEST_NOTE;
  }

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
  if (isTestDocument(documentId)) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(testNoteKey(documentId), content);
    }
    return;
  }

  const userId = await requireUserId();

  const { error } = await supabase
    .from("document_notes")
    .upsert({ document_id: documentId, user_id: userId, content }, { onConflict: "document_id" });

  if (error) throw new NoteError("We could not save your notes right now.");
}
