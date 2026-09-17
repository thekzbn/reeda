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

import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, Loader2, Upload } from "lucide-react";
import {
  deleteDocument,
  formatBytes,
  listDocuments,
  renameDocument,
  uploadDocument,
  type DocumentRecord,
} from "@/lib/documents";
import { getMyProfile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/AppHeader";
import { PatchSlot } from "@/patch/PatchSlot";
import { pluginHost, getDocumentPriorityTag, setDocumentPriorityTag } from "@/patch/patch-host";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Your library | Reeda" },
      { name: "description", content: "Every PDF you have added to Reeda, in one quiet place." },
      { property: "og:title", content: "Your library | Reeda" },
      {
        property: "og:description",
        content: "Every PDF you have added to Reeda, in one quiet place.",
      },
    ],
  }),
  component: Library,
});

function Library() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<DocumentRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [priorityPluginEnabled, setPriorityPluginEnabled] = useState(() =>
    pluginHost.isPluginEnabled("plugin-library-tags"),
  );
  const [, setTagVersion] = useState(0);

  useEffect(() => {
    const unsub = pluginHost.subscribe(() => {
      setPriorityPluginEnabled(pluginHost.isPluginEnabled("plugin-library-tags"));
      setTagVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const profile = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });

  useEffect(() => {
    if (profile.data && !profile.data.onboarding_completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile.data, navigate]);

  const documents = useQuery({
    queryKey: ["documents", search],
    queryFn: () => listDocuments(search),
  });

  const rawDocs = documents.data ?? [];
  const docs =
    activeTagFilter && priorityPluginEnabled
      ? rawDocs.filter((doc) => getDocumentPriorityTag(doc.id) === activeTagFilter)
      : rawDocs;

  const handleFiles = useCallback(
    async (files: FileList | File[] | null | undefined) => {
      if (!files || files.length === 0) return;
      const fileList = Array.from(files);
      const pdfFiles = fileList.filter(
        (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
      );

      const invalidCount = fileList.length - pdfFiles.length;
      if (invalidCount > 0 && pdfFiles.length === 0) {
        toast.error("Only PDF files can be added to your library.");
        return;
      }

      if (invalidCount > 0) {
        toast.warning(`Skipped ${invalidCount} non-PDF ${invalidCount === 1 ? "file" : "files"}.`);
      }

      setIsUploading(true);
      try {
        let uploadedCount = 0;
        for (const file of pdfFiles) {
          try {
            await uploadDocument(file);
            uploadedCount++;
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : `Failed to upload "${file.name}".`,
            );
          }
        }

        if (uploadedCount > 0) {
          void queryClient.invalidateQueries({ queryKey: ["documents"] });
          toast.success(
            uploadedCount === 1
              ? "Added to your library."
              : `Added ${uploadedCount} documents to your library.`,
          );
        }
      } finally {
        setIsUploading(false);
      }
    },
    [queryClient],
  );

  useEffect(() => {
    function handleDragEnter(e: DragEvent) {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current += 1;
        setIsDragging(true);
      }
    }

    function handleDragLeave(e: DragEvent) {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setIsDragging(false);
        }
      }
    }

    function handleDragOver(e: DragEvent) {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    }

    function handleDrop(e: DragEvent) {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          void handleFiles(e.dataTransfer.files);
        }
      }
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleFiles]);

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameDocument(id, title),
    onSuccess: (_data, { id }) => {
      setRenaming(null);
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      void queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (doc: DocumentRecord) => deleteDocument(doc),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["documents"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="relative min-h-screen">
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-xs">
          <div className="squircle-lg flex h-64 w-full max-w-lg flex-col items-center justify-center border-2 border-dashed border-primary bg-accent/40 text-center animate-in fade-in zoom-in-95">
            <Upload className="h-10 w-10 animate-bounce text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Drop PDF to add to your library
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Release to upload</p>
          </div>
        </div>
      )}

      <AppHeader email={profile.data?.display_name} />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold">Library</h1>
          <Button
            className="squircle h-10"
            disabled={isUploading}
            onClick={() => fileInput.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding
              </>
            ) : (
              "Add PDF"
            )}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(event) => {
              const files = event.target.files;
              event.target.value = "";
              if (files && files.length > 0) void handleFiles(files);
            }}
          />
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your documents"
            className="squircle h-10 max-w-sm"
          />
          <PatchSlot
            slotId="slot_library_header_actions"
            context={{
              activeTagFilter,
              onSelectTagFilter: setActiveTagFilter,
            }}
          />
        </div>

        <div className="mt-8 border-t border-border">
          {documents.isLoading ? (
            <p className="py-10 text-[15px] text-muted-foreground">Loading</p>
          ) : docs.length === 0 ? (
            search ? (
              <p className="py-10 text-[15px] text-muted-foreground">
                Nothing matches that search.
              </p>
            ) : (
              <div
                onClick={() => fileInput.current?.click()}
                className="squircle-lg mt-6 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInput.current?.click();
                  }
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <FileUp className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-[15px] font-medium text-foreground">Add your first PDF</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drag and drop your PDF file here, or click to browse
                </p>
                <p className="mt-4 text-xs text-muted-foreground/80">PDF up to 500 MB</p>
              </div>
            )
          ) : (
            <ul>
              {docs.map((doc) => {
                const docTag = priorityPluginEnabled ? getDocumentPriorityTag(doc.id) : null;

                return (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-4 border-b border-border py-4"
                  >
                    <Link
                      to="/documents/$documentId"
                      params={{ documentId: doc.id }}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-medium hover:text-primary">
                          {doc.title}
                        </span>
                        {docTag && (
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground shrink-0">
                            {docTag}
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {formatBytes(Number(doc.file_size))} ·{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="squircle text-muted-foreground"
                        >
                          More
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={() => {
                            setRenaming(doc);
                            setRenameValue(doc.title);
                          }}
                        >
                          Rename
                        </DropdownMenuItem>

                        {priorityPluginEnabled && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="cursor-pointer text-xs">
                                Set Priority
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-36">
                                <DropdownMenuItem
                                  className="cursor-pointer text-xs"
                                  onClick={() => {
                                    setDocumentPriorityTag(doc.id, "To Read");
                                    setTagVersion((v) => v + 1);
                                    toast.success(`Set priority for "${doc.title}" to To Read`);
                                  }}
                                >
                                  To Read
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer text-xs"
                                  onClick={() => {
                                    setDocumentPriorityTag(doc.id, "In Progress");
                                    setTagVersion((v) => v + 1);
                                    toast.success(`Set priority for "${doc.title}" to In Progress`);
                                  }}
                                >
                                  In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer text-xs"
                                  onClick={() => {
                                    setDocumentPriorityTag(doc.id, "Synthesized");
                                    setTagVersion((v) => v + 1);
                                    toast.success(`Set priority for "${doc.title}" to Synthesized`);
                                  }}
                                >
                                  Synthesized
                                </DropdownMenuItem>
                                {docTag && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="cursor-pointer text-xs text-muted-foreground"
                                      onClick={() => {
                                        setDocumentPriorityTag(doc.id, null);
                                        setTagVersion((v) => v + 1);
                                        toast.success(`Cleared priority tag for "${doc.title}"`);
                                      }}
                                    >
                                      Clear Priority
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onSelect={() => remove.mutate(doc)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="squircle-lg sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="squircle h-10"
          />
          <DialogFooter>
            <Button
              className="squircle"
              disabled={rename.isPending}
              onClick={() => renaming && rename.mutate({ id: renaming.id, title: renameValue })}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
