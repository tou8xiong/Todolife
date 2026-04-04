"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Annotation, ActiveTool, ImageAnnotation, TextAnnotation, downloadAnnotatedPdf } from "@/lib/pdfUtils";
import Toolbar from "@/components/pdf/Toolbar";
import AnnotationItem from "@/components/pdf/AnnotationItem";
import DownloadModal from "@/components/pdf/DownloadModal";

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

    const [pendingImage, setPendingImage] = useState<{ dataUrl: string; mimeType: "image/png" | "image/jpeg" } | null>(null);
    const [placing, setPlacing] = useState<Placing | null>(null);
    const [newText, setNewText] = useState("");

    const [downloadModal, setDownloadModal] = useState(false);
    const [fileName, setFileName] = useState("annotated");
    const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx">("pdf");

    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const dragRef = useRef<DragState | null>(null);

    const selectedAnnotation = annotations.find((a) => a.id === selectedId) ?? null;
    const hasFile = fileType !== null;

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

    // ── Canvas click ───────────────────────────────────────────────────────
    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
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

    const confirmText = () => {
        if (!placing || !newText.trim()) { setPlacing(null); return; }
        setAnnotations((prev) => [
            ...prev,
            { id: Date.now(), type: "text", page: placing.page, x: placing.x, y: placing.y, text: newText, fontSize, color } as TextAnnotation,
        ]);
        setPlacing(null);
        setNewText("");
    };

    // ── Drag & resize ──────────────────────────────────────────────────────
    const handleAnnotationMouseDown = (e: React.MouseEvent, ann: Annotation, pageIndex: number) => {
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

    const handleContainerMouseUp = () => { dragRef.current = null; };

    // ── Annotation CRUD ────────────────────────────────────────────────────
    const updateAnnotation = (updated: Annotation) =>
        setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

    const deleteAnnotation = (id: number) => {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
        setSelectedId(null);
    };

    // ── Download ───────────────────────────────────────────────────────────
    const handleDownload = async () => {
        if (mode === "annotator") {
            if (fileType === "pdf" && pdfBytes) {
                await downloadAnnotatedPdf(pdfBytes, annotations, fileName);

            } else if ((fileType === "docx" || fileType === "txt") && containerRefs.current[0]) {
                setLoading(true);
                try {
                    const html2canvas = (await import("html2canvas")).default;
                    const container = containerRefs.current[0]!;
                    const capturedCanvas = await html2canvas(container, { scale: 2, useCORS: true });
                    const imgDataUrl = capturedCanvas.toDataURL("image/png");

                    const { PDFDocument } = await import("pdf-lib");
                    const pdfDoc = await PDFDocument.create();
                    const response = await fetch(imgDataUrl);
                    const pngBytes = await response.arrayBuffer();
                    const pngImage = await pdfDoc.embedPng(pngBytes);
                    const { width, height } = pngImage.scale(1);
                    const page = pdfDoc.addPage([width, height]);
                    page.drawImage(pngImage, { x: 0, y: 0, width, height });

                    const saved = await pdfDoc.save();
                    const blob = new Blob(
                        [new Uint8Array(saved.buffer as ArrayBuffer, saved.byteOffset, saved.byteLength)],
                        { type: "application/pdf" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${fileName.trim() || "document"}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.error("Failed to export document:", err);
                } finally {
                    setLoading(false);
                }
            }
        } else if (mode === "converter") {
            if (fileType === "image") {
                setLoading(true);
                try {
                    if (downloadFormat === "pdf") {
                        const { PDFDocument } = await import("pdf-lib");
                        const pdfDoc = await PDFDocument.create();
                        const imgResponse = await fetch(imageData);
                        const imgBytes = await imgResponse.arrayBuffer();
                        let embeddedImg;
                        if (imageData.startsWith("data:image/png")) {
                            embeddedImg = await pdfDoc.embedPng(imgBytes);
                        } else {
                            embeddedImg = await pdfDoc.embedJpg(imgBytes);
                        }
                        const page = pdfDoc.addPage();
                        const { width, height } = embeddedImg.scale(0.75);
                        page.drawImage(embeddedImg, { x: 50, y: 50, width, height });
                        const saved = await pdfDoc.save();
                        const blob = new Blob(
                            [new Uint8Array(saved.buffer as ArrayBuffer, saved.byteOffset, saved.byteLength)],
                            { type: "application/pdf" }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${fileName}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                    } else { // docx
                        const { Document, Packer, Paragraph, ImageRun } = await import("docx");
                        const imgBuffer = await fetch(imageData).then(res => res.arrayBuffer());
                        const isPng = imageData.startsWith("data:image/png");
                        const doc = new Document({
                            sections: [{
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: imgBuffer,
                                                transformation: { width: 400, height: 300 },
                                                type: isPng ? "png" : "jpg",
                                            }),
                                        ],
                                    }),
                                ],
                            }],
                        });
                        const buffer = await Packer.toBuffer(doc);
                        const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${fileName}.docx`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                } catch (err) {
                    console.error("Failed to convert image:", err);
                } finally {
                    setLoading(false);
                }
            }
        }
        setDownloadModal(false);
    };

    // ── Page renderer (shared for PDF pages and doc pages) ────────────────
    const renderPageContainer = (i: number) => (
        <div key={i}>
            <p className="text-xs text-gray-400 text-center mb-1">
                {fileType === "pdf" ? `Page ${i + 1} of ${numPages}` : "Document Preview"}
            </p>
            <div
                ref={(el) => { containerRefs.current[i] = el; }}
                className="relative shadow-xl rounded-xl overflow-hidden"
                style={{
                    width: fileType === "pdf" ? "fit-content" : "816px",
                    minHeight: fileType !== "pdf" ? "1056px" : undefined,
                    cursor: activeTool === "image" && pendingImage ? "crosshair" : activeTool === "text" ? "text" : "default",
                }}
                onClick={(e) => handleCanvasClick(e, i)}
                onMouseMove={(e) => handleContainerMouseMove(e, i)}
                onMouseUp={handleContainerMouseUp}
                onMouseLeave={handleContainerMouseUp}
            >
                {/* PDF canvas */}
                {fileType === "pdf" && (
                    <canvas ref={(el) => { canvasRefs.current[i] = el; }} />
                )}

                {/* DOCX rendered HTML */}
                {fileType === "docx" && (
                    <div
                        className="bg-white p-12 text-gray-900 font-serif text-base leading-relaxed min-h-full"
                        style={{ fontFamily: "Georgia, serif" }}
                        dangerouslySetInnerHTML={{ __html: docContent }}
                    />
                )}

                {/* TXT plain text */}
                {fileType === "txt" && (
                    <pre className="bg-white p-12 text-gray-900 font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-full">
                        {docContent}
                    </pre>
                )}

                {/* Image */}
                {fileType === "image" && (
                    <img src={imageData} alt="Uploaded" className="w-full h-full object-contain bg-white" />
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
                            <button onClick={() => setPlacing(null)} className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-white rounded-lg text-xs">✕</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="sm:ml-45 min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 font-serif">

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

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {mode === "annotator" ? "📄 PDF Annotator" : "🖼️ Image Converter"}
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
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
                            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
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
                            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            }`}
                    >
                        Converter
                    </button>
                    {hasFile && (
                        <button
                            onClick={() => setDownloadModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow transition-colors"
                        >
                            ⬇ Download {mode === "converter" ? "as File" : "as PDF"}
                        </button>
                    )}
                </div>
            </div>

            {/* Upload zone */}
            {!hasFile ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-2xl p-16 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors max-w-2xl mx-auto">
                    <span className="text-6xl mb-4">{mode === "annotator" ? "📂" : "🖼️"}</span>
                    <p className="text-gray-700 dark:text-gray-200 font-semibold text-lg">Click to upload a file</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {mode === "annotator"
                            ? "Supports PDF, Word (.docx), and text (.txt) files"
                            : "Supports PNG, JPG, and JPEG images"
                        }
                    </p>
                    <input
                        type="file"
                        accept={mode === "annotator" ? ".pdf,.docx,.txt" : ".png,.jpg,.jpeg"}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </label>
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
                        {(fileType === "docx" || fileType === "txt") && !loading && renderPageContainer(0)}

                        {/* Image */}
                        {fileType === "image" && renderPageContainer(0)}
                    </div>
                </div>
            )}
        </div>
    );
}
