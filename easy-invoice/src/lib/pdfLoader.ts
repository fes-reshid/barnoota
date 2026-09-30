import type { DocumentView } from "./docView";

/**
 * @react-pdf/renderer is by far the largest dependency in this app. It's
 * only needed when someone actually downloads or prints a document, so it's
 * loaded on demand instead of being part of the initial bundle every
 * mobile visitor has to download just to see the dashboard.
 */
async function loadPdfModules() {
  const [{ pdf }, { DocumentPdf }] = await Promise.all([import("@react-pdf/renderer"), import("../components/documents/DocumentPdf")]);
  return { pdf, DocumentPdf };
}

export async function downloadPdf(doc: DocumentView, filename: string) {
  const { pdf, DocumentPdf } = await loadPdfModules();
  const blob = await pdf(DocumentPdf({ doc })).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function openPdfForPrint(doc: DocumentView) {
  const { pdf, DocumentPdf } = await loadPdfModules();
  const blob = await pdf(DocumentPdf({ doc })).toBlob();
  window.open(URL.createObjectURL(blob), "_blank");
}
