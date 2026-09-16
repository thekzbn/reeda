/*
 * Reeda Plugin Host Runtime (powered by patch.md)
 * Manages plugin directory state, enable/disable toggles, slot dispatching,
 * capability isolation, and user verification.
 */

import type {
  ReedaPluginManifest,
  ReedaSlotId,
  PluginLifecycleStatus,
} from './types';

const STORAGE_KEY = 'reeda_plugin_directory_v2';
const ENABLED_STATE_KEY = 'reeda_plugin_enabled_states_v2';

const DEFAULT_PLUGINS: ReedaPluginManifest[] = [
  {
    id: 'plugin-reading-time',
    name: 'Reading Time Estimator',
    description: 'Calculates estimated minutes remaining based on current page progress and average reading pace.',
    category: 'reader',
    author: 'Reeda Lab',
    version: '1.2.0',
    enabled: true,
    canonical_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    status: 'active_verified',
    target_service: 'reeda_reader',
    target_scope: 'reading_metrics',
    created_at: '2026-09-12T10:00:00Z',
    touches: ['src/components/reader/ReaderHeader.tsx'],
    resource_locks: {
      slot_id: 'slot_reader_toolbar_actions',
      state_key: 'reader.metrics.reading_time',
    },
    capabilities: ['storage:local'],
    semantic_contracts: {
      currency: 'USD_CENTS',
      timestamp: 'ISO_8601',
    },
    wasm_binary: {
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      url: 'https://cdn.patch.md/binaries/plugin_reading_time.wasm',
    },
    intent_declaration: [
      'Calculate estimated reading time remaining for current PDF document',
      'Display subtle typography indicator in the reader header bar',
    ],
    invariant_satisfaction: [
      'Satisfies Host Contract: `ReedaReaderToolbarSuite_v1`',
      'Passed Invariant Assertions: 3/3 (Host Structural Safety Confirmed)',
      'Functional Verification: Approved by user at 2026-09-12T14:20:00Z',
    ],
    ui_component_name: 'ReadingTimeCalculatorWidget',
  },
  {
    id: 'plugin-citation-formatter',
    name: 'Academic Citation Formatter',
    description: 'Generates formatted APA, BibTeX, Chicago, and MLA citation blocks directly into your notes.',
    category: 'notes',
    author: 'Reeda Lab',
    version: '1.1.0',
    enabled: true,
    canonical_hash: 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1',
    status: 'active_verified',
    target_service: 'reeda_notes',
    target_scope: 'citation_generation',
    created_at: '2026-09-16T11:00:00Z',
    touches: ['src/components/reader/NotesEditor.tsx'],
    resource_locks: {
      slot_id: 'slot_notes_pane_header_actions',
      state_key: 'notes.citation.active',
    },
    capabilities: ['storage:local', 'export:markdown'],
    semantic_contracts: {
      currency: 'USD_CENTS',
      timestamp: 'ISO_8601',
    },
    wasm_binary: {
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      url: 'https://cdn.patch.md/binaries/plugin_citation_formatter.wasm',
    },
    intent_declaration: [
      'Format document title and page reference into APA, BibTeX, Chicago, or MLA citation',
      'Insert formatted markdown directly into active Tiptap editor cursor position',
    ],
    invariant_satisfaction: [
      'Satisfies Host Contract: `ReedaNotesPaneSuite_v1`',
      'Passed Invariant Assertions: 2/2 (Host Structural Safety Confirmed)',
      'Functional Verification: Approved by user at 2026-09-16T15:00:00Z',
    ],
    ui_component_name: 'CitationFormatterWidget',
  },
  {
    id: 'plugin-library-tags',
    name: 'Library Reading Priority Filters',
    description: 'Categorize and filter your library documents by reading status (To Read, In Progress, Synthesized).',
    category: 'library',
    author: 'Reeda Lab',
    version: '1.0.0',
    enabled: true,
    canonical_hash: 'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2',
    status: 'active_verified',
    target_service: 'reeda_library',
    target_scope: 'document_metadata',
    created_at: '2026-09-16T14:30:00Z',
    touches: ['src/routes/_authenticated/index.tsx'],
    resource_locks: {
      slot_id: 'slot_library_header_actions',
      state_key: 'library.filter.tags',
    },
    capabilities: ['storage:local'],
    semantic_contracts: {
      currency: 'USD_CENTS',
      timestamp: 'ISO_8601',
    },
    wasm_binary: {
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      url: 'https://cdn.patch.md/binaries/plugin_library_tags.wasm',
    },
    intent_declaration: [
      'Provide subtle text-based tag filters above library documents',
      'Filter documents by status in local storage without network requests',
    ],
    invariant_satisfaction: [
      'Satisfies Host Contract: `ReedaLibrarySuite_v1`',
      'Passed Invariant Assertions: 2/2 (Host Structural Safety Confirmed)',
      'Functional Verification: Approved by user at 2026-09-16T15:00:00Z',
    ],
    ui_component_name: 'LibraryTagsWidget',
  },
];

class PluginHostStore {
  private plugins: ReedaPluginManifest[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === 'undefined') {
      this.plugins = DEFAULT_PLUGINS;
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.plugins = JSON.parse(stored);
      } else {
        this.plugins = DEFAULT_PLUGINS;
        this.save();
      }
    } catch {
      this.plugins = DEFAULT_PLUGINS;
    }
  }

  private save(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.plugins));
      } catch {
        // storage quota
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getAll(): ReedaPluginManifest[] {
    return [...this.plugins];
  }

  public getBySlot(slotId: ReedaSlotId): ReedaPluginManifest[] {
    return this.plugins.filter(
      p =>
        p.enabled &&
        p.resource_locks.slot_id === slotId &&
        (p.status === 'active_verified' || p.status === 'active_unverified_user')
    );
  }

  public getById(pluginId: string): ReedaPluginManifest | undefined {
    return this.plugins.find(p => p.id === pluginId);
  }

  public setEnabled(pluginId: string, enabled: boolean): void {
    const plugin = this.getById(pluginId);
    if (!plugin) return;
    plugin.enabled = enabled;
    this.save();
  }

  public registerPlugin(plugin: ReedaPluginManifest): void {
    const idx = this.plugins.findIndex(p => p.id === plugin.id);
    if (idx >= 0) {
      this.plugins[idx] = plugin;
    } else {
      this.plugins.unshift(plugin);
    }
    this.save();
  }

  public removePlugin(pluginId: string): void {
    this.plugins = this.plugins.filter(p => p.id !== pluginId);
    this.save();
  }

  public approvePlugin(pluginId: string, userId = 'current_reader'): boolean {
    const plugin = this.getById(pluginId);
    if (!plugin || plugin.status !== 'active_unverified_user') return false;

    plugin.status = 'active_verified';
    plugin.invariant_satisfaction = plugin.invariant_satisfaction.filter(
      l => !l.startsWith('Functional Verification:')
    );
    plugin.invariant_satisfaction.push(
      `Functional Verification: Approved by ${userId} at ${new Date().toISOString()}`
    );
    this.save();
    return true;
  }
}

export const pluginHost = new PluginHostStore();
export const patchHost = pluginHost; // backward-compat alias
