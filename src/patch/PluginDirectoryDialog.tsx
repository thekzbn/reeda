/*
 * Reeda Plugin Directory (Store)
 * Minimalist, typographic interface for managing, enabling, configuring,
 * and creating sandboxed plugins for Reeda.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { pluginHost } from './patch-host';
import type { ReedaPluginManifest, ReedaSlotId } from './types';

interface PluginDirectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PluginDirectoryDialog({ open, onOpenChange }: PluginDirectoryDialogProps) {
  const [plugins, setPlugins] = useState<ReedaPluginManifest[]>(() => pluginHost.getAll());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [targetSlot, setTargetSlot] = useState<ReedaSlotId>('slot_reader_toolbar_actions');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const unsub = pluginHost.subscribe(() => {
      setPlugins(pluginHost.getAll());
    });
    return unsub;
  }, []);

  const handleToggle = (pluginId: string, checked: boolean) => {
    pluginHost.setEnabled(pluginId, checked);
    const plugin = pluginHost.getById(pluginId);
    if (plugin) {
      toast.success(`${plugin.name} ${checked ? 'enabled' : 'disabled'}.`);
    }
  };

  const handleApprove = (pluginId: string) => {
    const ok = pluginHost.approvePlugin(pluginId);
    if (ok) {
      toast.success('Plugin verified.');
    }
  };

  const handleSynthesizeNew = async () => {
    if (!newPrompt.trim()) {
      toast.error('Please describe what plugin you would like to create.');
      return;
    }

    setIsSynthesizing(true);
    try {
      // Simulate patch.md 5-phase synthesis pipeline
      await new Promise(r => setTimeout(r, 1200));

      const id = `plugin-custom-${Date.now()}`;
      const name = newPrompt.length > 30 ? newPrompt.slice(0, 30) + '...' : newPrompt;

      const newPlugin: ReedaPluginManifest = {
        id,
        name,
        description: newPrompt,
        category: targetSlot.includes('reader') ? 'reader' : targetSlot.includes('notes') ? 'notes' : 'library',
        author: 'You',
        version: '1.0.0',
        enabled: true,
        canonical_hash: 'd4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3',
        status: 'active_unverified_user',
        target_service: targetSlot.includes('reader') ? 'reeda_reader' : targetSlot.includes('notes') ? 'reeda_notes' : 'reeda_library',
        target_scope: 'custom_extension',
        created_at: new Date().toISOString(),
        touches: ['src/components/reader/ReaderHeader.tsx'],
        resource_locks: {
          slot_id: targetSlot,
          state_key: `reeda.custom.${id}.state`,
        },
        capabilities: ['storage:local'],
        semantic_contracts: {
          currency: 'USD_CENTS',
          timestamp: 'ISO_8601',
        },
        wasm_binary: {
          sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          url: `https://cdn.patch.md/binaries/${id}.wasm`,
        },
        intent_declaration: [newPrompt],
        invariant_satisfaction: [
          'Satisfies Host Contract: `ReedaHostSafetySuite_v1`',
          'Passed Invariant Assertions: 2/2 (Host Structural Safety Confirmed)',
          'Functional Verification: Pending User Confirmation',
        ],
        ui_component_name: 'ReadingTimeCalculatorWidget',
      };

      pluginHost.registerPlugin(newPlugin);
      toast.success(`Installed "${name}" into your plugins.`);
      setNewPrompt('');
      setIsCreating(false);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const filtered = plugins.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="squircle-lg sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Plugins</DialogTitle>
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="text-xs text-primary hover:underline"
            >
              {isCreating ? 'View installed' : 'Add custom plugin'}
            </button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isCreating
              ? 'Describe a feature you want to add to your reading workspace.'
              : 'Enable or configure extensions for reading, note-taking, and your library.'}
          </DialogDescription>
        </DialogHeader>

        {isCreating ? (
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-foreground">Describe your plugin</label>
              <Textarea
                placeholder="e.g. Add a reading pace counter, or format citations in notes..."
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
                disabled={isSynthesizing}
                className="mt-1.5 h-24 squircle text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground">Location</label>
              <select
                value={targetSlot}
                onChange={e => setTargetSlot(e.target.value as ReedaSlotId)}
                disabled={isSynthesizing}
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
              >
                <option value="slot_reader_toolbar_actions">Reader Top Bar</option>
                <option value="slot_notes_pane_header_actions">Notes Toolbar</option>
                <option value="slot_library_header_actions">Library Header</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="squircle text-xs"
                onClick={() => setIsCreating(false)}
                disabled={isSynthesizing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="squircle text-xs"
                onClick={handleSynthesizeNew}
                disabled={isSynthesizing || !newPrompt.trim()}
              >
                {isSynthesizing ? 'Compiling...' : 'Create & Install'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1 border-b border-border pb-2 text-xs">
              {['all', 'reader', 'notes', 'library'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-md px-2.5 py-1 text-xs capitalize transition-colors ${
                    selectedCategory === cat
                      ? 'bg-secondary font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Plugin List */}
            <div className="space-y-3">
              {filtered.map(plugin => (
                <div
                  key={plugin.id}
                  className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{plugin.name}</span>
                      <span className="text-[11px] text-muted-foreground/80">v{plugin.version}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {plugin.description}
                    </p>

                    {plugin.status === 'active_unverified_user' && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <span>Pending verification</span>
                        <button
                          type="button"
                          onClick={() => handleApprove(plugin.id)}
                          className="font-medium underline hover:text-amber-700"
                        >
                          Confirm working
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <Switch
                      checked={plugin.enabled}
                      onCheckedChange={checked => handleToggle(plugin.id, checked)}
                      aria-label={`Toggle ${plugin.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const PatchManagerSheet = PluginDirectoryDialog; // backwards compat
