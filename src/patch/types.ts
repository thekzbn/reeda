/*
 * patch.md integration for Reeda
 * Types and schema definitions for the patch.md runtime inside Reeda.
 */

export type PatchLifecycleStatus =
  | 'draft'
  | 'active_unverified_user'
  | 'active_verified'
  | 'stale_pending_verification'
  | 'recompiling_on_demand'
  | 'degraded_paused';

export type ReedaSlotId =
  | 'slot_library_header_actions'
  | 'slot_reader_toolbar_actions'
  | 'slot_notes_pane_header_actions'
  | 'slot_annotation_quick_actions'
  | 'slot_settings_integrations';

export interface PatchResourceLocks {
  slot_id: ReedaSlotId;
  state_key: string;
}

export interface PatchCapability {
  resource: string;
  action: 'read' | 'write' | 'execute';
  description: string;
}

export interface ReedaPatchManifest {
  patch_id: string;
  title: string;
  description: string;
  author: string;
  version: string;
  canonical_hash: string;
  status: PatchLifecycleStatus;
  target_service: 'reeda_reader' | 'reeda_notes' | 'reeda_library' | 'external_export';
  target_scope: string;
  created_at: string;
  touches: string[];
  resource_locks: PatchResourceLocks;
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
  // Executable UI/logic code representation for browser sandbox
  ui_component_name: string;
}

export interface PatchExecutionContext {
  documentId?: string;
  documentTitle?: string;
  currentPage?: number;
  totalPages?: number;
  selectedText?: string;
  notesContent?: string;
  onInsertNote?: (text: string) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}
