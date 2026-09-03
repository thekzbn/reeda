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
