import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Annotator",
  description: "Annotate, highlight, and add notes to PDF files directly in your browser. A free online PDF editor built into TodoLife.",
};

export default function PdfEditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
