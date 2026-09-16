/*
 * Reeda Plugin System (powered by patch.md)
 * Schema definitions for sandboxed extensions, slots, and lifecycle states.
 */

export type PluginLifecycleStatus =
  | 'active_verified'
  | 'active_unverified_user'
  | 'stale_pending_verification'
  | 'recompiling_on_demand'
  | 'degraded_paused';

export type ReedaSlotId =
  | 'slot_library_header_actions'
  | 'slot_reader_toolbar_actions'
  | 'slot_notes_pane_header_actions'
  | 'slot_annotation_quick_actions'
  | 'slot_settings_integrations';

export interface PluginResourceLocks {
  slot_id: ReedaSlotId;
  state_key: string;
}

export interface ReedaPluginManifest {
  id: string;
  name: string;
  description: string;
  category: 'reader' | 'notes' | 'library' | 'utility';
  author: string;
  version: string;
  enabled: boolean;
  canonical_hash: string;
  status: PluginLifecycleStatus;
  target_service: 'reeda_reader' | 'reeda_notes' | 'reeda_library' | 'external_export';
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

export interface PluginExecutionContext {
  documentId?: string;
  documentTitle?: string;
  currentPage?: number;
  totalPages?: number;
  selectedText?: string;
  notesContent?: string;
  activeTagFilter?: string | null;
  onSelectTagFilter?: (tag: string | null) => void;
  onInsertNote?: (text: string) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}
