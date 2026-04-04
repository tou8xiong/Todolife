"use client";

interface Props {
    open: boolean;
    fileName: string;
    onFileNameChange: (name: string) => void;
    onConfirm: () => void;
    onClose: () => void;
    fileType: "pdf" | "docx" | "txt" | "image" | null;
    downloadFormat: "pdf" | "docx";
    onFormatChange: (format: "pdf" | "docx") => void;
    mode: "annotator" | "converter";
}

export default function DownloadModal({ open, fileName, onFileNameChange, onConfirm, onClose, fileType, downloadFormat, onFormatChange, mode }: Props) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col gap-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">💾 Save {mode === "annotator" ? "PDF" : "File"} As</h2>
                {mode === "converter" && (
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Format</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="format"
                                    value="pdf"
                                    checked={downloadFormat === "pdf"}
                                    onChange={() => onFormatChange("pdf")}
                                />
                                PDF
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="format"
                                    value="docx"
                                    checked={downloadFormat === "docx"}
                                    onChange={() => onFormatChange("docx")}
                                />
                                DOCX
                            </label>
                        </div>
                    </div>
                )}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">File name</label>
                    <div className="flex items-center border-2 border-amber-300 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors">
                        <input
                            autoFocus
                            value={fileName}
                            onChange={(e) => onFileNameChange(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
                            placeholder="annotated"
                            className="flex-1 px-4 py-2.5 text-sm focus:outline-none dark:bg-gray-800 dark:text-white"
                        />
                        <span className="pr-3 text-sm text-gray-400 select-none">.{downloadFormat}</span>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                    >Cancel</button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    >⬇ Download</button>
                </div>
            </div>
        </div>
    );
}
