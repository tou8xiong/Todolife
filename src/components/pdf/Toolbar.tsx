"use client";
import { useRef } from "react";
import { Type, Pen, Image } from "lucide-react";
import { ActiveTool, Annotation, TextAnnotation } from "@/lib/pdfUtils";

interface Props {
    activeTool: ActiveTool;
    onToolChange: (t: ActiveTool) => void;
    fontSize: number;
    color: string;
    onFontSizeChange: (n: number) => void;
    onColorChange: (c: string) => void;
    bold: boolean;
    onBoldChange: (b: boolean) => void;
    penStrokeWidth: number;
    onPenStrokeWidthChange: (w: number) => void;
    onImageFileSelected: (dataUrl: string, mimeType: "image/png" | "image/jpeg") => void;
    selectedAnnotation: Annotation | null;
    onUpdateAnnotation: (updated: Annotation) => void;
    onDeleteAnnotation: (id: number) => void;
    annotationCount: number;
    onChangeFile: () => void;
    pendingImage: boolean;
}

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];

const PEN_SIZES = [1, 2, 3, 5, 8];

export default function Toolbar({
    activeTool, onToolChange,
    fontSize, color, onFontSizeChange, onColorChange,
    bold, onBoldChange,
    penStrokeWidth, onPenStrokeWidthChange,
    onImageFileSelected,
    selectedAnnotation, onUpdateAnnotation, onDeleteAnnotation,
    annotationCount, onChangeFile, pendingImage,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const mimeType = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
        const reader = new FileReader();
        reader.onload = (ev) => {
            onImageFileSelected(ev.target?.result as string, mimeType);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const updateText = (field: keyof TextAnnotation, value: string | number | boolean) => {
        if (!selectedAnnotation || selectedAnnotation.type !== "text") return;
        onUpdateAnnotation({ ...selectedAnnotation, [field]: value } as TextAnnotation);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-3 flex flex-col gap-2">

            {/* Row 1: tools + right controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Tool selector */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <button
                        onClick={() => onToolChange("text")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTool === "text" ? "bg-amber-400 text-white shadow" : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                    ><Type size={13} className="inline-block mr-1 -mt-0.5" />Text</button>
                    <button
                        onClick={() => onToolChange("pen")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTool === "pen" ? "bg-amber-400 text-white shadow" : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                    ><Pen size={13} className="inline-block mr-1 -mt-0.5" />Pen</button>
                    <button
                        onClick={() => { onToolChange("image"); fileInputRef.current?.click(); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTool === "image" ? "bg-amber-400 text-white shadow" : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                    ><Image size={13} className="inline-block mr-1 -mt-0.5" />Image</button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageFile} />

                {/* Pending image indicator */}
                {pendingImage && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold animate-pulse">
                        Click on PDF to place image
                    </span>
                )}

                {/* Default text settings — visible inline on desktop only */}
                {!selectedAnnotation && activeTool === "text" && (
                    <div className="hidden sm:flex items-center gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                        <span className="text-xs text-gray-400">Size</span>
                        <select
                            value={fontSize}
                            onChange={(e) => onFontSizeChange(Number(e.target.value))}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                        >
                            {FONT_SIZES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <button
                            onClick={() => onBoldChange(!bold)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border ${bold ? "bg-amber-400 text-white border-amber-400" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
                        >B</button>
                        <span className="text-xs text-gray-400">Color</span>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0"
                        />
                    </div>
                )}

                {/* Pen tool settings — visible inline on desktop only */}
                {!selectedAnnotation && activeTool === "pen" && (
                    <div className="hidden sm:flex items-center gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                        <span className="text-xs text-gray-400">Size</span>
                        <div className="flex gap-1">
                            {PEN_SIZES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onPenStrokeWidthChange(s)}
                                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center ${penStrokeWidth === s ? "bg-amber-400 text-white" : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500"}`}
                                >{s}</button>
                            ))}
                        </div>
                        <span className="text-xs text-gray-400">Color</span>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0"
                        />
                    </div>
                )}

                {/* Right side */}
                <div className="ml-auto flex items-center gap-2">
                    {annotationCount > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                            {annotationCount} annotation{annotationCount > 1 ? "s" : ""}
                        </span>
                    )}
                    <button
                        onClick={onChangeFile}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                    >Change File</button>
                </div>
            </div>

            {/* Row 2: default text settings on mobile */}
            {!selectedAnnotation && activeTool === "text" && (
                <div className="flex sm:hidden items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400">Size</span>
                    <select
                        value={fontSize}
                        onChange={(e) => onFontSizeChange(Number(e.target.value))}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                    >
                        {FONT_SIZES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button
                        onClick={() => onBoldChange(!bold)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border ${bold ? "bg-amber-400 text-white border-amber-400" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300"}`}
                    >B</button>
                    <span className="text-xs text-gray-400">Color</span>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => onColorChange(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                </div>
            )}

            {/* Row 2: pen settings on mobile */}
            {!selectedAnnotation && activeTool === "pen" && (
                <div className="flex sm:hidden items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400">Size</span>
                    <div className="flex gap-1">
                        {PEN_SIZES.map((s) => (
                            <button
                                key={s}
                                onClick={() => onPenStrokeWidthChange(s)}
                                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center ${penStrokeWidth === s ? "bg-amber-400 text-white" : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"}`}
                            >{s}</button>
                        ))}
                    </div>
                    <span className="text-xs text-gray-400">Color</span>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => onColorChange(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                </div>
            )}

            {/* Row 2: selected text annotation editor */}
            {selectedAnnotation?.type === "text" && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 font-semibold">Editing:</span>
                    <input
                        value={selectedAnnotation.text}
                        onChange={(e) => updateText("text", e.target.value)}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-sm w-32 focus:outline-none focus:border-amber-400 dark:bg-gray-700 dark:text-white"
                        placeholder="Text content"
                    />
                    <select
                        value={selectedAnnotation.fontSize}
                        onChange={(e) => updateText("fontSize", Number(e.target.value))}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                    >
                        {FONT_SIZES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button
                        onClick={() => updateText("bold", selectedAnnotation.bold ? false : true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border ${selectedAnnotation.bold ? "bg-amber-400 text-white border-amber-400" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
                    >B</button>
                    <input
                        type="color"
                        value={selectedAnnotation.color}
                        onChange={(e) => updateText("color", e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <button
                        onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
                        className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >Delete</button>
                </div>
            )}

            {/* Row 2: selected image annotation editor */}
            {selectedAnnotation?.type === "image" && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 font-semibold">Image selected</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">— drag to move, corner handle to resize</span>
                    <button
                        onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
                        className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >Delete</button>
                </div>
            )}

            {/* Row 2: selected draw annotation editor */}
            {selectedAnnotation?.type === "draw" && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 font-semibold">Stroke selected</span>
                    <button
                        onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
                        className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >Delete</button>
                </div>
            )}
        </div>
    );
}
