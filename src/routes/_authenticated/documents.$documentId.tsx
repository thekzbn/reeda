import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatBytes, getDocument, markDocumentOpened } from "@/lib/documents";

export const Route = createFileRoute("/_authenticated/documents/$documentId")({
  component: DocumentPage,
});

function DocumentPage() {
  const { documentId } = Route.useParams();

  const document = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId),
  });

  useEffect(() => {
    if (document.data) void markDocumentOpened(documentId);
  }, [document.data, documentId]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        Library
      </Link>

      {document.isLoading ? (
        <p className="mt-10 text-[15px] text-muted-foreground">Loading</p>
      ) : document.error ? (
        <p className="mt-10 text-[15px] text-muted-foreground">
          {(document.error as Error).message}
        </p>
      ) : document.data ? (
        <>
          <h1 className="mt-8 text-2xl font-semibold">{document.data.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            PDF · {formatBytes(Number(document.data.file_size))} · added{" "}
            {new Date(document.data.created_at).toLocaleDateString()}
          </p>
          <div className="mt-10 border-t border-border pt-10">
            <p className="text-[15px] text-muted-foreground">
              The reading surface for this document is not built yet. Your file is stored privately
              and will open here.
            </p>
          </div>
        </>
      ) : null}
    </main>
  );
}
