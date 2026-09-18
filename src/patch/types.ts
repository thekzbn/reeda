/*
 * Reeda Plugin System (powered by patch.md)
 * Schema definitions for sandboxed extensions, slots, and lifecycle states.
 */

export type PluginLifecycleStatus =
  | "active_verified"
  | "active_unverified_user"
  | "stale_pending_verification"
  | "recompiling_on_demand"
  | "degraded_paused";

export type PatchLifecycleStatus = PluginLifecycleStatus;

export type ReedaSlotId =
  | "slot_library_header_actions"
  | "slot_reader_toolbar_actions"
  | "slot_notes_pane_header_actions"
  | "slot_annotation_quick_actions"
  | "slot_settings_integrations";

export interface PluginResourceLocks {
  slot_id: ReedaSlotId;
  state_key: string;
}

export interface ReedaPluginManifest {
  id: string;
  patch_id?: string;
  name: string;
  title?: string;
  description: string;
  category: "reader" | "notes" | "library" | "utility";
  author: string;
  version: string;
  enabled: boolean;
  canonical_hash: string;
  status: PluginLifecycleStatus;
  target_service: "reeda_reader" | "reeda_notes" | "reeda_library" | "external_export";
  target_scope: string;
  created_at: string;
  touches: string[];
  resource_locks: PluginResourceLocks;
  capabilities: string[];
  semantic_contracts: {
    currency: string;
    timestamp: string;
    [key: string]: string;
  };
  wasm_binary: {
    sha256: string;
    url: string;
  };
  intent_declaration: string[];
  invariant_satisfaction: string[];
  ui_component_name: string;
}

export type ReedaPatchManifest = ReedaPluginManifest;

export interface PluginExecutionContext {
  documentId?: string | undefined;
  documentTitle?: string | undefined;
  currentPage?: number | undefined;
  totalPages?: number | undefined;
  pageWordCounts?: number[] | undefined;
  remainingWords?: number | undefined;
  isPdfVisible?: boolean | undefined;
  detectedIsbn?: string | null | undefined;
  copyrightYear?: string | null | undefined;
  extractedMetadata?:
    | {
        title?: string | undefined;
        author?: string | undefined;
        year?: string | undefined;
        publisher?: string | undefined;
      }
    | null
    | undefined;
  selectedText?: string | undefined;
  notesContent?: string | undefined;
  getNotesMarkdown?: (() => string) | undefined;
  activeTagFilter?: string | null | undefined;
  onSelectTagFilter?: ((tag: string | null) => void) | undefined;
  onInsertNote?: ((text: string) => void) | undefined;
  onToast?: ((message: string, type?: "success" | "info" | "error") => void) | undefined;
}
