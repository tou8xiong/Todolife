"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Sparkles, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { removeBackground, preload } from "@imgly/background-removal";

const BG_CONFIG = {
    device: "gpu" as const,
    model: "medium" as const,
    output: { format: "image/png" as const },
};

export default function BackgroundRemovalPage() {
    const [sourcePreview, setSourcePreview] = useState<string | null>(null);
    const [resultPreview, setResultPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const resultRef = useRef<HTMLDivElement | null>(null); 
    const fileInputRef = useRef<HTMLInputElement | null>(null);       

    useEffect(() => {
        if (resultPreview && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
        const timers = steps.map((p, i) =>
            setTimeout(() => setProgress(p), (i + 1) * 1800)
        );
        return () => timers.forEach(clearTimeout);
    }, [loading]);

    const applyFile = (file: File) => {
        const url = URL.createObjectURL(file);
        setSelectedFile(file);
        setSourcePreview(url);
        setResultPreview(null);
        setFileName(file.name);
        preload(BG_CONFIG);
    };

    const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) applyFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) applyFile(file);
    };

    const handleRemove = async () => {
        if (!selectedFile) {
            toast.error("Please choose an image first.");
            return;
        }
        setLoading(true);
        try {
            const resultBlob = await removeBackground(selectedFile, BG_CONFIG);
            const resultUrl = URL.createObjectURL(resultBlob as Blob);
            setResultPreview(resultUrl);
            setProgress(100);
            toast.success("Background removed!");
        } catch (error) {
            console.error(error);
            toast.error("Background removal failed. Try a different image.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (sourcePreview) URL.revokeObjectURL(sourcePreview);
        if (resultPreview) URL.revokeObjectURL(resultPreview);
        setSelectedFile(null);
        setSourcePreview(null);
        setResultPreview(null);
        setFileName(null);
        setProgress(0);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">

            {/* ── Hero header ── */}
            <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 px-4 py-12 sm:py-16 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.12),_transparent_60%)]" />
                <div className="relative mx-auto max-w-2xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300 uppercase tracking-widest">
                        <Sparkles size={12} /> AI-Powered
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                        Remove Background
                    </h1>
                    <p className="mt-4 text-gray-400 text-sm sm:text-base max-w-md mx-auto">
                        Drop any image and get a clean transparent PNG in seconds — fully in-browser, no upload needed.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14 space-y-8">

                {/* ── Upload zone ── */}
                {!sourcePreview ? (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 px-6 py-16 sm:py-24
                            ${dragOver
                                ? "border-violet-500 bg-violet-500/10 scale-[1.01]"
                                : "border-white/10 bg-white/[0.03] hover:border-violet-500/50 hover:bg-white/[0.06]"
                            }`}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${dragOver ? "bg-violet-500/20" : "bg-white/5"}`}>
                            <UploadCloud size={32} className={`transition-colors ${dragOver ? "text-violet-400" : "text-gray-400"}`} />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-semibold text-white">
                                {dragOver ? "Drop it here!" : "Drop image here or click to browse"}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">PNG, JPG, WebP supported</p>
                        </div>
                        <div className="flex gap-2">
                            {["PNG", "JPG", "WebP"].map((f) => (
                                <span key={f} className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-400 font-medium">{f}</span>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── Before / After panel ── */
                    <div className="space-y-6">

                        {/* Image comparison */}
                        <div className={`grid gap-4 ${resultPreview ? "sm:grid-cols-2" : "sm:grid-cols-1 max-w-xl mx-auto"}`}>

                            {/* Original */}
                            <div className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Original</span>
                                    <button
                                        onClick={handleReset}
                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                                <div className="relative bg-[url('/checker.png')] bg-repeat flex items-center justify-center p-4 min-h-[220px] sm:min-h-[300px]">
                                    <img src={sourcePreview} alt="original" className="max-h-[260px] w-auto object-contain rounded-lg" />
                                </div>
                                <div className="px-4 py-3 border-t border-white/10">
                                    <p className="text-xs text-gray-500 truncate">{fileName}</p>
                                </div>
                            </div>

                            {/* Result */}
                            {resultPreview && (
                                <div ref={resultRef} className="rounded-2xl bg-white/[0.04] border border-violet-500/30 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                        <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Result</span>
                                        <a
                                            href={resultPreview}
                                            download={fileName ? `${fileName.replace(/\.[^.]+$/, "")}-no-bg.png` : "no-bg.png"}
                                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                                        >
                                            <Download size={13} /> Download PNG
                                        </a>
                                    </div>
                                    <div className="relative flex items-center justify-center p-4 min-h-[220px] sm:min-h-[300px]"
                                        style={{ background: "repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 0 0 / 20px 20px" }}
                                    >
                                        <img src={resultPreview} alt="result" className="max-h-[260px] w-auto object-contain rounded-lg" />
                                    </div>
                                    <div className="px-4 py-3 border-t border-white/10">
                                        <p className="text-xs text-violet-400 font-medium">✓ Background removed</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Progress bar while loading */}
                        {loading && (
                            <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-5 py-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300 font-medium flex items-center gap-2">
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                                        Removing background…
                                    </span>
                                    <span className="text-violet-400 font-semibold tabular-nums">{progress}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleRemove}
                                disabled={loading || !!resultPreview}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Sparkles size={16} />
                                {loading ? "Processing…" : "Remove Background"}
                            </button>
                            <button
                                onClick={() => { handleReset(); setTimeout(() => fileInputRef.current?.click(), 50); }}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-semibold text-gray-300 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <ImageIcon size={16} /> New Image
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 px-4 py-3 text-sm font-semibold text-gray-500 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Steps strip ── */}
                {(() => {
                    const activeStep = resultPreview ? 3 : loading ? 2 : sourcePreview ? 1 : 0;
                    const steps = [
                        { step: "01", title: "Upload", desc: "Drop or pick any image" },
                        { step: "02", title: "Process", desc: "AI removes the background" },
                        { step: "03", title: "Download", desc: "Save transparent PNG" },
                    ];
                    return (
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            {steps.map(({ step, title, desc }, i) => {
                                const stepNum = i + 1;
                                const isActive = activeStep === stepNum;
                                const isDone = activeStep > stepNum;
                                return (
                                    <div
                                        key={step}
                                        className={`rounded-2xl px-4 py-4 text-center border transition-all duration-500
                                            ${isActive ? "bg-violet-500/15 border-violet-500/50 scale-[1.03] shadow-lg shadow-violet-900/20"
                                                : isDone ? "bg-green-500/10 border-green-500/30"
                                                    : "bg-white/[0.03] border-white/[0.07]"}`}
                                    >
                                        <p className={`text-xs font-bold mb-1 transition-colors ${isActive ? "text-violet-400" : isDone ? "text-green-400" : "text-gray-600"}`}>
                                            {isDone ? "✓" : step}
                                        </p>
                                        <p className={`text-sm font-semibold transition-colors ${isActive ? "text-white" : isDone ? "text-green-300" : "text-gray-500"}`}>
                                            {title}
                                        </p>
                                        <p className={`text-xs mt-0.5 transition-colors ${isActive ? "text-violet-300/80" : isDone ? "text-green-500/70" : "text-gray-600"}`}>
                                            {desc}
                                        </p>
                                        {isActive && loading && (
                                            <span className="mt-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}

            </div>
        </div>
    );
}
