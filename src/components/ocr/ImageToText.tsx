"use client";
import { useState, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";
import { Upload, Image as ImageIcon, Copy, Trash2, FileText, Loader2, CheckCircle, Info, Edit2, Save, History, X, ArrowLeft, Languages } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

interface HistoryItem {
    id: string;
    text: string;
    timestamp: number;
    imageName?: string;
}

const SUPPORTED_LANGUAGES = [
    { code: 'eng', name: 'English' },
    { code: 'lao', name: 'Lao' },
    { code: 'tha', name: 'Thai' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'chi_tra', name: 'Chinese (Traditional)' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'vie', name: 'Vietnamese' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'spa', name: 'Spanish' },
];

export default function ImageToText() {
    const { t } = useLanguage();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState<string>("");
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [imageName, setImageName] = useState<string>("");
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('eng');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('ocr-history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (error) {
                console.error("Failed to load history:", error);
            }
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem('ocr-history', JSON.stringify(history));
        }
    }, [history]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Please upload a valid image file");
                return;
            }

            setImageName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target?.result as string;
                setSelectedImage(imageData);
                setExtractedText("");
                setProgress(0);
                setIsEditing(false);

                // Auto extract text
                extractTextFromImage(imageData, file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const extractTextFromImage = async (imageData: string, fileName: string) => {
        setIsProcessing(true);
        setProgress(0);

        try {
            const result = await Tesseract.recognize(
                imageData,
                selectedLanguage,
                {
                    logger: (m: { status: string; progress: number }) => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text.trim();

            // Check if no text was extracted
            if (!text || text.length === 0) {
                toast.error(t.imageToText?.status?.error || "No text found in the image. Please upload an image with readable text.");
                setSelectedImage(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }

            setExtractedText(text);
            setEditedText(text);

            // Add to history
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                text: text,
                timestamp: Date.now(),
                imageName: fileName
            };
            setHistory(prev => [newHistoryItem, ...prev]);

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

        // Update history with edited text
        setHistory(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
                updated[0] = { ...updated[0], text: editedText };
            }
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
        const updatedHistory = history.filter(item => item.id !== id);
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
        <div className="w-full min-h-screen flex flex-col bg-tool">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-serif">
                                    IMAGE2TEXT
                                </h1>
                                <div className="relative">
                                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-700 border border-gray-600">
                                    <Languages className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                        className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer"
                                    >
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <option key={lang.code} value={lang.code} className="bg-gray-800">
                                                {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-all border border-gray-600 text-sm"
                                >
                                    <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                                    <span className="font-semibold">History</span>
                                    {history.length > 0 && (
                                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                                            {history.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-300 text-xs sm:text-sm">
                            Upload an image and extract text using OCR technology
                        </p>
                    </div>

                    {/* History Panel */}
                    {showHistory ? (
                        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="p-2 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <History className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-lg sm:text-xl font-bold text-white">
                                        History ({history.length})
                                    </h2>
                                </div>
                                {history.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm transition-all"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                                {history.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No history yet</p>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-gray-900/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-all cursor-pointer group"
                                            onClick={() => loadHistoryItem(item)}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </p>
                                                    {item.imageName && (
                                                        <p className="text-xs text-blue-400 mt-1">
                                                            {item.imageName}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteHistoryItem(item.id);
                                                    }}
                                                    className="p-1 rounded hover:bg-red-600 text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-gray-300 text-sm line-clamp-3">
                                                {item.text}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Upload Section */}
                            <div className="mb-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                    id="image-upload"
                                />

                                {!selectedImage ? (
                                    <label
                                        htmlFor="image-upload"
                                        className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 bg-white/5 border-dashed border-white/25 rounded-xl cursor-pointer hover:border-blue-500 transition-all duration-300 bg-gray-800/50"
                                    >
                                        <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mb-4" />
                                        <p className="text-gray-300 text-base sm:text-lg font-semibold mb-2">
                                            Click to upload image
                                        </p>
                                        <p className="text-gray-500 text-xs sm:text-sm">
                                            PNG, JPG, JPEG up to 10MB
                                        </p>
                                    </label>
                                ) : !extractedText ? (
                                    <div className="space-y-4">
                                        <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-blue-400 bg-gray-800/50">
                                            <img
                                                src={selectedImage}
                                                alt="Uploaded"
                                                className="w-full h-auto max-h-96 object-contain"
                                            />
                                        </div>

                                        {isProcessing && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center gap-2 text-blue-400">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span className="text-sm font-semibold">Processing... {progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>

                            {/* Extracted Text Section - Main Section */}
                            {extractedText && (
                                <div className="space-y-4">
                                    {/* Small Image Preview */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            onClick={() => setShowImagePreview(true)}
                                            className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-600 hover:border-blue-400 cursor-pointer transition-all group"
                                        >
                                            <img
                                                src={selectedImage!}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ImageIcon className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-400 text-xs">Click image to preview</p>
                                            <p className="text-gray-300 text-sm font-semibold">{imageName}</p>
                                        </div>
                                        <label
                                            htmlFor="image-upload"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md cursor-pointer text-sm"
                                        >
                                            <Upload className="w-4 h-4" />
                                            New Image
                                        </label>
                                    </div>

                                    {/* Extracted Text - Main Content */}
                                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                                <h2 className="text-lg sm:text-xl font-bold text-white">
                                                    Extracted Text
                                                </h2>
                                            </div>
                                            <div className="flex gap-2">
                                                {!isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={handleEdit}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md text-sm"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={copyToClipboard}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all shadow-md text-sm"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                            Copy
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-all shadow-md text-sm"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-md text-sm"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                            Save
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600 max-h-96 overflow-y-auto hide-scrollbar">
                                            {isEditing ? (
                                                <textarea
                                                    value={editedText}
                                                    onChange={(e) => setEditedText(e.target.value)}
                                                    className="w-full min-h-[300px] bg-transparent text-gray-200 text-sm sm:text-base resize-none focus:outline-none"
                                                    placeholder="Edit your text here..."
                                                />
                                            ) : (
                                                <pre className="text-gray-200 text-sm sm:text-base whitespace-pre-wrap">
                                                    {extractedText}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Preview Modal */}
                            {showImagePreview && (
                                <>
                                    <div
                                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                                        onClick={() => setShowImagePreview(false)}
                                    >
                                        <div className="relative max-w-4xl max-h-[90vh] w-full">
                                            <button
                                                onClick={() => setShowImagePreview(false)}
                                                className="absolute -top-10 right-0 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                            <img
                                                src={selectedImage!}
                                                alt="Full preview"
                                                className="w-full h-full object-contain rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
