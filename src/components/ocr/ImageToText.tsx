"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import {
    Upload, Image as ImageIcon, Copy, Trash2, ScanText, Loader2, CheckCircle,
    Edit2, Save, History, X, ArrowLeft, Languages, ChevronDown, Check, Sparkles, LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import PageHelpTooltip from "@/components/ui/PageHelpTooltip";

interface HistoryItem {
    id: string;
    text: string;
    timestamp: number;
    imageName?: string;
    langs?: string[];
}

const LAYOUT_MODES: { code: string; name: string; hint: string }[] = [
    { code: 'auto', name: 'Auto (mixed layout)', hint: 'Best for documents with photos, columns, or headings' },
    { code: 'block', name: 'Single block', hint: 'Plain paragraph, screenshot of text' },
    { code: 'sparse', name: 'Sparse text', hint: 'Receipts, signs, scattered words' },
    { code: 'line', name: 'Single line', hint: 'One row of text only' },
];

interface LangEntry {
    code: string;
    name: string;
    native?: string;
}

const SUPPORTED_LANGUAGES: LangEntry[] = [
    { code: 'English', name: 'English', native: 'English' },
    { code: 'Lao', name: 'Lao', native: 'ລາວ' },
    { code: 'Thai', name: 'Thai', native: 'ไทย' },
    { code: 'Chinese Simplified', name: 'Chinese (Simplified)', native: '简体中文' },
    { code: 'Chinese Traditional', name: 'Chinese (Traditional)', native: '繁體中文' },
    { code: 'Japanese', name: 'Japanese', native: '日本語' },
    { code: 'Korean', name: 'Korean', native: '한국어' },
    { code: 'Vietnamese', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'French', name: 'French', native: 'Français' },
    { code: 'German', name: 'German', native: 'Deutsch' },
    { code: 'Spanish', name: 'Spanish', native: 'Español' },
];

