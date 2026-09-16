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

import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { getMyProfile } from "@/lib/profile";
import { AppHeader } from "@/components/AppHeader";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { pluginHost } from "@/patch/patch-host";
import type { ReedaPluginManifest } from "@/patch/types";

export const Route = createFileRoute("/_authenticated/plugins/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Plugins | Reeda" },
      { name: "description", content: "Extensions and capabilities for your reading workspace." },
    ],
  }),
  component: PluginsIndexPage,
});

function PluginsIndexPage() {
  const navigate = useNavigate();
  const [plugins, setPlugins] = useState<ReedaPluginManifest[]>(() => pluginHost.getAll());

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  useEffect(() => {
    const unsub = pluginHost.subscribe(() => {
      setPlugins(pluginHost.getAll());
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={profileQuery.data?.display_name} />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link
              to="/"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              &larr; Back to library
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Plugins</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Extensions and capabilities for your reading workspace.
            </p>
          </div>

          {/* 
          <Button asChild size="sm" variant="outline" className="mt-7 text-xs font-medium">
            <Link to="/plugins/new">Add plugin</Link>
          </Button>
          */}
        </div>

        <div className="border-t border-border">
          {plugins.length === 0 ? (
            <div className="border-b border-border py-12 text-center text-xs text-muted-foreground">
              No plugins installed.
            </div>
          ) : (
            plugins.map((plugin) => (
              <div key={plugin.id} className="border-b border-border py-1">
                <div
                  onClick={() =>
                    navigate({
                      to: "/plugins/$pluginId",
                      params: { pluginId: plugin.id },
                    })
                  }
                  className="group flex cursor-pointer items-center justify-between gap-6 rounded-lg px-3 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-medium text-foreground">
                      {plugin.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {plugin.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={plugin.enabled}
                        onCheckedChange={(checked) => {
                          pluginHost.setEnabled(plugin.id, checked);
                          toast.success(`${plugin.name} ${checked ? "enabled" : "disabled"}.`);
                        }}
                        aria-label={`Toggle ${plugin.name}`}
                      />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
