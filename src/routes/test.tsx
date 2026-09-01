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
  const fixture = new URLSearchParams(window.location.search).get("fixture") === "long";
  return (
    <PdfReader
      documentUrl={fixture ? "/long-selection-fixture.pdf" : "/sample-document.pdf"}
      title={fixture ? "Long Selection Fixture" : "Sample Research Paper"}
      documentId={fixture ? "test-fixture-long-document" : "test-fixture-document"}
    />
  );
}
