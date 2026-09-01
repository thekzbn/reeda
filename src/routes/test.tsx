import { createFileRoute } from "@tanstack/react-router";
import { PdfReader } from "@/components/reader/PdfReader";

export const Route = createFileRoute("/test")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Test Environment | Reeda" },
      {
        name: "description",
        content: "Development test environment for PDF reading and notes workspace.",
      },
    ],
  }),
  component: TestPage,
});

function TestPage() {
  return (
    <PdfReader
      documentUrl="/sample-document.pdf"
      title="Sample Research Paper"
      documentId="test-fixture-document"
    />
  );
}
