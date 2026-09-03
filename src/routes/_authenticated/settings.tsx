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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  type ThemeMode,
} from "@/lib/profile";
import { listDocuments, formatBytes, MANAGED_STORAGE_ALLOWANCE_BYTES } from "@/lib/documents";
import { applyTheme } from "@/lib/theme";
import { AppHeader } from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Reeda" },
      { name: "description", content: "Manage your appearance, reading preferences, and account." },
      { property: "og:title", content: "Settings | Reeda" },
      {
        property: "og:description",
        content: "Manage your appearance, reading preferences, and account.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(),
  });

  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const profile = profileQuery.data;

  useEffect(() => {
    if (profile?.display_name !== undefined) {
      setDisplayNameInput(profile.display_name ?? "");
    }
  }, [profile?.display_name]);

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update settings.");
    },
  });

  const handleSaveName = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = displayNameInput.trim();
    if (trimmed === (profile?.display_name ?? "")) return;
    updateMutation.mutate({ display_name: trimmed || null });
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    applyTheme(newTheme);
    updateMutation.mutate({ theme: newTheme });
  };

  const handleResumeReadingChange = (checked: boolean) => {
    updateMutation.mutate({ resume_reading: checked });
  };

  const handleExportSourceChange = (checked: boolean) => {
    updateMutation.mutate({ export_include_source: checked });
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/welcome", replace: true });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteMyAccount();
      await queryClient.cancelQueries();
      queryClient.clear();
      toast.success("Your account and data have been deleted.");
      navigate({ to: "/welcome", replace: true });
    } catch {
      setIsDeleting(false);
      toast.error("Could not delete account. Please try again.");
    }
  };

  // Storage computation
  const usedBytes = (documentsQuery.data ?? []).reduce(
    (total, doc) => total + Number(doc.file_size || 0),
    0,
  );
  const storageLimit = profile?.storage_quota_bytes || MANAGED_STORAGE_ALLOWANCE_BYTES;
  const storagePercent = Math.min(100, Math.round((usedBytes / storageLimit) * 100));

  if (profileQuery.isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentTheme = profile?.theme ?? "system";
  const resumeReading = profile?.resume_reading ?? true;
  const exportIncludeSource = profile?.export_include_source ?? true;
  const hasNameChanged = displayNameInput.trim() !== (profile?.display_name ?? "");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={profile?.display_name} />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <Link
            to="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to library
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {/* Display Name */}
          <div className="py-6">
            <h2 className="text-sm font-medium text-foreground">Display name</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your name as shown in the top navigation.
            </p>
            <form onSubmit={handleSaveName} className="mt-3 flex max-w-md items-center gap-2">
              <Input
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Enter your name"
                className="h-9 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!hasNameChanged || updateMutation.isPending}
                className="h-9 shrink-0 text-xs font-medium"
              >
                Save
              </Button>
            </form>
          </div>

          {/* Appearance */}
          <div className="py-6">
            <h2 className="text-sm font-medium text-foreground">Appearance</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select how Reeda is presented on your screen.
            </p>
            <div className="mt-3 inline-flex items-center rounded-lg border border-border p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  currentTheme === "light"
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  currentTheme === "dark"
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  currentTheme === "system"
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                System
              </button>
            </div>
          </div>

          {/* Resume Reading Position */}
          <div className="flex items-center justify-between gap-4 py-6">
            <div>
              <h2 className="text-sm font-medium text-foreground">Resume reading position</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Reopen documents at the page and position where you last left off.
              </p>
            </div>
            <Switch
              checked={resumeReading}
              onCheckedChange={handleResumeReadingChange}
              disabled={updateMutation.isPending}
              aria-label="Resume reading position"
            />
          </div>

          {/* Export Source Line */}
          <div className="flex items-center justify-between gap-4 py-6">
            <div>
              <h2 className="text-sm font-medium text-foreground">Include source in note exports</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a restrained source line at the bottom of exported PDFs referencing the original document.
              </p>
            </div>
            <Switch
              checked={exportIncludeSource}
              onCheckedChange={handleExportSourceChange}
              disabled={updateMutation.isPending}
              aria-label="Include source in note exports"
            />
          </div>

          {/* Storage Information */}
          <div className="py-6">
            <h2 className="text-sm font-medium text-foreground">Storage</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Storage allowance for your uploaded PDF library.
            </p>
            <div className="mt-3 max-w-md space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatBytes(usedBytes)} used</span>
                <span>{formatBytes(storageLimit)} available</span>
              </div>
              <Progress value={storagePercent} className="h-1.5" />
            </div>
          </div>

          {/* Legal links */}
          <div className="py-6">
            <h2 className="text-sm font-medium text-foreground">Legal and privacy</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Review our data practices and terms of service.
            </p>
            <div className="mt-3 flex gap-6 text-xs">
              <Link
                to="/privacy"
                className="underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                Privacy policy
              </Link>
              <Link
                to="/terms"
                className="underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                Terms of service
              </Link>
            </div>
          </div>

          {/* Account Actions */}
          <div className="py-6">
            <h2 className="text-sm font-medium text-foreground">Account</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSignOut()}
                className="h-9 text-xs font-medium"
              >
                Sign out
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete your uploaded PDFs, reading notes,
                      annotations, and profile settings. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleDeleteAccount()}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete everything"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
