"use client";
import { useRef } from "react";
import { ActiveTool, Annotation, TextAnnotation } from "@/lib/pdfUtils";

interface Props {
    activeTool: ActiveTool;
    onToolChange: (t: ActiveTool) => void;
    fontSize: number;
    color: string;
    onFontSizeChange: (n: number) => void;
    onColorChange: (c: string) => void;
    onImageFileSelected: (dataUrl: string, mimeType: "image/png" | "image/jpeg") => void;
    selectedAnnotation: Annotation | null;
    onUpdateAnnotation: (updated: Annotation) => void;
    onDeleteAnnotation: (id: number) => void;
    annotationCount: number;
    onChangeFile: () => void;
    pendingImage: boolean;
}

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];

export default function Toolbar({
    activeTool, onToolChange,
    fontSize, color, onFontSizeChange, onColorChange,
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

    const updateText = (field: keyof TextAnnotation, value: string | number) => {
        if (!selectedAnnotation || selectedAnnotation.type !== "text") return;
        onUpdateAnnotation({ ...selectedAnnotation, [field]: value } as TextAnnotation);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-3 flex flex-wrap items-center gap-3">

            {/* Tool selector */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                    onClick={() => onToolChange("text")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTool === "text" ? "bg-amber-400 text-white shadow" : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                >✏️ Text</button>
                <button
                    onClick={() => { onToolChange("image"); fileInputRef.current?.click(); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTool === "image" ? "bg-amber-400 text-white shadow" : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                >🖼 Image</button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageFile} />

            {/* Pending image indicator */}
            {pendingImage && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold animate-pulse">
                    Click on PDF to place image
                </span>
            )}

            {/* Selected text annotation editor */}
            {selectedAnnotation?.type === "text" && (
                <div className="flex items-center gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
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

            {/* Selected image annotation editor */}
            {selectedAnnotation?.type === "image" && (
                <div className="flex items-center gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                    <span className="text-xs text-gray-400 font-semibold">Image selected</span>
                    <span className="text-xs text-gray-400">— drag to move, corner handle to resize</span>
                    <button
                        onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
                        className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >Delete</button>
                </div>
            )}

            {/* Default text tool settings (when no annotation selected) */}
            {!selectedAnnotation && activeTool === "text" && (
                <div className="flex items-center gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                    <span className="text-xs text-gray-400">Size</span>
                    <select
                        value={fontSize}
                        onChange={(e) => onFontSizeChange(Number(e.target.value))}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                    >
                        {FONT_SIZES.map((s) => <option key={s}>{s}</option>)}
                    </select>
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
    );
}
