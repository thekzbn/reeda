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

import * as pdfjsLib from "pdfjs-dist";

const PDFJS_VERSION = pdfjsLib.version || "6.3.289";
const WORKER_SRC = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
}

export { pdfjsLib, PDFJS_VERSION, WORKER_SRC };
