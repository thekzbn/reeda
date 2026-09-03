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

import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDocument, markDocumentOpened } from "@/lib/documents";
import { getStorageProvider, type StorageProviderId } from "@/lib/storage";
import { PdfReader } from "@/components/reader/PdfReader";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/documents/$documentId")({
  head: () => ({
    meta: [
      { title: "Reader | Reeda" },
      { name: "description", content: "A quiet place to read and work with your PDFs." },
      { property: "og:title", content: "Reader | Reeda" },
      {
        property: "og:description",
        content: "A quiet place to read and work with your PDFs.",
      },
    ],
  }),
  component: DocumentPage,
});

function DocumentPage() {
  const { documentId } = Route.useParams();

  const documentQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId),
    staleTime: 1000 * 60 * 5,
  });

  const fileUrlQuery = useQuery({
    queryKey: [
      "document-url",
      documentQuery.data?.storage_provider,
      documentQuery.data?.storage_ref,
    ],
    queryFn: async () => {
      if (!documentQuery.data) return null;
      const storage = getStorageProvider(documentQuery.data.storage_provider as StorageProviderId);
      return await storage.getReadUrl(documentQuery.data.storage_ref);
    },
    enabled: !!documentQuery.data,
    staleTime: 1000 * 60 * 8, // Signed URL is valid for 10 minutes
  });

  useEffect(() => {
    if (documentQuery.data) {
      void markDocumentOpened(documentId);
    }
  }, [documentQuery.data, documentId]);

  if (documentQuery.isLoading || (documentQuery.data && fileUrlQuery.isLoading)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background px-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-foreground">
          {documentQuery.data?.title ?? "Loading document"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Preparing reader</p>
      </div>
    );
  }

  if (documentQuery.error || fileUrlQuery.error) {
    const message =
      documentQuery.error instanceof Error
        ? documentQuery.error.message
        : fileUrlQuery.error instanceof Error
          ? fileUrlQuery.error.message
          : "We could not open this document.";

    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Library
        </Link>
        <h1 className="mt-8 text-xl font-semibold">Unable to open document</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="squircle inline-flex h-9 items-center justify-center bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to library
          </Link>
        </div>
      </main>
    );
  }

  if (!documentQuery.data || !fileUrlQuery.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Library
        </Link>
        <h1 className="mt-8 text-xl font-semibold">Document not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">That document is not available.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="squircle inline-flex h-9 items-center justify-center bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to library
          </Link>
        </div>
      </main>
    );
  }

  return (
    <PdfReader
      documentUrl={fileUrlQuery.data}
      title={documentQuery.data.title}
      documentId={documentQuery.data.id}
    />
  );
}
