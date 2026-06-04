"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Annotation, ActiveTool, DrawAnnotation, ImageAnnotation, TextAnnotation, downloadAnnotatedPdf } from "@/lib/pdfUtils";
import Toolbar from "@/components/pdf/Toolbar";
import AnnotationItem from "@/components/pdf/AnnotationItem";
import DownloadModal from "@/components/pdf/DownloadModal";
import ConverterDownloadModal, { ConverterSizeOption } from "@/components/pdf/ConverterDownloadModal";
import {
    UploadCloud, FileText, FileImage, FileType2,
    Download, ArrowUp, ZoomIn, ZoomOut, Maximize2,
    Undo2, Redo2, Type as TypeIcon, Pen, Image as ImageLucide,
    Trash2, Info, List, X as XIcon, GripHorizontal,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveTempData, loadTempData, clearTempData } from "@/lib/tempData";
import { useAlert } from "@/hooks/useAlert";
import { useLanguage } from "@/context/LanguageContext";

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
    const { t } = useLanguage();
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
    const dragStartSnapshotRef = useRef<Annotation[] | null>(null);

    // Zoom (1.0 = 100%, range 0.5–2.5)
    const [zoom, setZoom] = useState(1.0);

    // Undo / redo history
    const historyRef = useRef<Annotation[][]>([]);
    const futureRef = useRef<Annotation[][]>([]);
    const [historyTick, setHistoryTick] = useState(0); // re-render undo/redo buttons

    // FAB / scroll-to-top
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Drag-and-drop a new file directly onto the viewer
    const [viewerDragOver, setViewerDragOver] = useState(false);

    // Floating annotations modal
    const [showAnnotationsModal, setShowAnnotationsModal] = useState(false);
    const [modalPos, setModalPos] = useState<{ x: number; y: number }>({ x: 80, y: 140 });
    const modalDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

    const selectedAnnotation = annotations.find((a) => a.id === selectedId) ?? null;
    const hasFile = fileType !== null;

    // ── Undo / redo helpers ────────────────────────────────────────────────
    const pushHistory = useCallback((snapshot: Annotation[]) => {
        historyRef.current.push(snapshot);
        if (historyRef.current.length > 50) historyRef.current.shift();
        futureRef.current = [];
        setHistoryTick((t) => t + 1);
    }, []);

    const undo = useCallback(() => {
        setAnnotations((curr) => {
            if (historyRef.current.length === 0) return curr;
            const prev = historyRef.current.pop()!;
            futureRef.current.push(curr);
            setHistoryTick((t) => t + 1);
            return prev;
        });
        setSelectedId(null);
    }, []);

    const redo = useCallback(() => {
        setAnnotations((curr) => {
            if (futureRef.current.length === 0) return curr;
            const next = futureRef.current.pop()!;
            historyRef.current.push(curr);
            setHistoryTick((t) => t + 1);
            return next;
        });
        setSelectedId(null);
    }, []);

    // Clear history when file changes
    useEffect(() => {
        historyRef.current = [];
        futureRef.current = [];
        setHistoryTick((t) => t + 1);
    }, [fileType, pdfBytes]);

    // ── Zoom helpers ───────────────────────────────────────────────────────
    const zoomIn = useCallback(() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2))), []);
    const zoomOut = useCallback(() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2))), []);
    const zoomFit = useCallback(() => setZoom(1.0), []);

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
    const pdfDocRef = useRef<any>(null);

    // 1) Load PDF and set page count when bytes change
    useEffect(() => {
        if (!pdfBytes) { pdfDocRef.current = null; return; }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
                const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
                if (cancelled) return;
                pdfDocRef.current = pdf;
                canvasRefs.current = new Array(pdf.numPages).fill(null);
                setNumPages(pdf.numPages);
            } catch (err) {
                console.error("Failed to load PDF:", err);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [pdfBytes]);

    // 2) Render pages once canvases are mounted (re-renders on zoom)
    useEffect(() => {
        const pdf = pdfDocRef.current;
        if (!pdf || numPages === 0) return;
        let cancelled = false;
        (async () => {
            try {
                for (let i = 1; i <= numPages; i++) {
                    if (cancelled) return;
                    const canvas = canvasRefs.current[i - 1];
                    if (!canvas) continue;
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 * zoom });
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport }).promise;
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [numPages, zoom]);

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
            pushHistory(annotations);
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
        pushHistory(annotations);
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
        dragStartSnapshotRef.current = annotations;
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
        dragStartSnapshotRef.current = annotations;
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
            pushHistory(annotations);
            setAnnotations((prev) => [
                ...prev,
                { id: Date.now(), type: "draw", page: pageIndex + 1, points: pen.points, color, strokeWidth: penStrokeWidth } as DrawAnnotation,
            ]);
        }
        // Finalize drag/resize → record the pre-move snapshot in history
        if (dragRef.current?.moved && dragStartSnapshotRef.current) {
            pushHistory(dragStartSnapshotRef.current);
        }
        dragStartSnapshotRef.current = null;
        penDrawRef.current = null;
        setLiveStroke(null);
        dragRef.current = null;
    };

    // ── Annotation CRUD ────────────────────────────────────────────────────
    const updateAnnotation = (updated: Annotation) => {
        pushHistory(annotations);
        setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    };

    const deleteAnnotation = (id: number) => {
        pushHistory(annotations);
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
        setSelectedId(null);
    };

    // ── Jump to a page ─────────────────────────────────────────────────────
    const scrollToPage = useCallback((pageIndex: number) => {
        const el = containerRefs.current[pageIndex];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    // ── Scroll the viewport so an annotation is centered ───────────────────
    const scrollToAnnotation = useCallback((ann: Annotation) => {
        const el = containerRefs.current[ann.page - 1];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        let yNorm: number;
        if (ann.type === "draw") {
            const ys = ann.points.map((p) => p.y);
            yNorm = (Math.min(...ys) + Math.max(...ys)) / 2;
        } else {
            yNorm = ann.y;
        }
        const pageTopAbs = rect.top + window.scrollY;
        const targetY = pageTopAbs + yNorm * rect.height - window.innerHeight / 2;
        window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }, []);

    // ── Mode switch ────────────────────────────────────────────────────────
    const switchMode = (target: Mode) => {
        setMode(target);
        setPdfBytes(null); setAnnotations([]); setNumPages(0);
        setSelectedId(null); setPendingImage(null);
        setFileType(null); setDocContent(""); setImageData("");
    };

    // ── Download request (auth gate + open modal) ──────────────────────────
    const requestDownload = () => {
        if (!user) {
            let pdfB64 = "";
            if (pdfBytes) {
                const bytes = new Uint8Array(pdfBytes);
                let binary = "";
                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                pdfB64 = btoa(binary);
            }
            saveTempData("pdfeditor", {
                annotations, mode, fileType, docContent, imageData,
                fileName, originalFileName, pdfBase64: pdfB64,
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
    };

    // ── Drop a new file onto the viewer ────────────────────────────────────
    const handleViewerDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setViewerDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(fakeEvent);
    };

    // ── Keyboard shortcuts ─────────────────────────────────────────────────
    useEffect(() => {
        if (!hasFile || mode !== "annotator") return;
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName;
            const typing = tag === "INPUT" || tag === "TEXTAREA" || (target?.isContentEditable ?? false);

            // Undo / redo work even when typing in toolbar inputs
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
                e.preventDefault(); undo(); return;
            }
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
                e.preventDefault(); redo(); return;
            }
            if (typing) return;

            if (e.key === "Escape") {
                setSelectedId(null);
                setPlacing(null);
                setPendingImage(null);
                return;
            }
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedId != null) { e.preventDefault(); deleteAnnotation(selectedId); }
                return;
            }
            const k = e.key.toLowerCase();
            if (k === "t") { setActiveTool("text"); setPlacing(null); setPendingImage(null); setSelectedId(null); }
            else if (k === "p") { setActiveTool("pen"); setPlacing(null); setPendingImage(null); setSelectedId(null); }
            else if (k === "i") { setActiveTool("image"); setPlacing(null); setSelectedId(null); }
            else if (k === "+" || k === "=") { e.preventDefault(); zoomIn(); }
            else if (k === "-" || k === "_") { e.preventDefault(); zoomOut(); }
            else if (k === "0") { e.preventDefault(); zoomFit(); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [hasFile, mode, selectedId, undo, redo, zoomIn, zoomOut, zoomFit]);

    // ── Scroll listener for FAB ────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > 300);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ── Annotations modal drag ─────────────────────────────────────────────
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const d = modalDragRef.current;
            if (!d) return;
            const x = d.origX + (e.clientX - d.startX);
            const y = d.origY + (e.clientY - d.startY);
            // Clamp inside viewport
            const maxX = window.innerWidth - 100;
            const maxY = window.innerHeight - 40;
            setModalPos({
                x: Math.max(-200, Math.min(maxX, x)),
                y: Math.max(60, Math.min(maxY, y)),
            });
        };
        const onUp = () => { modalDragRef.current = null; };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, []);

    const startModalDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        modalDragRef.current = {
            startX: e.clientX, startY: e.clientY,
            origX: modalPos.x, origY: modalPos.y,
        };
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
        <div key={i} className="flex flex-col items-center px-2 sm:px-4 transition-all duration-200" style={{ width: `${Math.round(zoom * 100)}%`, minWidth: "200px" }}>
            {fileType === "pdf" && (
                <div className="flex items-center w-full px-1 mb-1">
                    <span className="text-[9px] sm:text-[10px] font-mono text-gray-200 uppercase tracking-widest">
                        {`Page ${i + 1} / ${numPages}`}
                    </span>
                </div>
            )}
            <div
                ref={(el) => { containerRefs.current[i] = el; }}
                className="relative bg-white shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden w-full transition-all duration-200"
                style={{
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
                        <div className="rounded-md p-2 flex gap-2 border-2 border-dashed border-amber-400" style={{ background: "transparent", boxShadow: "0 0 0 4px rgba(245,158,11,0.15)" }}>
                            <input
                                autoFocus
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && confirmText()}
                                placeholder="Type text…"
                                className="bg-transparent border-0 px-2 py-1 text-sm text-gray-900 placeholder-gray-400 w-36 focus:outline-none"
                            />
                            <button onClick={confirmText} className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-white rounded-md text-xs font-semibold">Add</button>
                            <button onClick={() => setPlacing(null)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-xs">✕</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-tool p-4 sm:p-6 lg:pr-[18rem] font-serif text-white transition-all duration-300">

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

            {/* Right sidebar — title, mode buttons, download */}
            <aside className="hidden lg:flex fixed right-0 top-16 w-64 h-[calc(100vh-4rem)] flex-col gap-4 p-5 bg-gray-900/95 backdrop-blur border-l border-white/10 z-30">
                {/* Title block */}
                <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-white leading-tight">
                                {mode === "annotator"
                                    ? <><FileText size={20} className="inline-block mr-2 -mt-1 text-amber-500" />PDF Annotator</>
                                    : <><FileImage size={20} className="inline-block mr-2 -mt-1 text-amber-500" />Image Converter</>
                                }
                            </h1>
                            <div className="relative group shrink-0">
                                <button
                                    type="button"
                                    aria-label="Info"
                                    className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-amber-500/20 text-gray-300 hover:text-amber-400 transition-colors"
                                >
                                    <Info size={13} />
                                </button>
                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity duration-150 pointer-events-none">
                                    <div className="relative bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-amber-400/30 w-56">
                                        {mode === "annotator"
                                            ? "Upload a PDF, Word (.docx), or text file · add annotations · download as PDF"
                                            : "Upload an image · convert to PDF or DOCX"
                                        }
                                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-800 border-r border-t border-amber-400/30 rotate-45" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Document management &amp; conversion.</p>
                    </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Mode buttons (vertical) */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => switchMode("annotator")}
                        className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold rounded-md transition-colors ${mode === "annotator"
                            ? "bg-amber-500 text-white shadow"
                            : "bg-white/5 hover:bg-white/10 text-gray-300"
                            }`}
                    >
                        <Pen size={15} className="shrink-0" />
                        <span>{t.pdfEditor.annotator}</span>
                    </button>
                    <button
                        onClick={() => switchMode("converter")}
                        className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold rounded-md transition-colors ${mode === "converter"
                            ? "bg-amber-500 text-white shadow"
                            : "bg-white/5 hover:bg-white/10 text-gray-300"
                            }`}
                    >
                        <FileImage size={15} className="shrink-0" />
                        <span>{t.pdfEditor.converter}</span>
                    </button>
                </div>

                {/* Download at bottom */}
                {hasFile && (
                    <div className="mt-auto">
                        <div className="h-px bg-white/10 mb-3" />
                        <button
                            onClick={requestDownload}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-md shadow transition-colors"
                        >
                            <Download size={15} /> {mode === "converter" ? t.pdfEditor.downloadAsFile : t.pdfEditor.downloadAsPdf}
                        </button>
                    </div>
                )}
            </aside>

            {/* Mobile-only header: title + mode switcher (replaces hidden right sidebar) */}
            <div className="lg:hidden -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-3 sm:mb-4 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-2 px-4 sm:px-6 py-3">
                    <h1 className="text-sm font-bold text-white flex items-center gap-1.5 shrink-0 min-w-0 truncate">
                        {mode === "annotator" ? (
                            <><FileText size={15} className="text-amber-500 shrink-0" /> <span className="truncate">PDF Annotator</span></>
                        ) : (
                            <><FileImage size={15} className="text-amber-500 shrink-0" /> <span className="truncate">Image Converter</span></>
                        )}
                    </h1>
                    <div className="ml-auto flex gap-1 bg-white/5 rounded-md p-1 border border-white/10 shrink-0">
                        <button
                            onClick={() => switchMode("annotator")}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${mode === "annotator" ? "bg-amber-500 text-white shadow" : "text-gray-300 hover:bg-white/10"}`}
                        >
                            <Pen size={12} />
                            <span>{t.pdfEditor.annotator}</span>
                        </button>
                        <button
                            onClick={() => switchMode("converter")}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${mode === "converter" ? "bg-amber-500 text-white shadow" : "text-gray-300 hover:bg-white/10"}`}
                        >
                            <FileImage size={12} />
                            <span>{t.pdfEditor.converter}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload zone */}
            {!hasFile ? (
                <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] w-full">
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative w-full max-w-2xl rounded-md border-2 border-dashed backdrop-blur-md transition-all duration-300
                        ${dragOver
                            ? "bg-amber-500/15 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.15)]"
                            : "bg-white/10 border-white/30 hover:border-amber-400/70 hover:bg-white/15"
                        }`}
                >
                    <label className="flex flex-col items-center justify-center gap-3 py-10 sm:py-14 cursor-pointer">
                        <UploadCloud
                            size={56}
                            strokeWidth={1.8}
                            className={`transition-colors duration-300 ${dragOver ? "text-amber-400" : "text-white"}`}
                        />
                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-white">
                                {dragOver
                                    ? t.pdfEditor.dropToUpload
                                    : mode === "annotator"
                                        ? t.pdfEditor.uploadFilePdf
                                        : t.pdfEditor.uploadYourImage
                                }
                            </p>
                            <p className="text-xs text-gray-400">
                                {mode === "annotator"
                                    ? "PDF, DOCX, TXT · ( Size limit: 20MB)"
                                    : "PNG, JPG, JPEG · ( Size limit: 20MB)"
                                }
                            </p>
                        </div>
                        <input
                            type="file"
                            accept={mode === "annotator" ? ".pdf,.docx,.txt" : ".png,.jpg,.jpeg"}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {/* Converter sticky control bar */}
                    {mode === "converter" && (
                        <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mt-6 lg:-mr-8 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
                            <div className="flex items-center gap-2 px-4 sm:px-6 py-3">
                                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                                    <FileImage size={13} className="text-amber-400" />
                                    Image Converter
                                </span>
                                <div className="h-4 w-px bg-white/15 mx-1" />
                                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/15 text-gray-300 cursor-pointer transition-colors">
                                    <UploadCloud size={13} />
                                    Add New
                                    <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                                <button
                                    onClick={() => {
                                        setFileType(null); setImageData(""); setAnnotations([]);
                                        setSelectedId(null);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 transition-colors"
                                >
                                    <XIcon size={13} />
                                    Close
                                </button>
                                <div className="ml-auto">
                                    <button
                                        onClick={requestDownload}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-md shadow transition-colors"
                                    >
                                        <Download size={13} /> Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sticky control bar: toolbar + zoom + undo/redo */}
                    {mode === "annotator" && (
                        <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 lg:-mr-8 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
                            <div className="flex flex-col">
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

                                {/* Zoom + undo/redo row */}
                                <div className="flex flex-wrap items-center gap-1.5 bg-gray-800/40 border-t border-white/10 px-4 sm:px-6 py-1.5">
                                    <button
                                        onClick={undo}
                                        disabled={historyRef.current.length === 0}
                                        title="Undo (Ctrl+Z)"
                                        className="flex items-center justify-center w-8 h-8 rounded-md text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Undo2 size={15} />
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={futureRef.current.length === 0}
                                        title="Redo (Ctrl+Y)"
                                        className="flex items-center justify-center w-8 h-8 rounded-md text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Redo2 size={15} />
                                    </button>
                                    <div className="h-5 w-px bg-white/15 mx-1" />
                                    <button
                                        onClick={zoomOut}
                                        title="Zoom out (−)"
                                        className="flex items-center justify-center w-8 h-8 rounded-md text-gray-300 hover:bg-white/10 transition-colors"
                                    >
                                        <ZoomOut size={15} />
                                    </button>
                                    <span className="text-xs text-gray-300 tabular-nums w-12 text-center font-mono">
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <button
                                        onClick={zoomIn}
                                        title="Zoom in (+)"
                                        className="flex items-center justify-center w-8 h-8 rounded-md text-gray-300 hover:bg-white/10 transition-colors"
                                    >
                                        <ZoomIn size={15} />
                                    </button>
                                    <button
                                        onClick={zoomFit}
                                        title="Reset zoom (0)"
                                        className="flex items-center justify-center w-8 h-8 rounded-md text-gray-300 hover:bg-white/10 transition-colors"
                                    >
                                        <Maximize2 size={14} />
                                    </button>
                                    <span className="text-[10px] text-gray-400 hidden md:inline font-mono">
                                        T · P · I · Esc · Del · Ctrl+Z
                                    </span>
                                    <button
                                        onClick={() => setShowAnnotationsModal((v) => !v)}
                                        className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${showAnnotationsModal ? "bg-amber-500/20 border-amber-400/50 text-amber-300" : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"}`}
                                        title="Open annotations panel"
                                    >
                                        <List size={13} />
                                        <span>Annotations</span>
                                        {annotations.length > 0 && (
                                            <span className="bg-amber-500 text-gray-900 rounded-full px-1.5 text-[10px] font-bold leading-4">
                                                {annotations.length}
                                            </span>
                                        )}
                                    </button>
                                    {/* invisible reference to historyTick so React subscribes the bar to history updates */}
                                    <span className="hidden">{historyTick}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Body: viewer / annotations */}
                    <div className="flex gap-4 items-start">
                        {/* Viewer (also drop-target for replacing the file) */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setViewerDragOver(true); }}
                            onDragLeave={(e) => {
                                // Only clear on truly leaving the viewer
                                const rt = e.relatedTarget as Node | null;
                                if (!rt || !(e.currentTarget as Node).contains(rt)) setViewerDragOver(false);
                            }}
                            onDrop={handleViewerDrop}
                            className={`relative flex-1 min-w-0 flex flex-col gap-6 items-center overflow-x-auto rounded-2xl py-2 transition-colors ${viewerDragOver ? "bg-amber-500/5 outline outline-2 outline-amber-400/60" : ""}`}
                        >
                            {viewerDragOver && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                                    <div className="bg-amber-500/90 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-2xl">
                                        <UploadCloud size={18} /> Drop to replace current file
                                    </div>
                                </div>
                            )}

                            {/* PDF: one container per page */}
                            {fileType === "pdf" && Array.from({ length: numPages }, (_, i) => renderPageContainer(i))}

                            {/* DOCX / TXT: single page container */}
                            {(fileType === "docx" || fileType === "txt") && renderPageContainer(0)}

                            {/* Image */}
                            {fileType === "image" && renderPageContainer(0)}
                        </div>

                    </div>
                </div>
            )}

            {/* Floating, draggable Annotations modal */}
            {mode === "annotator" && hasFile && showAnnotationsModal && (
                <div
                    className="fixed z-50 w-72 max-w-[calc(100vw-1rem)] bg-gray-900/95 backdrop-blur-md border border-amber-400/30 shadow-2xl rounded-xl select-none"
                    style={{ left: modalPos.x, top: modalPos.y }}
                >
                    {/* Drag handle / header */}
                    <div
                        onMouseDown={startModalDrag}
                        className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5 rounded-t-xl cursor-move"
                    >
                        <GripHorizontal size={14} className="text-gray-500 shrink-0" />
                        <p className="text-xs font-semibold text-white flex-1">
                            Annotations
                            <span className="ml-2 text-amber-400 font-mono">{annotations.length}</span>
                        </p>
                        <button
                            onClick={() => setShowAnnotationsModal(false)}
                            className="p-1 rounded text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                            title="Close"
                        >
                            <XIcon size={13} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-3 max-h-80 overflow-y-auto">
                        {annotations.length === 0 ? (
                            <p className="text-xs text-gray-500">
                                No annotations yet. Use the toolbar to add text, draw, or insert an image.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-1">
                                {[...annotations]
                                    .sort((a, b) => a.page - b.page || a.id - b.id)
                                    .map((ann) => {
                                        const isSel = ann.id === selectedId;
                                        const Icon = ann.type === "text" ? TypeIcon : ann.type === "image" ? ImageLucide : Pen;
                                        return (
                                            <li key={ann.id} className={`rounded-lg border transition-colors ${isSel ? "bg-amber-500/15 border-amber-400/40" : "border-transparent hover:bg-white/5"}`}>
                                                <div className="flex items-center gap-2 px-2 py-1.5">
                                                    <Icon size={12} className="shrink-0 text-amber-400" />
                                                    {ann.type === "text" ? (
                                                        <input
                                                            value={(ann as TextAnnotation).text}
                                                            onChange={(e) => updateAnnotation({ ...(ann as TextAnnotation), text: e.target.value })}
                                                            onFocus={() => { setSelectedId(ann.id); scrollToAnnotation(ann); }}
                                                            className="flex-1 min-w-0 bg-transparent text-xs text-gray-200 focus:outline-none focus:bg-white/10 rounded px-1"
                                                            placeholder="(empty)"
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => { setSelectedId(ann.id); scrollToAnnotation(ann); }}
                                                            className="flex-1 text-left text-xs text-gray-200 truncate"
                                                        >
                                                            {ann.type === "image" ? "Image" : "Stroke"}
                                                        </button>
                                                    )}
                                                    <span className="text-[9px] text-gray-500 font-mono shrink-0">p{ann.page}</span>
                                                    <button
                                                        onClick={() => deleteAnnotation(ann.id)}
                                                        title="Delete"
                                                        className="shrink-0 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile FAB: download + scroll-to-top (only when a file is loaded) */}
            {hasFile && (
                <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 lg:hidden">
                    {showScrollTop && (
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            className="w-11 h-11 rounded-full bg-gray-800/90 hover:bg-gray-700 text-white shadow-lg flex items-center justify-center backdrop-blur"
                            aria-label="Scroll to top"
                        >
                            <ArrowUp size={18} />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (!user) {
                                let pdfB64 = "";
                                if (pdfBytes) {
                                    const bytes = new Uint8Array(pdfBytes);
                                    let binary = "";
                                    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                                    pdfB64 = btoa(binary);
                                }
                                saveTempData("pdfeditor", {
                                    annotations, mode, fileType, docContent, imageData,
                                    fileName, originalFileName, pdfBase64: pdfB64,
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
                        className="px-4 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl flex items-center gap-2 font-semibold text-sm"
                        aria-label="Download"
                    >
                        <Download size={16} /> Download
                    </button>
                </div>
            )}
        </div>
    );
}
