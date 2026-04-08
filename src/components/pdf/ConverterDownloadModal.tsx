"use client";
import { useEffect, useRef, useState } from "react";
import { FileText, Download, X, Monitor, FileImage, SlidersHorizontal } from "lucide-react";

type SizePreset = "original" | "a4" | "custom";

export interface ConverterSizeOption {
    preset: SizePreset;
    customWidth: number;   // mm
    customHeight: number;  // mm
}

interface Props {
    open: boolean;
    imageData: string;
    fileName: string;
    onFileNameChange: (name: string) => void;
    downloadFormat: "pdf" | "docx";
    onFormatChange: (format: "pdf" | "docx") => void;
    onConfirm: (sizeOption: ConverterSizeOption) => void;
    onClose: () => void;
}

const A4_W_MM = 210;
const A4_H_MM = 297;

export default function ConverterDownloadModal({
    open, imageData, fileName, onFileNameChange,
    downloadFormat, onFormatChange, onConfirm, onClose,
}: Props) {
    const [preset, setPreset] = useState<SizePreset>("a4");
    const [customWidth, setCustomWidth] = useState(210);
    const [customHeight, setCustomHeight] = useState(297);
    const [naturalW, setNaturalW] = useState(0);
    const [naturalH, setNaturalH] = useState(0);

    // Load natural image dimensions
    useEffect(() => {
        if (!imageData) return;
        const img = new Image();
        img.onload = () => {
            setNaturalW(img.naturalWidth);
            setNaturalH(img.naturalHeight);
            // init custom to image pixel size expressed as mm (96 dpi → px*0.265mm)
            const wMm = Math.round(img.naturalWidth * 0.2646);
            const hMm = Math.round(img.naturalHeight * 0.2646);
            setCustomWidth(wMm);
            setCustomHeight(hMm);
        };
        img.src = imageData;
    }, [imageData]);

    if (!open) return null;

    // Page aspect ratio for preview
    const pageAspect = (() => {
        if (preset === "a4") return A4_W_MM / A4_H_MM;
        if (preset === "original") return naturalW > 0 ? naturalW / naturalH : 1;
        return customWidth / (customHeight || 1);
    })();

    // Image aspect ratio
    const imgAspect = naturalW > 0 ? naturalW / naturalH : 1;

    // For preview: how does the image sit on the page?
    // "original" → image fills the page exactly
    // "a4" / "custom" → image fits centered with margin
    const isOriginal = preset === "original";

    // Image fill % inside the preview page
    const MARGIN_FRAC = 0.07; // 7% margin on each side
    const imgFillW = isOriginal ? 1 : (pageAspect > imgAspect
        ? (imgAspect / pageAspect) * (1 - MARGIN_FRAC * 2)
        : (1 - MARGIN_FRAC * 2));
    const imgFillH = isOriginal ? 1 : (pageAspect > imgAspect
        ? (1 - MARGIN_FRAC * 2)
        : (pageAspect / imgAspect) * (1 - MARGIN_FRAC * 2));

    const handleConfirm = () => {
        onConfirm({ preset, customWidth, customHeight });
    };

    const PRESETS = [
        { key: "original" as SizePreset, label: "Original Size", sub: naturalW > 0 ? `${naturalW} × ${naturalH} px` : "Image dimensions", icon: FileImage },
        { key: "a4" as SizePreset, label: "A4", sub: "210 × 297 mm", icon: FileText },
        { key: "custom" as SizePreset, label: "Custom", sub: "Set your own size", icon: SlidersHorizontal },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[92vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Download size={16} className="text-amber-500" /> Export Image
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="overflow-y-auto flex flex-col sm:flex-row gap-6 p-6">

                    {/* ── Left: options ── */}
                    <div className="flex flex-col gap-5 flex-1 min-w-0">

                        {/* Format */}
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Format</p>
                            <div className="flex gap-2">
                                {(["pdf", "docx"] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => onFormatChange(f)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${downloadFormat === f
                                            ? "bg-amber-500 text-white border-amber-500 shadow"
                                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-400"}`}
                                    >
                                        {f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size preset */}
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Page Size</p>
                            <div className="flex flex-col gap-2">
                                {PRESETS.map(({ key, label, sub, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setPreset(key)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${preset === key
                                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-400 shadow-sm"
                                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-300"}`}
                                    >
                                        <Icon size={16} className={preset === key ? "text-amber-500" : "text-gray-400"} />
                                        <div>
                                            <p className={`text-sm font-semibold ${preset === key ? "text-amber-700 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}>{label}</p>
                                            <p className="text-xs text-gray-400">{sub}</p>
                                        </div>
                                        {preset === key && (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-amber-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom size inputs */}
                        {preset === "custom" && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Custom Size (mm)</p>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-400 mb-1 block">Width</label>
                                        <input
                                            type="number"
                                            min={10}
                                            max={2000}
                                            value={customWidth}
                                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-400 mb-1 block">Height</label>
                                        <input
                                            type="number"
                                            min={10}
                                            max={2000}
                                            value={customHeight}
                                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* File name */}
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">File name</p>
                            <div className="flex items-center border-2 border-amber-300 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors">
                                <input
                                    value={fileName}
                                    onChange={(e) => onFileNameChange(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                                    placeholder="converted"
                                    className="flex-1 px-4 py-2.5 text-sm focus:outline-none dark:bg-gray-900 dark:text-white"
                                />
                                <span className="pr-3 text-sm text-gray-400 select-none">.{downloadFormat}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: preview ── */}
                    <div className="flex flex-col items-center gap-3 sm:w-52 shrink-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest self-start">Preview</p>

                        {/* Page mock */}
                        <div className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4 min-h-[180px]">
                            <div
                                className="relative bg-white shadow-md rounded-sm overflow-hidden flex items-center justify-center"
                                style={{
                                    width: pageAspect >= 1 ? "100%" : `${pageAspect * 100}%`,
                                    aspectRatio: `${pageAspect}`,
                                    maxHeight: "220px",
                                    maxWidth: "180px",
                                }}
                            >
                                {/* Subtle page grid lines for A4/custom */}
                                {!isOriginal && (
                                    <div className="absolute inset-0 opacity-5"
                                        style={{ backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "20% 20%" }}
                                    />
                                )}
                                {imageData && (
                                    <img
                                        src={imageData}
                                        alt="preview"
                                        className="object-contain"
                                        style={{
                                            width: `${imgFillW * 100}%`,
                                            height: `${imgFillH * 100}%`,
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Dimension label */}
                        <div className="text-center">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {preset === "original" && naturalW > 0 && `${naturalW} × ${naturalH} px`}
                                {preset === "a4" && "210 × 297 mm"}
                                {preset === "custom" && `${customWidth} × ${customHeight} mm`}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">
                                {preset === "original" ? "Image size" : preset === "a4" ? "A4 Portrait" : "Custom"} · {downloadFormat.toUpperCase()}
                            </p>
                        </div>

                        {/* Monitor icon indicator */}
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-auto">
                            <Monitor size={11} /> Preview is illustrative
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                    >Cancel</button>
                    <button
                        onClick={handleConfirm}
                        className="px-5 py-2 text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-2"
                    >
                        <Download size={14} /> Download
                    </button>
                </div>
            </div>
        </div>
    );
}
