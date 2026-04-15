"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Annotation, ActiveTool, DrawAnnotation, ImageAnnotation, TextAnnotation, downloadAnnotatedPdf } from "@/lib/pdfUtils";
import Toolbar from "@/components/pdf/Toolbar";
import AnnotationItem from "@/components/pdf/AnnotationItem";
import DownloadModal from "@/components/pdf/DownloadModal";
import ConverterDownloadModal, { ConverterSizeOption } from "@/components/pdf/ConverterDownloadModal";
import { UploadCloud, FileText, FileImage, FileType2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveTempData, loadTempData, clearTempData } from "@/lib/tempData";
import { useAlert } from "@/hooks/useAlert";

// ── Drag / resize ref type ───────────────────────────────────────────────────

// ── Drag / resize ref type ───────────────────────────────────────────────────
interface DragState {
    mode: "drag" | "resize";
    id: number;
    pageIndex: number;
    startMouseX: number;
    startMouseY: number;
    origX: number;
    origY: number;
    origWidth: number;
    origHeight: number;
    moved: boolean;
}

interface Placing {
    page: number;
    x: number;
    y: number;
}

type FileType = "pdf" | "docx" | "txt" | "image" | null;

type Mode = "annotator" | "converter";

export default function PdfEditor() {
    const { user } = useAppContext();
    const router = useRouter();
    const { showAlert } = useAlert();
    const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [loading, setLoading] = useState(false);

    const [fileType, setFileType] = useState<FileType>(null);
    const [docContent, setDocContent] = useState<string>("");
    const [imageData, setImageData] = useState<string>("");
    const [mode, setMode] = useState<Mode>("annotator");

    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [activeTool, setActiveTool] = useState<ActiveTool>("text");
    const [fontSize, setFontSize] = useState(14);
    const [color, setColor] = useState("#000000");
    const [bold, setBold] = useState(false);
    const [penStrokeWidth, setPenStrokeWidth] = useState(2);

    const [pendingImage, setPendingImage] = useState<{ dataUrl: string; mimeType: "image/png" | "image/jpeg" } | null>(null);
    const [placing, setPlacing] = useState<Placing | null>(null);
    const [newText, setNewText] = useState("");

    const [downloadModal, setDownloadModal] = useState(false);
    const [fileName, setFileName] = useState("annotated");
    const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx">("pdf");
    const [dragOver, setDragOver] = useState(false);

    const [liveStroke, setLiveStroke] = useState<{ pageIndex: number; points: { x: number; y: number }[] } | null>(null);

    const [originalFileName, setOriginalFileName] = useState<string>("");
    const [pdfBase64, setPdfBase64] = useState<string>("");

    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const dragRef = useRef<DragState | null>(null);
    const penDrawRef = useRef<{ pageIndex: number; points: { x: number; y: number }[] } | null>(null);

    const selectedAnnotation = annotations.find((a) => a.id === selectedId) ?? null;
    const hasFile = fileType !== null;

    // Restore data on mount after login
    useEffect(() => {
        const savedData = loadTempData<{
            annotations: Annotation[];
            mode: Mode;
            fileType: FileType;
            docContent: string;
            imageData: string;
            fileName: string;
            originalFileName: string;
            pdfBase64: string;
        }>("pdfeditor");

        if (savedData) {
            setAnnotations(savedData.annotations || []);
            setMode(savedData.mode || "annotator");
            setFileType(savedData.fileType || null);
            setDocContent(savedData.docContent || "");
            setImageData(savedData.imageData || "");
            setFileName(savedData.fileName || "annotated");
            setOriginalFileName(savedData.originalFileName || "");
            setPdfBase64(savedData.pdfBase64 || "");

            if (savedData.pdfBase64) {
                try {
                    const binaryString = atob(savedData.pdfBase64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    setPdfBytes(bytes.buffer);
                } catch (e) {
                    console.error("Failed to restore PDF:", e);
                }
            }

            showAlert({
                title: "Work Restored",
                message: "Your PDF work has been restored. You can continue editing.",
                type: "success",
                confirmText: "Got it",
            });
            clearTempData("pdfeditor");
        }
    }, []);

    // ── Render PDF ─────────────────────────────────────────────────────────
    const renderPdf = useCallback(async () => {
        if (!pdfBytes) return;
        setLoading(true);
        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
            setNumPages(pdf.numPages);
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const canvas = canvasRefs.current[i - 1];
                if (!canvas) continue;
                const viewport = page.getViewport({ scale: 1.5 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport }).promise;
            }
        } finally {
            setLoading(false);
        }
    }, [pdfBytes]);

    useEffect(() => { renderPdf(); }, [renderPdf]);

    // ── File upload ────────────────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const name = file.name.toLowerCase();

        // Reset state
        setAnnotations([]);
        setSelectedId(null);
        setNumPages(0);
        setPdfBytes(null);
        setDocContent("");
        setImageData("");
        setFileType(null);
        setPendingImage(null);
        setPlacing(null);

        if (mode === "annotator") {
            if (name.endsWith(".pdf")) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setPdfBytes(ev.target?.result as ArrayBuffer);
                    setFileType("pdf");
                };
                reader.readAsArrayBuffer(file);

            } else if (name.endsWith(".docx")) {
                setLoading(true);
                try {
                    const mammoth = await import("mammoth");
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setDocContent(result.value);
                    setFileType("docx");
                    setNumPages(1);
                } catch (err) {
                    console.error("Failed to convert DOCX:", err);
                } finally {
                    setLoading(false);
                }

            } else if (name.endsWith(".txt")) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setDocContent(ev.target?.result as string);
                    setFileType("txt");
                    setNumPages(1);
                };
                reader.readAsText(file);
            }
        } else if (mode === "converter") {
            if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setImageData(ev.target?.result as string);
                    setFileType("image");
                    setNumPages(1);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    // ── Drag-and-drop upload ───────────────────────────────────────────────
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(fakeEvent);
    };

    // ── Canvas click ───────────────────────────────────────────────────────
    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
        if (activeTool === "pen") return; // pen uses mousedown/move/up
        if (dragRef.current?.moved) { dragRef.current = null; return; }
        setSelectedId(null);
        const container = containerRefs.current[pageIndex];
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        if (activeTool === "image" && pendingImage) {
            setAnnotations((prev) => [
                ...prev,
                { id: Date.now(), type: "image", page: pageIndex + 1, x, y, width: 0.2, height: 0.15, dataUrl: pendingImage.dataUrl, mimeType: pendingImage.mimeType } as ImageAnnotation,
            ]);
            setPendingImage(null);
            return;
        }
        if (activeTool === "text" && !placing) {
            setPlacing({ page: pageIndex + 1, x, y });
            setNewText("");
        }
    };

    // ── Pen drawing ────────────────────────────────────────────────────────
    const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
        if (activeTool !== "pen") return;
        e.preventDefault();
        const container = containerRefs.current[pageIndex];
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        penDrawRef.current = { pageIndex, points: [{ x, y }] };
        setLiveStroke({ pageIndex, points: [{ x, y }] });
    };

    const confirmText = () => {
        if (!placing || !newText.trim()) { setPlacing(null); return; }
        setAnnotations((prev) => [
            ...prev,
            { id: Date.now(), type: "text", page: placing.page, x: placing.x, y: placing.y, text: newText, fontSize, color, bold } as TextAnnotation,
        ]);
        setPlacing(null);
        setNewText("");
    };

    // ── Drag & resize ──────────────────────────────────────────────────────
    const handleAnnotationMouseDown = (e: React.MouseEvent, ann: Annotation, pageIndex: number) => {
        if (ann.type === "draw") return; // draw annotations don't drag
        e.stopPropagation();
        e.preventDefault();
        dragRef.current = {
            mode: "drag", id: ann.id, pageIndex,
            startMouseX: e.clientX, startMouseY: e.clientY,
            origX: ann.x, origY: ann.y,
            origWidth: ann.type === "image" ? ann.width : 0,
            origHeight: ann.type === "image" ? ann.height : 0,
            moved: false,
        };
    };

    const handleResizeMouseDown = (e: React.MouseEvent, ann: ImageAnnotation, pageIndex: number) => {
        e.stopPropagation();
        e.preventDefault();
        dragRef.current = {
            mode: "resize", id: ann.id, pageIndex,
            startMouseX: e.clientX, startMouseY: e.clientY,
            origX: ann.x, origY: ann.y,
            origWidth: ann.width, origHeight: ann.height,
            moved: false,
        };
    };

    const handleAnnotationClick = (e: React.MouseEvent, ann: Annotation) => {
        e.stopPropagation();
        if (!dragRef.current?.moved) setSelectedId(ann.id);
    };

    const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
        // Pen drawing
        const pen = penDrawRef.current;
        if (pen && pen.pageIndex === pageIndex) {
            const container = containerRefs.current[pageIndex];
            if (container) {
                const rect = container.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                pen.points.push({ x, y });
                setLiveStroke({ pageIndex, points: [...pen.points] });
            }
            return;
        }
        // Drag/resize
        const drag = dragRef.current;
        if (!drag || drag.pageIndex !== pageIndex) return;
        const container = containerRefs.current[pageIndex];
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const dx = (e.clientX - drag.startMouseX) / rect.width;
        const dy = (e.clientY - drag.startMouseY) / rect.height;
        if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) drag.moved = true;
        setAnnotations((prev) =>
            prev.map((a) => {
                if (a.id !== drag.id) return a;
                if (drag.mode === "drag") return { ...a, x: Math.max(0, Math.min(0.98, drag.origX + dx)), y: Math.max(0, Math.min(0.98, drag.origY + dy)) };
                if (drag.mode === "resize" && a.type === "image") return { ...a, width: Math.max(0.03, drag.origWidth + dx), height: Math.max(0.03, drag.origHeight + dy) };
                return a;
            })
        );
    };

    const handleContainerMouseUp = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
        // Finalize pen stroke
        const pen = penDrawRef.current;
        if (pen && pen.pageIndex === pageIndex && pen.points.length >= 2) {
            setAnnotations((prev) => [
                ...prev,
                { id: Date.now(), type: "draw", page: pageIndex + 1, points: pen.points, color, strokeWidth: penStrokeWidth } as DrawAnnotation,
            ]);
        }
        penDrawRef.current = null;
        setLiveStroke(null);
        dragRef.current = null;
    };

    // ── Annotation CRUD ────────────────────────────────────────────────────
    const updateAnnotation = (updated: Annotation) =>
        setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

    const deleteAnnotation = (id: number) => {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
        setSelectedId(null);
    };

    // ── Download ───────────────────────────────────────────────────────────
    const handleDownload = async (converterSize?: ConverterSizeOption) => {
        setLoading(true);
        try {
            const { PDFDocument } = await import("pdf-lib");
            const html2canvas = (await import("html2canvas")).default;
            const { Document, Packer, Paragraph, ImageRun } = await import("docx");

            const triggerDownload = (blob: Blob, name: string) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            const capturePage = async (index: number) => {
                const container = containerRefs.current[index];
                if (!container) {
                    console.error("Container ref is null for index", index);
                    return null;
                }

                try {
                    const canvas = await html2canvas(container, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: "#ffffff",
                        allowTaint: true,
                        scrollX: 0,
                        scrollY: -window.scrollY,
                        onclone: (clonedDoc, element) => {
                            const el = element as HTMLElement;

                            // Nuclear Option: Remove all style/link tags that might contain modern CSS
                            // html2canvas crashes if it even SEES 'lab(' in a stylesheet, even if unused.
                            const styles = clonedDoc.querySelectorAll("style, link[rel='stylesheet']");
                            styles.forEach(s => {
                                const content = s.textContent || "";
                                if (content.includes("lab(") || content.includes("oklch(") || content.includes("hwb(")) {
                                    s.remove();
                                }
                            });

                            // Re-inject essential, safe styles for the editor
                            const safeStyle = clonedDoc.createElement("style");
                            safeStyle.innerHTML = `
                                .bg-white { background-color: #ffffff !important; }
                                .p-8 { padding: 2rem !important; }
                                .sm\\:p-16 { padding: 4rem !important; }
                                .text-gray-900 { color: #111827 !important; }
                                .font-serif { font-family: Georgia, serif !important; }
                                .font-mono { font-family: monospace !important; }
                                .leading-relaxed { line-height: 1.625 !important; }
                                .min-h-full { min-height: 100% !important; }
                                .absolute { position: absolute !important; }
                                .z-20 { z-index: 20 !important; }
                                .annotation-item { display: block !important; visibility: visible !important; }
                                * { 
                                    box-shadow: none !important; 
                                    text-shadow: none !important; 
                                    animation: none !important; 
                                    transition: none !important;
                                    filter: none !important;
                                    backdrop-filter: none !important;
                                }
                            `;
                            clonedDoc.head.appendChild(safeStyle);

                            // Force container visibility and layout
                            el.style.display = "block";
                            el.style.visibility = "visible";
                            el.style.position = "relative";
                            el.style.backgroundColor = "#ffffff";
                            el.style.left = "0";
                            el.style.top = "0";
                            el.style.transform = "none";

                            // Scrub remaining inline styles on all elements
                            clonedDoc.querySelectorAll("*").forEach((node) => {
                                if (node instanceof HTMLElement) {
                                    const style = node.getAttribute("style") || "";
                                    if (style.includes("lab") || style.includes("oklch") || style.includes("hwb")) {
                                        node.style.color = "black";
                                        node.style.backgroundColor = "transparent";
                                        node.style.borderColor = "black";
                                        node.style.boxShadow = "none";
                                    }
                                }
                            });
                        }
                    });

                    const dataUrl = canvas.toDataURL("image/png");
                    if (dataUrl.length < 100) return null;

                    return dataUrl;
                } catch (err) {
                    console.error("Capture failed for page", index, err);
                    return null;
                }
            }; if (mode === "annotator") {
                if (downloadFormat === "pdf") {
                    if (fileType === "pdf" && pdfBytes) {
                        await downloadAnnotatedPdf(pdfBytes, annotations, fileName);
                    } else {
                        // DOCX/TXT to PDF
                        const imgDataUrl = await capturePage(0);
                        if (!imgDataUrl) {
                            setLoading(false);
                            alert("Failed to capture document content.");
                            return;
                        }
                        const pdfDoc = await PDFDocument.create();
                        const response = await fetch(imgDataUrl);
                        const pngBytes = await response.arrayBuffer();
                        const pngImage = await pdfDoc.embedPng(pngBytes);

                        // Always use A4 so the downloaded PDF opens at full, readable size
                        const A4_W = 595.28, A4_H = 841.89;
                        const page = pdfDoc.addPage([A4_W, A4_H]);
                        page.drawImage(pngImage, { x: 0, y: 0, width: A4_W, height: A4_H });

                        const saved = await pdfDoc.save();
                        triggerDownload(new Blob([saved as any], { type: "application/pdf" }), `${fileName}.pdf`);
                    }
                } else {
                    // Export to DOCX
                    const sections = [];
                    const pagesToCapture = fileType === "pdf" ? numPages : 1;

                    for (let i = 0; i < pagesToCapture; i++) {
                        const imgDataUrl = await capturePage(i);
                        if (imgDataUrl) {
                            const base64 = imgDataUrl.split(",")[1];
                            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

                            // Calculate height based on A4 width (approx 600pt) to maintain aspect ratio
                            // Container is 816x1056 (approx 1.29 ratio)
                            const docWidth = 600;
                            const docHeight = fileType === "pdf" ? 780 : 776; // Match A4 proportions

                            sections.push({
                                properties: {
                                    page: {
                                        margin: { top: 0, right: 0, bottom: 0, left: 0 },
                                        size: { width: 11906, height: 16838 }, // A4 in TWIPs
                                    },
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: bytes,
                                                transformation: {
                                                    width: 595, // Full A4 width in points
                                                    height: 842, // Full A4 height in points
                                                },
                                                type: "png",
                                            }),
                                        ],
                                    }),
                                ],
                            });
                        }
                    }

                    if (sections.length === 0) {
                        setLoading(false);
                        alert("Could not capture any document pages. Please try again.");
                        return;
                    }

                    const doc = new Document({ sections });
                    const blob = await Packer.toBlob(doc);
                    triggerDownload(blob, `${fileName}.docx`);
                }
            } else if (mode === "converter") {
                const dataUrlToBytes = (dataUrl: string): Uint8Array => {
                    const base64 = dataUrl.split(",")[1];
                    const binary = atob(base64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    return bytes;
                };

                // Resolve page dimensions in PDF points (1mm = 2.8346pt)
                const MM_TO_PT = 2.8346;
                const getPageSize = async (): Promise<{ pageW: number; pageH: number }> => {
                    if (!converterSize || converterSize.preset === "a4") {
                        return { pageW: 595.28, pageH: 841.89 };
                    }
                    if (converterSize.preset === "original") {
                        // Use natural image pixel size as points (96dpi → pt: px * 0.75)
                        return new Promise((resolve) => {
                            const img = new window.Image();
                            img.onload = () => resolve({ pageW: img.naturalWidth * 0.75, pageH: img.naturalHeight * 0.75 });
                            img.src = imageData;
                        });
                    }
                    // custom mm → pt
                    return { pageW: converterSize.customWidth * MM_TO_PT, pageH: converterSize.customHeight * MM_TO_PT };
                };

                if (downloadFormat === "pdf") {
                    const pdfDoc = await PDFDocument.create();
                    const imgBytes = dataUrlToBytes(imageData);
                    const embeddedImg = imageData.startsWith("data:image/png")
                        ? await pdfDoc.embedPng(imgBytes)
                        : await pdfDoc.embedJpg(imgBytes);

                    const { pageW, pageH } = await getPageSize();
                    const isOriginal = converterSize?.preset === "original";
                    const page = pdfDoc.addPage([pageW, pageH]);

                    if (isOriginal) {
                        // Fill page exactly
                        page.drawImage(embeddedImg, { x: 0, y: 0, width: pageW, height: pageH });
                    } else {
                        // Fit image centred with margin
                        const margin = pageW * 0.067;
                        const maxW = pageW - margin * 2;
                        const maxH = pageH - margin * 2;
                        const imgRatio = embeddedImg.width / embeddedImg.height;
                        let drawW = maxW, drawH = maxW / imgRatio;
                        if (drawH > maxH) { drawH = maxH; drawW = maxH * imgRatio; }
                        page.drawImage(embeddedImg, {
                            x: (pageW - drawW) / 2,
                            y: (pageH - drawH) / 2,
                            width: drawW,
                            height: drawH,
                        });
                    }
                    const saved = await pdfDoc.save();
                    triggerDownload(new Blob([saved as any], { type: "application/pdf" }), `${fileName}.pdf`);
                } else {
                    const imgBytes = dataUrlToBytes(imageData);
                    const isPng = imageData.startsWith("data:image/png");
                    const { Document, Packer, Paragraph, ImageRun, AlignmentType } = await import("docx");

                    // Unit helpers
                    // docx page size = twips  (1 mm = 56.6929 twips)
                    // ImageRun transformation = pixels at 96 dpi  (1 mm = 3.7795 px)
                    const mmToTwips = (mm: number) => Math.round(mm * 56.6929);
                    const mmToPx = (mm: number) => Math.round(mm * 3.7795);
                    const pxToMm = (px: number) => px * 0.2646;

                    // Get natural image dimensions
                    const { natW, natH } = await new Promise<{ natW: number; natH: number }>((resolve) => {
                        const img = new window.Image();
                        img.onload = () => resolve({ natW: img.naturalWidth, natH: img.naturalHeight });
                        img.src = imageData;
                    });

                    // Resolve page size in mm
                    let pageMmW: number, pageMmH: number;
                    if (!converterSize || converterSize.preset === "a4") {
                        pageMmW = 210; pageMmH = 297;
                    } else if (converterSize.preset === "original") {
                        pageMmW = pxToMm(natW); pageMmH = pxToMm(natH);
                    } else {
                        pageMmW = converterSize.customWidth; pageMmH = converterSize.customHeight;
                    }

                    const isOriginalPreset = converterSize?.preset === "original";

                    // Image display size in pixels
                    let imgPxW: number, imgPxH: number;
                    if (isOriginalPreset) {
                        // Fill the page exactly
                        imgPxW = mmToPx(pageMmW);
                        imgPxH = mmToPx(pageMmH);
                    } else {
                        // Fit centred with margin (mirrors PDF logic)
                        const MARGIN_FRAC = 0.067;
                        const availMmW = pageMmW * (1 - MARGIN_FRAC * 2);
                        const availMmH = pageMmH * (1 - MARGIN_FRAC * 2);
                        const imgRatio = natW / natH;
                        let drawMmW = availMmW, drawMmH = availMmW / imgRatio;
                        if (drawMmH > availMmH) { drawMmH = availMmH; drawMmW = availMmH * imgRatio; }
                        imgPxW = mmToPx(drawMmW);
                        imgPxH = mmToPx(drawMmH);
                    }

                    // Vertical centering: add spacing-before to push image to vertical centre
                    // spacing.before is in twentieths of a point (twips)
                    const topMarginTwips = isOriginalPreset ? 0
                        : mmToTwips((pageMmH - imgPxH / 3.7795) / 2);

                    const doc = new Document({
                        sections: [{
                            properties: {
                                page: {
                                    margin: { top: 0, right: 0, bottom: 0, left: 0 },
                                    size: { width: mmToTwips(pageMmW), height: mmToTwips(pageMmH) },
                                },
                            },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: topMarginTwips },
                                    children: [
                                        new ImageRun({
                                            data: imgBytes,
                                            transformation: { width: imgPxW, height: imgPxH },
                                            type: isPng ? "png" : "jpg",
                                        }),
                                    ],
                                }),
                            ],
                        }],
                    });
                    const blob = await Packer.toBlob(doc);
                    triggerDownload(blob, `${fileName}.docx`);
                }
            }
        } catch (err) {
            console.error("Download failed:", err);
        } finally {
            setLoading(false);
            setDownloadModal(false);
        }
    };
    // ── Page renderer (shared for PDF pages and doc pages) ────────────────
    const renderPageContainer = (i: number) => (
        <div key={i} className="w-full flex flex-col items-center px-2 sm:px-4">
            {fileType === "pdf" && (
                <div className="flex items-center w-full max-w-[816px] px-1 mb-1">
                    <span className="text-[9px] sm:text-[10px] font-mono text-gray-200 uppercase tracking-widest">
                        {`Page ${i + 1} / ${numPages}`}
                    </span>
                </div>
            )}
            <div
                ref={(el) => { containerRefs.current[i] = el; }}
                className="relative bg-white shadow-2xl rounded-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden w-full transition-all duration-300 mx-auto"
                style={{
                    maxWidth: "816px",
                    cursor: activeTool === "pen" ? "crosshair" : activeTool === "image" && pendingImage ? "crosshair" : activeTool === "text" ? "text" : "default",
                }}
                onMouseDown={(e) => handleContainerMouseDown(e, i)}
                onClick={(e) => handleCanvasClick(e, i)}
                onMouseMove={(e) => handleContainerMouseMove(e, i)}
                onMouseUp={(e) => handleContainerMouseUp(e, i)}
                onMouseLeave={(e) => handleContainerMouseUp(e, i)}
            >
                {/* PDF canvas */}
                {fileType === "pdf" && (
                    <canvas
                        ref={(el) => { canvasRefs.current[i] = el; }}
                        className="w-full h-auto block"
                    />
                )}

                {/* DOCX rendered HTML */}
                {fileType === "docx" && (
                    <div
                        className="bg-white p-6 sm:p-16 text-gray-900 font-serif text-xs sm:text-base leading-relaxed min-h-full"
                        style={{ fontFamily: "Georgia, serif", wordBreak: "break-word" }}
                        dangerouslySetInnerHTML={{ __html: docContent }}
                    />
                )}

                {/* TXT plain text */}
                {fileType === "txt" && (
                    <pre className="bg-white p-6 sm:p-16 text-gray-900 font-mono text-[10px] sm:text-sm leading-relaxed whitespace-pre-wrap min-h-full">
                        {docContent}
                    </pre>
                )}

                {/* Image */}
                {fileType === "image" && (
                    <img src={imageData} alt="Uploaded" className="w-full h-auto object-contain bg-white" />
                )}

                {/* Annotations overlay */}
                {mode === "annotator" && annotations.filter((a) => a.page === i + 1).map((ann) => (
                    <AnnotationItem
                        key={ann.id}
                        ann={ann}
                        isSelected={ann.id === selectedId}
                        onMouseDown={(e, a) => handleAnnotationMouseDown(e, a, i)}
                        onResizeMouseDown={(e, a) => handleResizeMouseDown(e, a, i)}
                        onClick={(e, a) => handleAnnotationClick(e, a)}
                        onDelete={deleteAnnotation}
                    />
                ))}

                {/* Live pen stroke while drawing */}
                {liveStroke && liveStroke.pageIndex === i && liveStroke.points.length >= 2 && (
                    <svg
                        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 25, overflow: "visible" }}
                        viewBox="0 0 1 1"
                        preserveAspectRatio="none"
                    >
                        <path
                            d={liveStroke.points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")}
                            stroke={color}
                            strokeWidth={penStrokeWidth}
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}

                {/* Text placement input */}
                {mode === "annotator" && placing && placing.page === i + 1 && (
                    <div
                        className="absolute z-30"
                        style={{ left: `${placing.x * 100}%`, top: `${placing.y * 100}%`, transform: "translateY(-50%)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-2.5 flex gap-2 border border-amber-300">
                            <input
                                autoFocus
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && confirmText()}
                                placeholder="Type text…"
                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-36 focus:outline-none focus:border-amber-400 dark:bg-gray-700 dark:text-white"
                            />
                            <button onClick={confirmText} className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold">Add</button>
                            <button onClick={() => setPlacing(null)} className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-200 dark:text-white rounded-lg text-xs">✕</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-600 p-4 sm:p-6 font-serif text-white">

            {mode === "annotator" && (
                <DownloadModal
                    open={downloadModal}
                    fileName={fileName}
                    onFileNameChange={setFileName}
                    onConfirm={handleDownload}
                    onClose={() => setDownloadModal(false)}
                    fileType={fileType}
                    downloadFormat={downloadFormat}
                    onFormatChange={setDownloadFormat}
                    mode={mode}
                />
            )}

            {mode === "converter" && (
                <ConverterDownloadModal
                    open={downloadModal}
                    imageData={imageData}
                    fileName={fileName}
                    onFileNameChange={setFileName}
                    downloadFormat={downloadFormat}
                    onFormatChange={setDownloadFormat}
                    onConfirm={(sizeOption) => handleDownload(sizeOption)}
                    onClose={() => setDownloadModal(false)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {mode === "annotator"
                            ? <><FileText size={22} className="inline-block mr-2 -mt-1 text-amber-500" />PDF Annotator</>
                            : <><FileImage size={22} className="inline-block mr-2 -mt-1 text-amber-500" />Image Converter</>
                        }
                    </h1>
                    <p className="text-sm text-gray-200 mt-0.5">
                        {mode === "annotator"
                            ? "Upload a PDF, Word (.docx), or text file · add annotations · download as PDF"
                            : "Upload an image · convert to PDF or DOCX"
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setMode("annotator");
                            setPdfBytes(null); setAnnotations([]); setNumPages(0);
                            setSelectedId(null); setPendingImage(null);
                            setFileType(null); setDocContent(""); setImageData("");
                        }}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${mode === "annotator"
                            ? "bg-amber-500 text-white"
                            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-200 dark:text-gray-300"
                            }`}
                    >
                        Annotator
                    </button>
                    <button
                        onClick={() => {
                            setMode("converter");
                            setPdfBytes(null); setAnnotations([]); setNumPages(0);
                            setSelectedId(null); setPendingImage(null);
                            setFileType(null); setDocContent(""); setImageData("");
                        }}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${mode === "converter"
                            ? "bg-amber-500 text-white"
                            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-200 dark:text-gray-300"
                            }`}
                    >
                        Converter
                    </button>
                    {hasFile && (
                        <button
                            onClick={() => {
                                if (!user) {
                                    // Save state before redirect - convert ArrayBuffer to base64
                                    let pdfB64 = "";
                                    if (pdfBytes) {
                                        const bytes = new Uint8Array(pdfBytes);
                                        let binary = "";
                                        for (let i = 0; i < bytes.length; i++) {
                                            binary += String.fromCharCode(bytes[i]);
                                        }
                                        pdfB64 = btoa(binary);
                                    }
                                    
                                    saveTempData("pdfeditor", {
                                        annotations,
                                        mode,
                                        fileType,
                                        docContent,
                                        imageData,
                                        fileName,
                                        originalFileName,
                                        pdfBase64: pdfB64,
                                    });
                                    
                                    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
                                    showAlert({
                                        title: "Login Required",
                                        message: "Please login to download your work.",
                                        type: "warning",
                                        confirmText: "Login",
                                        linkToLogin: true,
                                    });
                                    return;
                                }
                                setDownloadModal(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow transition-colors"
                        >
                            ⬇ Download {mode === "converter" ? "as File" : "as PDF"}
                        </button>
                    )}
                </div>
            </div>

            {/* Upload zone */}
            {!hasFile ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative max-w-2xl mx-auto rounded-3xl transition-all duration-300
                        ${dragOver
                            ? "bg-amber-500/10 border-2 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.15)]"
                            : "border-2 border-dashed border-gray-500 hover:border-amber-400/70 hover:bg-amber-500/5"
                        }`}
                >
                    <label className="flex flex-col items-center justify-center gap-5 p-10 sm:p-16 cursor-pointer">
                        {/* Icon ring */}
                        <div className={`relative flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300
                            ${dragOver ? "bg-amber-400/20 scale-110" : "bg-gray-800"}`}>
                            <UploadCloud
                                size={36}
                                className={`transition-colors duration-300 ${dragOver ? "text-amber-400" : "text-gray-200"}`}
                            />
                            {dragOver && (
                                <span className="absolute inset-0 rounded-2xl border-2 border-amber-400 animate-ping opacity-30" />
                            )}
                        </div>

                        {/* Text */}
                        <div className="text-center space-y-1.5">
                            <p className="text-lg font-bold text-white">
                                {dragOver ? "Drop to upload" : "Drop file here or click to browse"}
                            </p>
                            <p className="text-sm text-gray-200">
                                {mode === "annotator"
                                    ? "Annotate, then download as PDF or DOCX"
                                    : "Convert your image to PDF or DOCX"
                                }
                            </p>
                        </div>

                        {/* Format badges */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {mode === "annotator" ? (
                                <>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                                        <FileText size={12} /> PDF
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                                        <FileText size={12} /> DOCX
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-200 text-xs font-semibold">
                                        <FileType2 size={12} /> TXT
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
                                        <FileImage size={12} /> PNG
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                                        <FileImage size={12} /> JPG
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                                        <FileImage size={12} /> JPEG
                                    </span>
                                </>
                            )}
                        </div>

                        <input
                            type="file"
                            accept={mode === "annotator" ? ".pdf,.docx,.txt" : ".png,.jpg,.jpeg"}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {mode === "annotator" && (
                        <Toolbar
                            activeTool={activeTool}
                            onToolChange={(t) => { setActiveTool(t); setPendingImage(null); setPlacing(null); setSelectedId(null); }}
                            fontSize={fontSize}
                            color={color}
                            onFontSizeChange={setFontSize}
                            onColorChange={setColor}
                            bold={bold}
                            onBoldChange={setBold}
                            penStrokeWidth={penStrokeWidth}
                            onPenStrokeWidthChange={setPenStrokeWidth}
                            onImageFileSelected={(dataUrl, mimeType) => { setPendingImage({ dataUrl, mimeType }); setActiveTool("image"); }}
                            selectedAnnotation={selectedAnnotation}
                            onUpdateAnnotation={updateAnnotation}
                            onDeleteAnnotation={deleteAnnotation}
                            annotationCount={annotations.length}
                            onChangeFile={() => {
                                setPdfBytes(null); setAnnotations([]); setNumPages(0);
                                setSelectedId(null); setPendingImage(null);
                                setFileType(null); setDocContent(""); setImageData("");
                            }}
                            pendingImage={!!pendingImage}
                        />
                    )}

                    {loading && (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    <div className="flex flex-col gap-6 items-center">
                        {/* PDF: one container per page */}
                        {fileType === "pdf" && Array.from({ length: numPages }, (_, i) => renderPageContainer(i))}

                        {/* DOCX / TXT: single page container */}
                        {(fileType === "docx" || fileType === "txt") && renderPageContainer(0)}

                        {/* Image */}
                        {fileType === "image" && renderPageContainer(0)}
                    </div>
                </div>
            )}
        </div>
    );
}
