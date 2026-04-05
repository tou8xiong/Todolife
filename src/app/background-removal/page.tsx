"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { removeBackground } from "@imgly/background-removal";

export default function BackgroundRemovalPage() {
    const [sourcePreview, setSourcePreview] = useState<string | null>(null);
    const [resultPreview, setResultPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const resultRef = useRef<HTMLDivElement | null>(null);

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

    const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setSelectedFile(file);
        setSourcePreview(url);
        setResultPreview(null);
        setFileName(file.name);
    };

    const handleRemove = async () => {
        if (!selectedFile) {
            toast.error("Please choose an image first.");
            return;
        }

        setLoading(true);
        try {
            const resultBlob = await removeBackground(selectedFile, {
                output: { format: "image/png" },
            });
            const resultUrl = URL.createObjectURL(resultBlob as Blob);
            setResultPreview(resultUrl);
            toast.success("Background removed successfully!");
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
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-4xl">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-xl space-y-8">
                    <div className="space-y-4">
                        <p className="text-sm uppercase tracking-[0.35em] text-amber-600 font-semibold">Background removal</p>
                        <h1 className="text-3xl font-extrabold sm:text-4xl">Remove image background</h1>
                        <p className="max-w-2xl text-slate-600">Choose a file, remove the background in-browser, then download a transparent PNG.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6 space-y-6">
                        <label className="block rounded-3xl border border-dashed border-slate-300 bg-white p-4 sm:p-6 lg:p-8 text-center cursor-pointer transition hover:border-amber-500">
                            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                            <UploadCloud size={28} className="mx-auto text-slate-700" />
                            <p className="mt-4 text-sm font-semibold text-slate-900">Select an image</p>
                            <p className="mt-2 text-xs text-slate-500">PNG, JPG, or WebP</p>
                        </label>

                        {sourcePreview && (
                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-slate-500">Selected image</p>
                                        <p className="font-medium text-slate-900 truncate">{fileName}</p>
                                    </div>
                                    <button onClick={handleReset} className="rounded-full border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                                    <img src={sourcePreview} alt="source preview" className="h-[150px] sm:h-[220px] w-full object-contain" />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleRemove}
                                disabled={!sourcePreview || loading}
                                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <ImageIcon size={18} />
                                {loading ? "Removing…" : "Remove Background"}
                            </button>
                            <button
                                onClick={handleReset}
                                type="button"
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                <Trash2 size={18} /> Reset
                            </button>
                        </div>

                        {loading && (
                            <div className="mt-4 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <span>Removing background, please wait…</span>
                            </div>
                        )}
                    </div>

                    {resultPreview && (
                        <div ref={resultRef} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.35em] text-amber-600 font-semibold">Done</p>
                                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Download your PNG</h2>
                                </div>
                                <a
                                    href={resultPreview}
                                    download={fileName ? `${fileName.replace(/\.[^.]+$/, "")}-no-bg.png` : "no-bg.png"}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    <CheckCircle2 size={18} /> Download PNG
                                </a>
                            </div>
                            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4">
                                <img src={resultPreview} alt="result preview" className="h-[200px] sm:h-[360px] w-full object-contain" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

