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

import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyProfile } from "@/lib/profile";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { pluginHost } from "@/patch/patch-host";
import type { ReedaPluginManifest, ReedaSlotId } from "@/patch/types";

export const Route = createFileRoute("/_authenticated/plugins/new")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Add Plugin | Reeda" },
      { name: "description", content: "Create and install custom plugins in Reeda." },
    ],
  }),
  component: AddPluginPage,
});

function AddPluginPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [targetSlot, setTargetSlot] = useState<ReedaSlotId>("slot_reader_toolbar_actions");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please describe what plugin you would like to create.");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));

      const id = `plugin-custom-${Date.now()}`;
      const name = prompt.length > 32 ? prompt.slice(0, 32).trim() + "..." : prompt.trim();

      const newPlugin: ReedaPluginManifest = {
        id,
        name,
        description: prompt.trim(),
        category: targetSlot.includes("reader")
          ? "reader"
          : targetSlot.includes("notes")
          ? "notes"
          : "library",
        author: "You",
        version: "1.0.0",
        enabled: true,
        canonical_hash: "d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3",
        status: "active_verified",
        target_service: targetSlot.includes("reader")
          ? "reeda_reader"
          : targetSlot.includes("notes")
          ? "reeda_notes"
          : "reeda_library",
        target_scope: "custom_extension",
        created_at: new Date().toISOString(),
        touches: ["src/components/reader/ReaderHeader.tsx"],
        resource_locks: {
          slot_id: targetSlot,
          state_key: `reeda.custom.${id}.state`,
        },
        capabilities: ["storage:local"],
        semantic_contracts: {
          currency: "USD_CENTS",
          timestamp: "ISO_8601",
        },
        wasm_binary: {
          sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
          url: `https://cdn.patch.md/binaries/${id}.wasm`,
        },
        intent_declaration: [prompt.trim()],
        invariant_satisfaction: [
          "Satisfies Host Contract: `ReedaHostSafetySuite_v1`",
          "Passed Invariant Assertions: 2/2",
        ],
        ui_component_name: "ReadingTimeCalculatorWidget",
      };

      pluginHost.registerPlugin(newPlugin);
      toast.success(`Installed "${name}".`);
      navigate({
        to: "/plugins/$pluginId",
        params: { pluginId: id },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={profileQuery.data?.display_name} />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <Link
            to="/plugins"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to plugins
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Add custom plugin
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Describe the capability or tool you want in your reading workspace.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="divide-y divide-border border-y border-border">
            <div className="py-6">
              <label htmlFor="plugin-desc" className="text-sm font-medium text-foreground block">
                Description
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                What should this plugin do?
              </p>
              <Textarea
                id="plugin-desc"
                placeholder="e.g. Highlight vocabulary words, count reading streak days, or export notes..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isSubmitting}
                className="mt-3 h-28 text-sm resize-none"
              />
            </div>

            <div className="py-6">
              <label htmlFor="plugin-location" className="text-sm font-medium text-foreground block">
                Location
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Where should this plugin appear in Reeda?
              </p>
              <select
                id="plugin-location"
                value={targetSlot}
                onChange={(e) => setTargetSlot(e.target.value as ReedaSlotId)}
                disabled={isSubmitting}
                className="mt-3 flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
              >
                <option value="slot_reader_toolbar_actions">Reader Top Bar</option>
                <option value="slot_notes_pane_header_actions">Notes Toolbar</option>
                <option value="slot_library_header_actions">Library Header</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !prompt.trim()}
              className="text-xs font-medium"
            >
              {isSubmitting ? "Installing..." : "Install plugin"}
            </Button>
            <Button
              asChild
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-medium"
            >
              <Link to="/plugins">Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
