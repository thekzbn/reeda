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
import { getMyProfile } from "@/lib/profile";
import { AppHeader } from "@/components/AppHeader";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { pluginHost } from "@/patch/patch-host";
import type { ReedaPluginManifest } from "@/patch/types";

export const Route = createFileRoute("/_authenticated/plugins/$pluginId")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Plugin Details | Reeda" }],
  }),
  component: PluginDetailPage,
});

function PluginDetailPage() {
  const { pluginId } = Route.useParams();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<ReedaPluginManifest | undefined>(() =>
    pluginHost.getById(pluginId),
  );

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  useEffect(() => {
    const unsub = pluginHost.subscribe(() => {
      setPlugin(pluginHost.getById(pluginId));
    });
    return unsub;
  }, [pluginId]);

  if (!plugin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader email={profileQuery.data?.display_name} />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <Link
            to="/plugins"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to plugins
          </Link>
          <div className="mt-8 py-12 text-center text-sm text-muted-foreground">
            Plugin not found.
          </div>
        </main>
      </div>
    );
  }

  const handleToggle = (checked: boolean) => {
    pluginHost.setEnabled(plugin.id, checked);
    toast.success(`${plugin.name} ${checked ? "enabled" : "disabled"}.`);
  };

  const handleUninstall = () => {
    pluginHost.removePlugin(plugin.id);
    toast.success(`Uninstalled "${plugin.name}".`);
    navigate({ to: "/plugins" });
  };

  const isDefaultPlugin = [
    "plugin-reading-time",
    "plugin-citation-formatter",
    "plugin-library-tags",
  ].includes(plugin.id);

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
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {plugin.name}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Version {plugin.version} &bull; by {plugin.author}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">
                {plugin.enabled ? "Active" : "Disabled"}
              </span>
              <Switch
                checked={plugin.enabled}
                onCheckedChange={handleToggle}
                aria-label={`Toggle ${plugin.name}`}
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {/* About & Description */}
          <div className="py-6">
            <h2 className="text-sm font-medium text-foreground">Description</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {plugin.description}
            </p>
          </div>

          {/* Plugin Intent & Features */}
          {plugin.intent_declaration && plugin.intent_declaration.length > 0 && (
            <div className="py-6">
              <h2 className="text-sm font-medium text-foreground">Features</h2>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {plugin.intent_declaration.map((intent, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-muted-foreground/60">&bull;</span>
                    <span>{intent}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Uninstall for custom plugins */}
          {!isDefaultPlugin && (
            <div className="py-6">
              <h2 className="text-sm font-medium text-foreground">Manage</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Remove this custom plugin from your workspace.
              </p>
              <div className="mt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Uninstall plugin
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Uninstall {plugin.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the plugin from your reading workspace.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleUninstall}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Uninstall
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
