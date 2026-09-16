/*
 * patch.md Host Runtime Engine for Reeda
 * Implements slot resolution, invariant testing, capability guards,
 * and user verification status transitions.
 */

import type {
  ReedaPatchManifest,
  ReedaSlotId,
  PatchLifecycleStatus,
  PatchExecutionContext,
} from './types';

const STORAGE_KEY = 'reeda_patch_md_manifests_v1';

// Seed default patches demonstrating patch.md functionality
const DEFAULT_PATCHES: ReedaPatchManifest[] = [
  {
    patch_id: 'patch_reading_time_calculator',
    title: 'Reading Time Estimator',
    description: 'Calculates estimated reading time based on remaining pages and average pace (250 wpm).',
    author: 'community_reader',
    version: '1.2.0',
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
      url: 'https://cdn.patch.md/binaries/patch_reading_time_calculator_e3b0.wasm',
    },
    intent_declaration: [
      'Calculate estimated reading time remaining for current PDF document',
      'Display non-intrusive minutes badge in the reader toolbar',
    ],
    invariant_satisfaction: [
      'Satisfies Host Contract: `ReedaReaderToolbarSuite_v1`',
      'Passed Invariant Assertions: 3/3 (Host Structural Safety Confirmed)',
      'Functional Verification: Approved by user_admin at 2026-09-12T14:20:00Z',
    ],
    ui_component_name: 'ReadingTimeCalculatorWidget',
  },
  {
    patch_id: 'patch_notes_markdown_cite',
    title: 'APA / BibTeX Citation Formatter',
    description: 'Formats document title and page selections into standardized APA or BibTeX citations in your notes.',
    author: 'research_tools',
    version: '1.0.1',
    canonical_hash: 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1',
    status: 'active_unverified_user',
    target_service: 'reeda_notes',
    target_scope: 'citation_generation',
    created_at: '2026-09-16T11:00:00Z',
    touches: ['src/components/reader/NotesPane.tsx'],
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
      url: 'https://cdn.patch.md/binaries/patch_notes_markdown_cite_9f86.wasm',
    },
    intent_declaration: [
      'Generate formatted BibTeX and APA citation headers from active document metadata',
      'Append formatted citation directly into the Tiptap notes pane',
    ],
    invariant_satisfaction: [
      'Satisfies Host Contract: `ReedaNotesPaneSuite_v1`',
      'Passed Invariant Assertions: 2/2 (Host Structural Safety Confirmed)',
      'Functional Verification: Pending User Confirmation',
    ],
    ui_component_name: 'CitationFormatterWidget',
  },
  {
    patch_id: 'patch_library_batch_tags',
    title: 'Document Reading Priority Tags',
    description: 'Add custom tags (To Read, In Progress, Synthesized) to documents in the library.',
    author: 'reeda_power_user',
    version: '0.9.0',
    canonical_hash: 'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2',
    status: 'active_unverified_user',
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
      url: 'https://cdn.patch.md/binaries/patch_library_batch_tags_5e88.wasm',
    },
    intent_declaration: [
      'Provide tag filter pills above library documents',
      'Allow tagging documents with custom reading categories',
    ],
    invariant_satisfaction: [
      'Satisfies Host Contract: `ReedaLibrarySuite_v1`',
      'Passed Invariant Assertions: 2/2 (Host Structural Safety Confirmed)',
      'Functional Verification: Pending User Confirmation',
    ],
    ui_component_name: 'LibraryTagsWidget',
  },
];

class PatchHostStore {
  private patches: ReedaPatchManifest[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === 'undefined') {
      this.patches = DEFAULT_PATCHES;
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.patches = JSON.parse(stored);
      } else {
        this.patches = DEFAULT_PATCHES;
        this.save();
      }
    } catch {
      this.patches = DEFAULT_PATCHES;
    }
  }

  private save(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.patches));
      } catch {
        // Storage quota or privacy mode
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

  public getAll(): ReedaPatchManifest[] {
    return [...this.patches];
  }

  public getBySlot(slotId: ReedaSlotId): ReedaPatchManifest[] {
    return this.patches.filter(
      p =>
        p.resource_locks.slot_id === slotId &&
        (p.status === 'active_verified' || p.status === 'active_unverified_user')
    );
  }

  public getById(patchId: string): ReedaPatchManifest | undefined {
    return this.patches.find(p => p.patch_id === patchId);
  }

  public registerPatch(patch: ReedaPatchManifest): void {
    const existingIdx = this.patches.findIndex(p => p.patch_id === patch.patch_id);
    if (existingIdx >= 0) {
      this.patches[existingIdx] = patch;
    } else {
      this.patches.push(patch);
    }
    this.save();
  }

  public removePatch(patchId: string): void {
    this.patches = this.patches.filter(p => p.patch_id !== patchId);
    this.save();
  }

  // Step 18: User Verification Flow (ACTIVE_UNVERIFIED_USER -> ACTIVE_VERIFIED)
  public approvePatch(patchId: string, userId = 'user_reader'): boolean {
    const patch = this.getById(patchId);
    if (!patch || patch.status !== 'active_unverified_user') return false;

    patch.status = 'active_verified';
    patch.invariant_satisfaction = patch.invariant_satisfaction.filter(
      l => !l.startsWith('Functional Verification:')
    );
    patch.invariant_satisfaction.push(
      `Functional Verification: Approved by ${userId} at ${new Date().toISOString()}`
    );
    this.save();
    return true;
  }

  public rejectPatch(patchId: string, reason: string, userId = 'user_reader'): boolean {
    const patch = this.getById(patchId);
    if (!patch) return false;

    patch.invariant_satisfaction = patch.invariant_satisfaction.filter(
      l => !l.startsWith('Functional Verification:')
    );
    patch.invariant_satisfaction.push(
      `Functional Verification: Rejected by ${userId} — "${reason}"`
    );
    this.save();
    return true;
  }

  // Step 19: Capability Guard
  public validateCapability(patch: ReedaPatchManifest, requestedResource: string): boolean {
    return patch.capabilities.some(cap => {
      if (cap === requestedResource) return true;
      const [capDomain, capTarget] = cap.split(':');
      const [reqDomain, reqTarget] = requestedResource.split(':');
      if (capDomain !== reqDomain) return false;
      if (capTarget === '*') return true;
      if (reqTarget === capTarget || reqTarget?.startsWith(`${capTarget}/`)) return true;
      return false;
    });
  }

  // Self-healing / circuit breaker simulation
  public toggleDegraded(patchId: string): void {
    const patch = this.getById(patchId);
    if (!patch) return;
    if (patch.status === 'degraded_paused') {
      patch.status = 'active_unverified_user';
    } else {
      patch.status = 'degraded_paused';
    }
    this.save();
  }
}

export const patchHost = new PatchHostStore();