export default function ImageToText() {
    const { t } = useLanguage();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
    const [extractedText, setExtractedText] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState<string>("");
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [imageName, setImageName] = useState<string>("");
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedLangs, setSelectedLangs] = useState<string[]>(['English']);
    const [langPickerOpen, setLangPickerOpen] = useState(false);
    const [layoutMode, setLayoutMode] = useState<string>('auto');
    const [layoutPickerOpen, setLayoutPickerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const langPickerRef = useRef<HTMLDivElement>(null);
    const layoutPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedHistory = localStorage.getItem('ocr-history');
        if (savedHistory) {
            try { setHistory(JSON.parse(savedHistory)); } catch { /* ignore */ }
        }
        const savedLangs = localStorage.getItem('ocr-langs');
        if (savedLangs) {
            try {
                const parsed = JSON.parse(savedLangs);
                if (Array.isArray(parsed) && parsed.length > 0) setSelectedLangs(parsed);
            } catch { /* ignore */ }
        }
        const savedLayout = localStorage.getItem('ocr-layout');
        if (savedLayout && LAYOUT_MODES.some((m) => m.code === savedLayout)) {
            setLayoutMode(savedLayout);
        }
    }, []);

    useEffect(() => {
        if (history.length > 0) localStorage.setItem('ocr-history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('ocr-langs', JSON.stringify(selectedLangs));
    }, [selectedLangs]);

    useEffect(() => {
        localStorage.setItem('ocr-layout', layoutMode);
    }, [layoutMode]);

    useEffect(() => {
        if (!langPickerOpen) return;
        const onDown = (e: MouseEvent) => {
            if (langPickerRef.current && !langPickerRef.current.contains(e.target as Node)) setLangPickerOpen(false);
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, [langPickerOpen]);

    useEffect(() => {
        if (!layoutPickerOpen) return;
        const onDown = (e: MouseEvent) => {
            if (layoutPickerRef.current && !layoutPickerRef.current.contains(e.target as Node)) setLayoutPickerOpen(false);
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, [layoutPickerOpen]);

    const toggleLang = (code: string) => {
        setSelectedLangs((prev) => {
            if (prev.includes(code)) {
                if (prev.length === 1) return prev;
                return prev.filter((c) => c !== code);
            }
            return [...prev, code];
        });
    };

    const selectedLangLabel = useMemo(() => {
        if (selectedLangs.length === 0) return 'English';
        if (selectedLangs.length === 1) {
            return SUPPORTED_LANGUAGES.find((l) => l.code === selectedLangs[0])?.name ?? 'English';
        }
        return `${selectedLangs.length} languages`;
    }, [selectedLangs]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload a valid image file");
            return;
        }
        setImageName(file.name);
        setImageMimeType(file.type || "image/jpeg");
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target?.result as string;
            setSelectedImage(imageData);
            setExtractedText("");
            setIsEditing(false);
            extractTextFromImage(imageData, file.name, file.type || "image/jpeg");
        };
        reader.readAsDataURL(file);
    };

    const retryExtraction = () => {
        if (!selectedImage) return;
        extractTextFromImage(selectedImage, imageName, imageMimeType);
    };

    const extractTextFromImage = async (imageData: string, fileName: string, mimeType: string) => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData,
                    mimeType,
                    langs: selectedLangs,
                    layoutMode,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (res.status === 422) {
                    toast.error("No text detected. Try a clearer image.", { duration: 5000 });
                } else {
                    toast.error((err as any).error || t.imageToText?.status?.error || "Failed to extract text");
                }
                return;
            }

            const { text } = await res.json();

            setExtractedText(text);
            setEditedText(text);
            setHistory((prev) => [
                { id: Date.now().toString(), text, timestamp: Date.now(), imageName: fileName, langs: selectedLangs },
                ...prev,
            ]);
            toast.success(t.imageToText?.status?.success || "Text extracted successfully!");
        } catch (error) {
            console.error("OCR Error:", error);
            toast.error(t.imageToText?.status?.error || "Failed to extract text from image");
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        const textToCopy = isEditing ? editedText : extractedText;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            toast.success(t.imageToText?.status?.copied || "Text copied to clipboard!");
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedText(extractedText);
    };

    const handleSaveEdit = () => {
        setExtractedText(editedText);
        setIsEditing(false);
        setHistory((prev) => {
            const updated = [...prev];
            if (updated.length > 0) updated[0] = { ...updated[0], text: editedText };
            return updated;
        });
        toast.success(t.toast?.success?.updated || "Text updated successfully!");
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedText(extractedText);
    };

    const loadHistoryItem = (item: HistoryItem) => {
        setExtractedText(item.text);
        setEditedText(item.text);
        setIsEditing(true);
        setShowHistory(false);
        toast.success(t.toast?.success?.saved || "History item loaded!");
    };

    const deleteHistoryItem = (id: string) => {
        const updatedHistory = history.filter((item) => item.id !== id);
        setHistory(updatedHistory);
        localStorage.setItem('ocr-history', JSON.stringify(updatedHistory));
        toast.success(t.toast?.success?.deleted || "History item deleted!");
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('ocr-history');
        toast.success(t.toast?.success?.deleted || "History cleared!");
    };

    return (
        <div className="w-full min-h-screen flex flex-col bg-slate-50 dark:bg-[#0d1117]">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-5xl mx-auto space-y-4">

                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm">
                            <ScanText className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Image to Text
                                <PageHelpTooltip subtitle={t.pageHelp.imagetotext.subtitle} description={t.pageHelp.imagetotext.description} />
                            </h1>
                            <p className="text-xs text-sky-500 dark:text-sky-400 mt-0.5">
                                Multilingual OCR powered by Lumina Engine
                            </p>
                        </div>
                    </div>

                    {/* Controls toolbar */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Language picker */}
                        <div className="relative" ref={langPickerRef}>
                            <button
                                onClick={() => setLangPickerOpen((v) => !v)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm transition-all shadow-sm"
                            >
                                <Languages className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                                <span className="font-medium">{selectedLangLabel}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langPickerOpen ? "rotate-180" : ""}`} />
                            </button>
                            {langPickerOpen && (
                                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-30 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Select languages</span>
                                    </div>
                                    <p className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                        Combine scripts for mixed documents. English is added automatically.
                                    </p>
                                    <div className="max-h-72 overflow-y-auto py-1">
                                        {SUPPORTED_LANGUAGES.map((lang) => {
                                            const checked = selectedLangs.includes(lang.code);
                                            return (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => toggleLang(lang.code)}
                                                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                                                >
                                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${checked ? "bg-gradient-to-br from-sky-500 to-indigo-500 border-sky-400" : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"}`}>
                                                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{lang.name}</p>
                                                        {lang.native && lang.native !== lang.name && (
                                                            <p className="text-xs text-slate-500 truncate">{lang.native}</p>
                                                        )}
                                                    </div>
                                                    {lang.preferBest && (
                                                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-400/30 px-1.5 py-0.5 rounded">BEST</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Layout mode picker */}
                        <div className="relative" ref={layoutPickerRef}>
                            <button
                                onClick={() => setLayoutPickerOpen((v) => !v)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm transition-all shadow-sm"
                                title="Page segmentation strategy"
                            >
                                <LayoutGrid className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                <span className="font-medium">
                                    {LAYOUT_MODES.find((m) => m.code === layoutMode)?.name ?? 'Auto'} Layout
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${layoutPickerOpen ? "rotate-180" : ""}`} />
                            </button>
                            {layoutPickerOpen && (
                                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-30 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <LayoutGrid className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Layout mode</span>
                                    </div>
                                    <p className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                        Choose how the page is segmented. Auto handles photos + text correctly.
                                    </p>
                                    <div className="py-1">
                                        {LAYOUT_MODES.map((mode) => {
                                            const active = layoutMode === mode.code;
                                            return (
                                                <button
                                                    key={mode.code}
                                                    onClick={() => { setLayoutMode(mode.code); setLayoutPickerOpen(false); }}
                                                    className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${active ? "bg-sky-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/80"}`}
                                                >
                                                    <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${active ? "border-sky-400 bg-sky-400/30" : "border-slate-300 dark:border-slate-600"}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${active ? "text-sky-600 dark:text-sky-200" : "text-slate-700 dark:text-slate-100"}`}>{mode.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{mode.hint}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* History button */}
                        <div className="ml-auto">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm transition-all shadow-sm"
                            >
                                <History className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                <span className="font-medium">History</span>
                                {history.length > 0 && (
                                    <span className="bg-sky-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow shadow-sky-500/30">
                                        {history.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* History Panel */}
                    {showHistory ? (
                        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-sm dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <History className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                        Extraction History
                                        <span className="ml-2 text-sm font-medium text-slate-500">({history.length})</span>
                                    </h2>
                                </div>
                                {history.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-600 dark:text-rose-300 text-sm font-medium transition-all"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                                {history.length === 0 ? (
                                    <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                            <History className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">No history yet</p>
                                        <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Extracted text will appear here</p>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 hover:border-sky-400/60 dark:hover:border-sky-500/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group"
                                            onClick={() => loadHistoryItem(item)}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleString()}</p>
                                                    {item.imageName && (
                                                        <p className="text-xs text-sky-600 dark:text-sky-300 mt-1 truncate font-medium">{item.imageName}</p>
                                                    )}
                                                    {item.langs && item.langs.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {item.langs.map((c) => (
                                                                <span key={c} className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{c}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                                                    className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 leading-relaxed">{item.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                                id="image-upload"
                            />

                            {/* Upload zone */}
                            {!selectedImage ? (
                                <label
                                    htmlFor="image-upload"
                                    className="group relative flex flex-col items-center justify-center w-full min-h-[280px] sm:min-h-[320px] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-400/60 dark:hover:border-sky-500/50 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/70 rounded-2xl cursor-pointer transition-all duration-300"
                                >
                                    <div className="flex flex-col items-center gap-5 px-6 py-10">
                                        <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                                            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-sky-500 dark:text-sky-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-800 dark:text-white text-base sm:text-lg font-bold mb-1.5">
                                                Drop your image here or Click to browse
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                                Supports PNG, JPG, JPEG up to 10MB
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6 flex-wrap justify-center">
                                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                                <CheckCircle className="w-4 h-4" /> Multi-column detection
                                            </span>
                                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                                <CheckCircle className="w-4 h-4" /> High-fidelity extraction
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            ) : !extractedText ? (
                                <div className="space-y-4">
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                                        <img
                                            src={selectedImage}
                                            alt="Uploaded"
                                            className="w-full h-auto max-h-96 object-contain"
                                        />
                                        {!isProcessing && (
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between gap-3">
                                                <p className="text-sm text-slate-200 truncate">{imageName}</p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={retryExtraction}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700"
                                                    >
                                                        Retry
                                                    </button>
                                                    <label
                                                        htmlFor="image-upload"
                                                        className="px-3 py-1.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-semibold cursor-pointer shadow shadow-sky-500/30"
                                                    >
                                                        Replace
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {isProcessing && (
                                        <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-300">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm font-semibold">{progressLabel || "Processing"}</span>
                                                </div>
                                                <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Extracted Text Section */}
                            {extractedText && (
                                <div className="space-y-4">
                                    {/* Image meta strip */}
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                                        <div
                                            onClick={() => setShowImagePreview(true)}
                                            className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-sky-400 cursor-pointer transition-all group shrink-0"
                                        >
                                            <img src={selectedImage!} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ImageIcon className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-800 dark:text-slate-100 text-sm font-semibold truncate">{imageName}</p>
                                            <p className="text-slate-500 text-xs">Click image to expand</p>
                                        </div>
                                        <button
                                            onClick={retryExtraction}
                                            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-all"
                                            title="Re-run OCR with current language selection"
                                        >
                                            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-300" />
                                            Retry
                                        </button>
                                        <label
                                            htmlFor="image-upload"
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-sm font-semibold transition-all shadow shadow-sky-500/30 cursor-pointer"
                                        >
                                            <Upload className="w-4 h-4" />
                                            New
                                        </label>
                                    </div>

                                    {/* Extracted Text Card */}
                                    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Extracted Text</h2>
                                                <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                                                    {extractedText.length.toLocaleString()} chars
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                {!isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={handleEdit}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 font-semibold transition-all text-sm"
                                                        >
                                                            <Edit2 className="w-4 h-4 text-sky-500 dark:text-sky-300" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={copyToClipboard}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold transition-all shadow shadow-sky-500/30 text-sm"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                            Copy
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all text-sm"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold transition-all shadow shadow-emerald-500/30 text-sm"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                            Save
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-white rounded-2xl p-4 border border-slate-200 dark:border-slate-300 max-h-[28rem] overflow-y-auto hide-scrollbar">
                                            {isEditing ? (
                                                <textarea
                                                    value={editedText}
                                                    onChange={(e) => setEditedText(e.target.value)}
                                                    className="w-full min-h-[300px] bg-transparent text-slate-900 text-sm sm:text-base resize-none focus:outline-none leading-relaxed"
                                                    placeholder="Edit your text here..."
                                                />
                                            ) : (
                                                <pre className="text-slate-900 text-sm sm:text-base whitespace-pre-wrap leading-relaxed font-sans">
                                                    {extractedText}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Preview Modal */}
                            {showImagePreview && (
                                <div
                                    className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                    onClick={() => setShowImagePreview(false)}
                                >
                                    <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setShowImagePreview(false)}
                                            className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <img
                                            src={selectedImage!}
                                            alt="Full preview"
                                            className="w-full h-full object-contain rounded-2xl border border-slate-800"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
