"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Sparkles, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { removeBackground, preload } from "@imgly/background-removal";
import { useAppContext } from "@/context/AppContext";
import { saveTempData, loadTempData, clearTempData } from "@/lib/tempData";
import { useAlert } from "@/hooks/useAlert";
import { useLanguage } from "@/context/LanguageContext";

const BG_CONFIG = {
    device: "gpu" as const,
    model: "isnet_quint8" as const,
    output: { format: "image/png" as const },
};


export default function BackgroundRemovalPage() {
    const { user } = useAppContext();
    const { showAlert } = useAlert();
    const { t } = useLanguage();
    const [sourcePreview, setSourcePreview] = useState<string | null>(null);
    const [resultPreview, setResultPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const resultRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [restored, setRestored] = useState(false);

    useEffect(() => {
        if (restored) return;
        const savedData = loadTempData<{
            sourcePreviewDataUrl: string;
            resultPreviewDataUrl: string;
            fileName: string;
        }>("backgroundremoval");

        if (savedData && savedData.sourcePreviewDataUrl) {
            setSourcePreview(savedData.sourcePreviewDataUrl);
            if (savedData.resultPreviewDataUrl) setResultPreview(savedData.resultPreviewDataUrl);
            setFileName(savedData.fileName);
            showAlert({ title: "Welcome Back!", message: "Your image has been restored.", type: "success", confirmText: "Got it" });
            clearTempData("backgroundremoval");
            setRestored(true);
        }
    }, [restored, showAlert]);

    const imageUrlToDataUrl = (imgUrl: string): Promise<string> =>
        new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) { reject(new Error("No context")); return; }
                ctx.drawImage(img, 0, 0);
                try { resolve(canvas.toDataURL("image/png")); } catch (e) { reject(e); }
            };
            img.onerror = reject;
            img.src = imgUrl;
        });

    const handleDownload = async () => {
        if (!user) {
            if (sourcePreview) {
                let src = sourcePreview, res = resultPreview || "";
                try { src = await imageUrlToDataUrl(sourcePreview); } catch { }
                if (resultPreview) { try { res = await imageUrlToDataUrl(resultPreview); } catch { } }
                saveTempData("backgroundremoval", { sourcePreviewDataUrl: src, resultPreviewDataUrl: res, fileName: fileName || "" });
            }
            sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
            showAlert({ title: "Login Required", message: "Please login to download.", type: "warning", confirmText: "Login", linkToLogin: true });
            return;
        }
        const link = document.createElement("a");
        link.href = resultPreview!;
        link.download = fileName ? `${fileName.replace(/\.[^.]+$/, "")}-no-bg.png` : "no-bg.png";
        link.click();
    };

    useEffect(() => {
        if (resultPreview && resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [resultPreview]);

    useEffect(() => {
        return () => {
            if (sourcePreview) URL.revokeObjectURL(sourcePreview);
            if (resultPreview) URL.revokeObjectURL(resultPreview);
        };
    }, [sourcePreview, resultPreview]);

    useEffect(() => {
        if (!loading) { setProgress(0); return; }
        setProgress(0);
        const steps = [15, 35, 55, 72, 88];
        const timers = steps.map((p, i) => setTimeout(() => setProgress(p), (i + 1) * 1800));
        return () => timers.forEach(clearTimeout);
    }, [loading]);

    const applyFile = (file: File) => {
        setSelectedFile(file);
        setSourcePreview(URL.createObjectURL(file));
        setResultPreview(null);
        setFileName(file.name);
        preload(BG_CONFIG);
    };

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) applyFile(f); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith("image/")) applyFile(f);
    };

    const handleRemove = async () => {
        if (!selectedFile) { toast.error(t.backgroundRemoval?.status?.error || "Please choose an image first."); return; }
        setLoading(true);
        try {
            const blob = await removeBackground(selectedFile, BG_CONFIG);
            setResultPreview(URL.createObjectURL(blob as Blob));
            setProgress(100);
            toast.success(t.backgroundRemoval?.status?.success || "Background removed!");
        } catch (err) {
            console.error(err);
            toast.error(t.backgroundRemoval?.status?.error || "Background removal failed.");
        } finally { setLoading(false); }
    };

    const handleReset = () => {
        if (sourcePreview) URL.revokeObjectURL(sourcePreview);
        if (resultPreview) URL.revokeObjectURL(resultPreview);
        setSelectedFile(null); setSourcePreview(null); setResultPreview(null); setFileName(null); setProgress(0);
    };

    const activeStep = resultPreview ? 3 : loading ? 2 : sourcePreview ? 1 : 0;
    const steps = [
        { num: "01", title: t.backgroundRemoval?.steps?.upload || "Upload", desc: t.backgroundRemoval?.steps?.uploadDesc || "Drop or pick any image" },
        { num: "02", title: t.backgroundRemoval?.steps?.process || "Process", desc: t.backgroundRemoval?.steps?.processDesc || "AI removes the background" },
        { num: "03", title: t.backgroundRemoval?.steps?.download || "Download", desc: t.backgroundRemoval?.steps?.downloadDesc || "Save transparent PNG" },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans flex">

            {/* ── Desktop sidebar (hidden on mobile) ── */}
            <aside className="w-64 lg:w-80 shrink-0 bg-gray-900 border-r border-white/5 flex-col hidden md:flex">
                <div className="p-6 flex flex-col gap-6 overflow-hidden">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 uppercase tracking-widest">
                            <Sparkles size={12} /> {t.backgroundRemoval?.aiPowered || "AI-Powered"}
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                            {t.backgroundRemoval?.title || "Remove Background"}
                        </h1>
                        <p className="text-gray-400 text-xs">
                            {t.backgroundRemoval?.description || "Drop any image and get a clean transparent PNG in seconds"} — {t.backgroundRemoval?.fullyInBrowser || "fully in-browser, no upload needed"}.
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                        {steps.map(({ num, title, desc }, i) => {
                            const stepNum = i + 1;
                            const isActive = activeStep === stepNum;
                            const isDone = activeStep > stepNum;
                            return (
                                <div key={num} className={`rounded-xl px-4 py-3 border transition-all duration-500
                                    ${isActive ? "bg-violet-500/15 border-violet-500/50 shadow-lg shadow-violet-900/20"
                                        : isDone ? "bg-green-500/10 border-green-500/30"
                                            : "bg-white/[0.03] border-white/[0.07]"}`}
                                >
                                    <p className={`text-xs font-bold mb-1 ${isActive ? "text-violet-400" : isDone ? "text-green-400" : "text-gray-600"}`}>
                                        {isDone ? "✓" : num}
                                    </p>
                                    <p className={`text-sm font-semibold ${isActive ? "text-white" : isDone ? "text-green-300" : "text-gray-500"}`}>{title}</p>
                                    <p className={`text-xs mt-0.5 ${isActive ? "text-violet-300/80" : isDone ? "text-green-500/70" : "text-gray-600"}`}>{desc}</p>
                                    {isActive && loading && <span className="mt-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Supported formats */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.backgroundRemoval?.formats?.title || "Supported Formats"}</p>
                        <div className="flex flex-wrap gap-2">
                            {["PNG", "JPG", "WebP"].map((f) => (
                                <span key={f} className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-400 font-medium">{f}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 space-y-6">

                    {/* Mobile header — replaces sidebar on small screens */}
                    <div className="md:hidden space-y-4">
                        {/* Title row */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-300 uppercase tracking-widest mb-1.5">
                                    <Sparkles size={10} /> {t.backgroundRemoval?.aiPowered || "AI-Powered"}
                                </div>
                                <h1 className="text-xl font-extrabold tracking-tight text-white">
                                    {t.backgroundRemoval?.title || "Remove Background"}
                                </h1>
                            </div>
                        </div>

                        {/* Step progress pills */}
                        <div className="flex items-center gap-2">
                            {steps.map(({ num, title }, i) => {
                                const stepNum = i + 1;
                                const isActive = activeStep === stepNum;
                                const isDone = activeStep > stepNum;
                                return (
                                    <div key={num} className="flex items-center gap-1.5 flex-1">
                                        <div className={`flex items-center gap-1.5 flex-1 rounded-xl px-2.5 py-2 border text-xs font-semibold transition-all duration-300
                                            ${isActive ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                                                : isDone ? "bg-green-500/10 border-green-500/30 text-green-400"
                                                    : "bg-white/5 border-white/10 text-gray-600"}`}
                                        >
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0
                                                ${isActive ? "bg-violet-500 text-white" : isDone ? "bg-green-500 text-white" : "bg-white/10 text-gray-500"}`}>
                                                {isDone ? "✓" : stepNum}
                                            </span>
                                            <span className="truncate">{title}</span>
                                            {isActive && loading && <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent shrink-0" />}
                                        </div>
                                        {i < steps.length - 1 && <div className={`w-3 h-px shrink-0 ${isDone ? "bg-green-500/50" : "bg-white/10"}`} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Upload zone */}
                    {!sourcePreview ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 px-6 py-14 sm:py-20
                                ${dragOver ? "border-violet-500 bg-violet-500/10 scale-[1.01]" : "border-white/10 bg-white/[0.03] hover:border-violet-500/50 hover:bg-white/[0.06]"}`}
                        >
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${dragOver ? "bg-violet-500/20" : "bg-white/5"}`}>
                                <UploadCloud size={28} className={dragOver ? "text-violet-400" : "text-gray-400"} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-white">
                                    {dragOver ? "Drop it here!" : (t.backgroundRemoval?.dropzone?.dragDrop || "Tap to pick an image")}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">PNG, JPG, WebP</p>
                            </div>
                            {/* Big tap target hint on mobile */}
                            <div className="md:hidden flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30">
                                <UploadCloud size={15} /> Choose Photo
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Before / After — stacked on mobile, side-by-side on sm+ */}
                            <div className={`grid gap-4 ${resultPreview ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-xl mx-auto"}`}>
                                {/* Original */}
                                <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Original</span>
                                        <button onClick={handleReset} className="rounded-md p-1.5 text-gray-500 hover:bg-white/10 hover:text-white transition-colors">
                                            <X size={15} />
                                        </button>
                                    </div>
                                    <div className="relative bg-[url('/checker.png')] bg-repeat flex items-center justify-center p-3 min-h-48 sm:min-h-64">
                                        <img src={sourcePreview} alt="original" className="max-h-48 sm:max-h-64 w-auto object-contain rounded-lg" />
                                    </div>
                                    <div className="px-4 py-2.5 border-t border-white/10">
                                        <p className="text-xs text-gray-500 truncate">{fileName}</p>
                                    </div>
                                </div>

                                {/* Result */}
                                {resultPreview && (
                                    <div ref={resultRef} className="rounded-2xl bg-white/[0.04] border border-violet-500/30 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                            <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Result</span>
                                            <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-md bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors">
                                                <Download size={13} /> {t.backgroundRemoval?.buttons?.downloadPng || "Download PNG"}
                                            </button>
                                        </div>
                                        <div className="relative flex items-center justify-center p-3 min-h-48 sm:min-h-64"
                                            style={{ background: "repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 0 0 / 20px 20px" }}>
                                            <img src={resultPreview} alt="result" className="max-h-48 sm:max-h-64 w-auto object-contain rounded-lg" />
                                        </div>
                                        <div className="px-4 py-2.5 border-t border-white/10">
                                            <p className="text-xs text-violet-400 font-medium">✓ Background removed</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar */}
                            {loading && (
                                <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-300 font-medium flex items-center gap-2">
                                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                                            {t.backgroundRemoval?.status?.processing || "Removing background…"}
                                        </span>
                                        <span className="text-violet-400 font-semibold tabular-nums">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}

                            {/* Actions — full width on mobile */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={handleRemove} disabled={loading || !!resultPreview}
                                    className="flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-3.5 sm:py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Sparkles size={16} />
                                    {loading ? (t.backgroundRemoval?.buttons?.processing || "Processing…") : (t.backgroundRemoval?.buttons?.removeBackground || "Remove Background")}
                                </button>
                                <button onClick={() => { handleReset(); setTimeout(() => fileInputRef.current?.click(), 50); }} disabled={loading}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3.5 sm:py-3 text-sm font-semibold text-gray-300 transition-all active:scale-95 disabled:opacity-50">
                                    <ImageIcon size={16} /> {t.backgroundRemoval?.buttons?.newImage || "New Image"}
                                </button>
                                <button onClick={handleReset} disabled={loading}
                                    className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 px-4 py-3.5 sm:py-3 text-sm font-semibold text-gray-500 transition-all active:scale-95 disabled:opacity-50 sm:w-auto">
                                    <Trash2 size={16} /> <span className="sm:hidden">Clear</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
