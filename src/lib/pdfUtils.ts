import { PDFDocument, rgb, StandardFonts, LineCapStyle } from "pdf-lib";

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
    bold?: boolean;
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

export interface DrawAnnotation {
    id: number;
    type: "draw";
    page: number;
    points: { x: number; y: number }[];  // normalized 0–1
    color: string;
    strokeWidth: number;  // screen pixels
}

export type Annotation = TextAnnotation | ImageAnnotation | DrawAnnotation;

export type ActiveTool = "text" | "image" | "pen";

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
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const ann of annotations) {
        const page = pages[ann.page - 1];
        if (!page) continue;
        const { width, height } = page.getSize();

        if (ann.type === "text") {
            const { r, g, b } = hexToRgb01(ann.color);
            // Fix: use -fontSize*0.3 so text visually centers at the click point
            page.drawText(ann.text, {
                x: ann.x * width,
                y: height - ann.y * height - ann.fontSize * 0.3,
                size: ann.fontSize,
                font: ann.bold ? fontBold : font,
                color: rgb(r, g, b),
            });
        } else if (ann.type === "image") {
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
        } else if (ann.type === "draw" && ann.points.length >= 2) {
            const { r, g, b } = hexToRgb01(ann.color);
            const strokeColor = rgb(r, g, b);
            const thickness = Math.max(ann.strokeWidth * 0.75, 0.5);
            for (let i = 1; i < ann.points.length; i++) {
                const p1 = ann.points[i - 1];
                const p2 = ann.points[i];
                page.drawLine({
                    start: { x: p1.x * width, y: height - p1.y * height },
                    end:   { x: p2.x * width, y: height - p2.y * height },
                    thickness,
                    color: strokeColor,
                    opacity: 1,
                    lineCap: LineCapStyle.Round,
                });
            }
        }
    }

    const saved = await pdfDoc.save();
    const blob = new Blob([saved as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.trim() || "annotated"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}
