import * as pdfjsLib from "pdfjs-dist";

const PDFJS_VERSION = pdfjsLib.version || "6.3.289";
const WORKER_SRC = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
}

export { pdfjsLib, PDFJS_VERSION, WORKER_SRC };
