/*
 * PatchManagerSheet: View, manage, verify, and debug patch.md extensions in Reeda.
 * Displays lifecycle states (ACTIVE_UNVERIFIED_USER -> ACTIVE_VERIFIED, STALE, DEGRADED),
 * capability whitelists, and allows triggering on-demand user verification.
 */

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Trash2,
  RefreshCw,
  Plus,
  Lock,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { patchHost } from "./patch-host";
import type { ReedaPatchManifest, PatchLifecycleStatus } from "./types";
import { PatchIntakeDialog } from "./PatchIntakeDialog";

interface PatchManagerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatchManagerSheet({ open, onOpenChange }: PatchManagerSheetProps) {
  const [patches, setPatches] = useState<ReedaPatchManifest[]>(() => patchHost.getAll());
  const [intakeOpen, setIntakeOpen] = useState(false);

  useEffect(() => {
    const unsub = patchHost.subscribe(() => {
      setPatches(patchHost.getAll());
    });
    return unsub;
  }, []);

  const handleApprove = (patchId: string) => {
    const ok = patchHost.approvePatch(patchId);
    if (ok) {
      toast.success("Patch marked as functionally verified (ACTIVE_VERIFIED)");
    }
  };

  const handleReject = (patchId: string) => {
    const reason = window.prompt("Why is this patch functionally incorrect?");
    if (reason) {
      patchHost.rejectPatch(patchId, reason);
      toast.info("User rejection feedback recorded on patch manifest");
    }
  };

  const handleToggleDegraded = (patchId: string) => {
    patchHost.toggleDegraded(patchId);
    toast.info("Circuit breaker state updated");
  };

  const getStatusBadge = (status: PatchLifecycleStatus) => {
    switch (status) {
      case "active_verified":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active Verified
          </Badge>
        );
      case "active_unverified_user":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
            <Clock className="mr-1 h-3 w-3" />
            Active Unverified User
          </Badge>
        );
      case "degraded_paused":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Degraded (Paused)
          </Badge>
        );
      case "stale_pending_verification":
        return (
          <Badge variant="secondary">
            <RefreshCw className="mr-1 h-3 w-3" />
            Stale Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="squircle-lg max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <DialogTitle className="text-xl font-semibold">patch.md Extensions</DialogTitle>
              </div>
              <Button size="sm" className="squircle gap-1.5" onClick={() => setIntakeOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Create Patch
              </Button>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Intent-driven, WebAssembly-sandboxed feature extensions for Reeda. Managed via
              abstract slot locks and capability guards.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {patches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No patches currently installed.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 squircle"
                  onClick={() => setIntakeOpen(true)}
                >
                  Generate First Patch
                </Button>
              </div>
            ) : (
              patches.map((patch) => (
                <div
                  key={patch.patch_id}
                  className="rounded-xl border border-border bg-card/50 p-4 transition-colors hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{patch.title}</h4>
                        {getStatusBadge(patch.status)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{patch.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          patchHost.removePatch(patch.patch_id);
                          toast.info(`Removed ${patch.title}`);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Metadata and Slot Locks */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-primary/70" />
                      <span>
                        Slot:{" "}
                        <code className="font-mono text-[11px] text-foreground">
                          {patch.resource_locks.slot_id}
                        </code>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-primary/70" />
                      <span>
                        Caps:{" "}
                        <code className="font-mono text-[11px] text-foreground">
                          {patch.capabilities.join(", ")}
                        </code>
                      </span>
                    </div>
                  </div>

                  {/* Step 18: Verification Banner */}
                  {patch.status === "active_unverified_user" && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                      <div>
                        <span className="font-medium">Host structural tests passed.</span> Waiting
                        for your functional validation.
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-amber-800 dark:text-amber-200 hover:bg-amber-500/20"
                          onClick={() => handleReject(patch.patch_id)}
                        >
                          Report Issue
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleApprove(patch.patch_id)}
                        >
                          Approve (Verified)
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Invariant satisfaction lines */}
                  <div className="mt-3 text-[11px] text-muted-foreground font-mono bg-muted/20 rounded p-2 space-y-0.5">
                    {patch.invariant_satisfaction.map((inv, idx) => (
                      <div key={idx}>✓ {inv}</div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PatchIntakeDialog open={intakeOpen} onOpenChange={setIntakeOpen} />
    </>
  );
}
