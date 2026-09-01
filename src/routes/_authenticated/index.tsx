import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<DocumentRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Added to your library.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

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

  const docs = documents.data ?? [];

  return (
    <div className="min-h-screen">
      <AppHeader email={profile.data?.display_name} />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold">Library</h1>
          <Button
            className="squircle h-10"
            disabled={upload.isPending}
            onClick={() => fileInput.current?.click()}
          >
            {upload.isPending ? "Adding" : "Add PDF"}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) upload.mutate(file);
            }}
          />
        </div>

        <div className="mt-6">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your documents"
            className="squircle h-10 max-w-sm"
          />
        </div>

        <div className="mt-8 border-t border-border">
          {documents.isLoading ? (
            <p className="py-10 text-[15px] text-muted-foreground">Loading</p>
          ) : docs.length === 0 ? (
            <p className="py-10 text-[15px] text-muted-foreground">
              {search
                ? "Nothing matches that search."
                : "Nothing here yet. Add a PDF to get started."}
            </p>
          ) : (
            <ul>
              {docs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-4 border-b border-border py-4"
                >
                  <Link
                    to="/documents/$documentId"
                    params={{ documentId: doc.id }}
                    className="min-w-0 flex-1"
                  >
                    <span className="block truncate text-[15px] font-medium hover:text-primary">
                      {doc.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {formatBytes(Number(doc.file_size))} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="squircle text-muted-foreground">
                        More
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onSelect={() => {
                          setRenaming(doc);
                          setRenameValue(doc.title);
                        }}
                      >
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => remove.mutate(doc)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
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
