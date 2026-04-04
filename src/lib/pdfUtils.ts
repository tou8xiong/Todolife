import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TextAnnotation {
    id: number;
    type: "text";
    page: number;
    x: number;       // 0–1 relative to canvas width
    y: number;       // 0–1 relative to canvas height
    text: string;
    fontSize: number;
    color: string;   // hex e.g. "#ff0000"
}

export interface ImageAnnotation {
    id: number;
    type: "image";
    page: number;
    x: number;
    y: number;
    width: number;   // 0–1 relative to canvas width
    height: number;  // 0–1 relative to canvas height
    dataUrl: string;
    mimeType: "image/png" | "image/jpeg";
}

export type Annotation = TextAnnotation | ImageAnnotation;

export type ActiveTool = "text" | "image";

// ── Helpers ──────────────────────────────────────────────────────────────────

export function hexToRgb01(hex: string) {
    const h = hex.replace("#", "");
    return {
        r: parseInt(h.substring(0, 2), 16) / 255,
        g: parseInt(h.substring(2, 4), 16) / 255,
        b: parseInt(h.substring(4, 6), 16) / 255,
    };
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

// ── Download ─────────────────────────────────────────────────────────────────

export async function downloadAnnotatedPdf(
    pdfBytes: ArrayBuffer,
    annotations: Annotation[],
    fileName: string
): Promise<void> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const ann of annotations) {
        const page = pages[ann.page - 1];
        if (!page) continue;
        const { width, height } = page.getSize();

        if (ann.type === "text") {
            const { r, g, b } = hexToRgb01(ann.color);
            page.drawText(ann.text, {
                x: ann.x * width,
                y: height - ann.y * height - ann.fontSize,
                size: ann.fontSize,
                font,
                color: rgb(r, g, b),
            });
        } else {
            try {
                const bytes = dataUrlToUint8Array(ann.dataUrl);
                const img = ann.mimeType === "image/jpeg"
                    ? await pdfDoc.embedJpg(bytes)
                    : await pdfDoc.embedPng(bytes);
                page.drawImage(img, {
                    x: ann.x * width,
                    y: height - ann.y * height - ann.height * height,
                    width: ann.width * width,
                    height: ann.height * height,
                });
            } catch (err) {
                console.error("Failed to embed image annotation:", err);
            }
        }
    }

    const saved = await pdfDoc.save();
    const blob = new Blob(
        [new Uint8Array(saved.buffer as ArrayBuffer, saved.byteOffset, saved.byteLength)],
        { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.trim() || "annotated"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}
